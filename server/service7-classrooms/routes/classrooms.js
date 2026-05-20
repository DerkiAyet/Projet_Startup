// classrooms.js

const express = require('express')
const router = express.Router()
const { discoverAuthService } = require('../config/discovery.service')
const { getUser, getStudentInterests, getTeacherExpertise } = require('../config/kafka/consumer')
const axios = require('axios')
const ClassroomModel = require('../models/Classroom')
const ClassroomChatModel = require('../models/ClassroomChat')
const ClassroomPostModel = require('../models/ClassroomPost')
const { emitToRoom, publishNotification } = require('../config/kafka/producer')

async function resolveUser(userId) {
    let user = getUser(String(userId));
    if (!user) {
        const authServiceBaseUrl = await discoverAuthService();
        const { data } = await axios.get(
            `${authServiceBaseUrl}/get_user_byId/${userId}`,
            { timeout: 5000 }
        );
        user = {
            userId: data.user.id,
            userName: data.user.userName,
            familyName: data.user.familyName,
            givenName: data.user.givenName,
            userImg: data.user.usrImg,
            role: data.user.role
        };
    }
    return user;
}

async function enrichClassroom(classroom) {
    const creator = await resolveUser(classroom.teacherId);

    const students = await Promise.all(
        classroom.members.map(async (m) => await resolveUser(m.userId))
    );

    const pendingRequestsEnriched = await Promise.all(
        classroom.pendingRequests.map(async (r) => {
            const student = await resolveUser(r.userId)

            return {
                student,
                requestedAt: r.requestedAt
            }
        })
    )

    return {
        _id: classroom._id,
        creator,
        name: classroom.name,
        description: classroom.description,
        coverImage: classroom.coverImage,
        members: students,
        pendingRequests: pendingRequestsEnriched,
        isArchived: classroom.isArchived,
        createdAt: classroom.createdAt
    }
}

async function getIntrests(userId, userRole) {
    let userInterests;
    if (userRole === 'student') {
        userInterests = getStudentInterests(userId);
    } else if (userRole === 'teacher') {
        userInterests = getTeacherExpertise(userId);
    }

    // Fallback HTTP si pas encore en cache
    if (!userInterests || userInterests.length === 0) {
        const authServiceBaseUrl = await discoverAuthService();
        const { data } = await axios.get(
            `${authServiceBaseUrl}/infos/get-user-intrests`,
            { headers: { "x-user-id": userId }, timeout: 5000 }
        );
        userInterests = data;
    }

    return userInterests
}

router.post('/', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']

        if (userRole !== "teacher") return res.status(404).json('Forbidden Action')

        const { name, description, studentsIds } = req.body
        if (!name) return res.status(400).json('name is required')

        const members = studentsIds.map(id => {
            return {
                userId: Number(id),
                joinedAt: new Date()
            }
        })

        const newClassRoom = await ClassroomModel.create({
            teacherId,
            name,
            description,
            members
        })

        return res.status(201).json(newClassRoom)

    } catch (error) {
        console.log("error while creating a new classroom:", error.message)
        res.status(500).json({ msg: "Internal Server Error", error })
    }
})

//---GETTERS----------------------

router.get('/my-classrooms', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);
        const role = req.headers['x-user-role'];

        let classrooms;

        if (role === 'teacher') {
            classrooms = await ClassroomModel.find({ teacherId: userId });
        } else {
            classrooms = await ClassroomModel.find({ 'members.userId': userId });
        }

        const enrichedClassrooms = await Promise.all(
            classrooms.map(async (c) => await enrichClassroom(c))
        )

        return res.status(200).json(enrichedClassrooms);
    } catch (error) {
        console.log("error while fetching for classrooms:", error.message)
        res.status(500).json({ msg: "Internal Server Error", error })
    }
});

router.get('/recommended/me', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role'];
        if (userRole !== "teacher" && userRole !== "student") return res.status(403).json("Not allowed")

        const userInterests = await getIntrests(userId, userRole)

        const classrooms = await ClassroomModel.find()
        const filteredClassrooms = []
        for (const classroom of classrooms) {
            const teacherIntrests = await getIntrests(classroom.teacherId, "teacher")

            const shareCommon = teacherIntrests.some((id) =>
                userInterests.map(String).includes(String(id))
            );

            if (shareCommon) filteredClassrooms.push(classroom);
        }

        const enrichedClassrooms = await Promise.all(
            filteredClassrooms.map(async (c) => await enrichClassroom(c))
        )

        return res.status(200).json(enrichedClassrooms)

    } catch (error) {
        console.log("error while fetching for the recommended classes:", error.message)
        res.status(500).json({ msg: "Internal Server Error", error })
    }
})

router.get('/search', async (req, res) => { // put this before get(/:classrommId) to avoid any conflict
    try {
        const userId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']

        let { title, categoryId } = req.query

        const normalizeList = (value) => {
            if (!value) return []
            if (Array.isArray(value)) return value
            return value.split(',').map(v => v.trim())
        }

        const categoryIds = normalizeList(categoryId)

        // fetch all non-archived classrooms
        const classrooms = await ClassroomModel.find({ isArchived: false })

        // enrich all first so we have creator info
        const enriched = await Promise.all(classrooms.map(c => enrichClassroom(c)))

        // filter in memory
        const filtered = (await Promise.all(
            enriched.map(async (classroom) => {
                let matches = false

                if (title) {
                    const t = title.toLowerCase()
                    if (classroom.name.toLowerCase().includes(t)) matches = true

                    if (!matches) {
                        const fullName = `${classroom.creator.givenName} ${classroom.creator.familyName}`.toLowerCase()
                        if (fullName.includes(t)) matches = true
                    }
                }

                if (!matches && categoryIds.length) {
                    const teacherInterests = await getIntrests(classroom.creator.userId, "teacher")
                    if (teacherInterests?.length) {
                        matches = categoryIds.some(id =>
                            teacherInterests.map(String).includes(String(id))
                        )
                    }
                }

                if (!title && !categoryIds.length) matches = true

                return matches ? classroom : null
            })
        )).filter(Boolean)

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return res.status(200).json(filtered)

    } catch (err) {
        console.error("Search error:", err.message)
        res.status(500).json({ error: err.message })
    }
})

router.get('/:classroomId', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role'];

        if (userRole !== "teacher" && userRole !== "student") return res.status(403).json("Not allowed")
        const classroom = await ClassroomModel.findById(req.params.classroomId)
        if (!classroom) return res.status(404).json("classroom not found")

        const isTeacher = classroom.teacherId === userId
        const isMember = classroom.members.some((m) => m.userId === userId)

        if (!isMember && !isTeacher)
            return res.status(403).json({ error: 'Access denied' });

        const enrichedClassroom = await enrichClassroom(classroom)
        return res.status(200).json(enrichedClassroom)

    } catch (error) {
        console.log("error while fetching for the class:", error.message)
        res.status(500).json({ msg: "Internal Server Error", error })
    }
})

router.put('/:classroomId', async (req, res) => {  // it needs multer here
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const { name, description, coverImage } = req.body;

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can update this classroom' });

        if (name) classroom.name = name;
        if (description !== undefined) classroom.description = description;
        if (coverImage !== undefined) classroom.coverImage = coverImage;

        await classroom.save();
        return res.status(200).json(classroom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:classroomId/archive', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can archive this classroom' });

        classroom.isArchived = true;
        await classroom.save();
        return res.status(200).json({ message: 'Classroom archived', classroom });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:classroomId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Only the teacher can delete this classroom' });

        await classroom.deleteOne();
        return res.status(200).json({ message: 'Classroom deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/*------------MemberShip------------- */
router.put('/:classroomId/send-request', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "student") return res.status(403).json("Unauthorized")

        const classroom = await ClassroomModel.findById(req.params.classroomId)
        if (!classroom) return res.status(404).json("class not found")
        if (classroom.isArchived)
            return res.status(400).json({ error: 'Classroom is archived' });

        const alreadyMember = classroom.members.some(m => m.userId === studentId);
        if (alreadyMember)
            return res.status(200).json({ msgMember: 'You are already a member' });

        const alreadyRequested = classroom.pendingRequests.some((p) => p.userId === studentId)
        if (alreadyRequested) return res.status(200).json({ msgRequest: "already sent a request" })

        classroom.pendingRequests.push({ userId: studentId })
        await classroom.save()

        await publishNotification('JOIN_REQUEST', {
            idSender: studentId,
            idReceiver: classroom.teacherId,
            title: 'New join request',
            message: `A student requested to join ${classroom.name}`,
            metadata: { classroomId: classroom._id }
        });

        return res.status(200).json({ message: 'request sent' })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.get('/:classroomId/pending-requests', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json("Unauthorized")

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Access denied' });

        const enrichedRequests = await Promise.all(
            classroom.pendingRequests.map(async (r) => {
                const student = await resolveUser(r.userId)
                return {
                    student,
                    requestedAt: r.requestedAt
                }
            })
        )

        return res.status(200).json(enrichedRequests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:classroomId/accept/:studentId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json("Unauthorized")
        const studentId = Number(req.params.studentId)

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        const request = classroom.pendingRequests.some((r) => r.userId === studentId)
        if (!request) return res.status(404).json({ error: "student hasn't a join request" })

        classroom.pendingRequests = classroom.pendingRequests.filter((r) => r.userId !== studentId)
        classroom.members.push({ userId: studentId })
        await classroom.save()

        await publishNotification('JOIN_ACCEPTED', {
            idSender: teacherId,
            idReceiver: studentId,
            title: 'Join request accepted',
            message: `You have been accepted into ${classroom.name}`,
            metadata: { classroomId: classroom._id }
        });

        return res.status(200).json({ message: 'Student accepted', classroom });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.put('/:classroomId/reject/:studentId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json("Unauthorized")
        const studentId = Number(req.params.studentId)

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        const request = classroom.pendingRequests.some((r) => r.userId === studentId)
        if (!request) return res.status(404).json({ error: "student hasn't a join request" })

        classroom.pendingRequests = classroom.pendingRequests.filter((r) => r.userId !== studentId)
        await classroom.save()

        await publishNotification('JOIN_REJECTED', {
            idSender: teacherId,
            idReceiver: studentId,
            title: 'Join request refused',
            message: `Unfortunatly your request has been rejected to class ${classroom.name}`,
            metadata: { classroomId: classroom._id }
        });

        return res.status(200).json({ message: 'Student accepted', classroom });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// teacher remove a student ---------------------
router.put('/:classroomId/remove/:studentId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const studentId = Number(req.params.studentId);

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
        if (classroom.teacherId !== teacherId)
            return res.status(403).json({ error: 'Access denied' });

        classroom.members = classroom.members.filter(m => m.userId !== studentId);
        await classroom.save();

        await publishNotification('REMOVED_FROM_CLASSROOM', {
            idSender: teacherId,
            idReceiver: studentId,
            title: 'Removed from classroom',
            message: `You were removed from ${classroom.name}`,
            metadata: { classroomId: classroom._id }
        });

        return res.status(200).json({ message: 'Student removed', classroom });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Student leaves classroom ----------------------
router.put('/:classroomId/leave', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id']);
        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

        const isMember = classroom.members.some(m => m.userId === studentId);
        if (!isMember)
            return res.status(400).json({ error: 'You are not a member of this classroom' });

        classroom.members = classroom.members.filter(m => m.userId !== studentId);
        await classroom.save();

        return res.status(200).json({ message: 'You left the classroom' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//---POSTS----------------------

router.post('/:classroomId/posts', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(404).json('Forbidden Action')

        const classroom = await ClassroomModel.findById(req.params.classroomId)
        if (!classroom) return res.status(404).json("class not found")
        if (classroom.teacherId !== teacherId) return res.status(403).json("only the author of this class is allowed for this action")

        const { type, content, refId, refTitle, refThumbnail, refCategory } = req.body;
        if (type !== "text" && !refId) return res.status(400).json("enter a text or refer to a content at the least")

        const newPost = await ClassroomPostModel.create({
            classroomId: classroom._id,
            type,
            content,
            refId,
            refTitle,
            refThumbnail,
            refCategory
        })

        await emitToRoom(
            `classroom:${classroom._id}`,
            "classroom:new_post",
            { classroomId: classroom._id, post: newPost }
        )

        await Promise.all(
            classroom.members.map((m) => {
                publishNotification('NEW_CLASSROOM_POST', {
                    idSender: teacherId,
                    idReceiver: m.userId,
                    title: `New post in ${classroom.name}`,
                    message: type === 'text'
                        ? content
                        : `Teacher shared a new post of type ${type}: ${refTitle}`,
                    metadata: { classroomId: classroom._id, postId: newPost._id }
                })
            })
        )

        return res.status(200).json(newPost)
    } catch (error) {
        console.log("error: ", error.message);
        res.status(500).json({ error: error.message });
    }
})

router.get('/:classroomId/posts', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

        const isMember = classroom.members.some(m => m.userId === userId);
        const isTeacher = classroom.teacherId === userId;
        if (!isMember && !isTeacher)
            return res.status(403).json({ error: 'Access denied' });

        const posts = await ClassroomPostModel
            .find({ classroomId: classroom._id })
            .sort({ createdAt: 1 })

        return res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/posts/:postId', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const post = await ClassroomPostModel.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.authorId !== teacherId)
            return res.status(403).json({ error: 'Only the author can delete this post' });

        await post.deleteOne();
        return res.status(200).json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLASSROOM CHAT --------------------
router.post('/:classroomId/messages', async (req, res) => {
    try {
        const senderId = Number(req.headers['x-user-id']);
        const { message } = req.body;

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

        const isMember = classroom.members.some(m => m.userId === senderId);
        const isTeacher = classroom.teacherId === senderId;
        if (!isMember && !isTeacher)
            return res.status(403).json({ error: 'Access denied' });

        const chat = await ClassroomChatModel.create({
            classroomId: classroom._id,
            senderId,
            message,
            readBy: [{ userId: senderId }]
        });

        const senderInfos = await resolveUser(senderId)

        const enrichedChat = {
            _id: chat._id,
            senderId,          // ← already there, good
            message,
            readBy: chat.readBy,
            senderInfos,
            sentAt: chat.createdAt
        }

        await emitToRoom(
            `classroom:${classroom._id}`,
            'classroom:new_message',
            { classroomId: classroom._id, message: enrichedChat }
        );

        return res.status(201).json(enrichedChat);
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ error: err.message });
    }
});

// ── Get classroom chat messages ──────────────────────────────
router.get('/:classroomId/messages', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id']);

        const classroom = await ClassroomModel.findById(req.params.classroomId);
        if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

        const isMember = classroom.members.some(m => m.userId === userId);
        const isTeacher = classroom.teacherId === userId;
        if (!isMember && !isTeacher)
            return res.status(403).json({ error: 'Access denied' });

        const messages = await ClassroomChatModel
            .find({ classroomId: classroom._id })
            .sort({ createdAt: 1 })

        const enrichedMessages = await Promise.all(
            messages.map(async (m) => {
                const senderInfos = await resolveUser(m.senderId)
                return {
                    _id: m._id,        // ← add this
                    senderId: m.senderId,  // ← add this
                    message: m.message,
                    senderInfos,
                    readBy: m.readBy,
                    sentAt: m.createdAt
                }
            })
        )

        return res.status(200).json(enrichedMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router