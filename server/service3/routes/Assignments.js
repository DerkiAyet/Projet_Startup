const express = require('express')
const router = express.Router()
const CommentModel = require('../models/Comments')
const AssignmentModel = require('../models/Assignments')
const QuizeModel = require('../models/Quizes')
const SolvingModel = require('../models/Solving')
const { discoverAuthService } = require('../config/discovery.service')
const multer = require('multer')
const QuizAttemptModel = require('../models/QuizAttempts')
const { enrichContent } = require('./Courses')
const { resolveCategory, resolveField, resolveUser, resolveUserInterests, resolveOtherUser, deleteByPattern } = require('../helpers/utils')
const redis = require('../config/redis.config')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'exerciseFiles') {
            cb(null, 'uploads/files/')
        } else {
            cb(null, 'uploads/images/')
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 50 * 1024 * 1024  // 50MB to handle base64 images in lesson HTML
    }
})

router.post('/', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'exerciseFiles', maxCount: 20 } // multiple exercise files
]), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });

    // thumbnail stays the same
    const thumbnail = req.files?.thumbnail?.[0]?.filename
        ? `images/${req.files.thumbnail[0].filename}`
        : null;

    // build a map of exerciseIndex → fileUrl
    // frontend will send files named "exerciseFiles" with index in the field
    const exerciseFileMap = {};
    if (req.files?.exerciseFiles) {
        req.files.exerciseFiles.forEach((file) => {
            // filename pattern: exerciseIndex_timestamp_originalname
            // we extract the index from the originalname prefix we set on frontend
            const index = file.originalname.split('_')[0];
            exerciseFileMap[index] = `files/${file.filename}`;
        });
    }

    let { title, description, level, category, exercises, tags } = req.body || {};

    try {
        exercises = exercises ? JSON.parse(exercises) : [];
    } catch {
        exercises = [];
    }
    try {
        tags = tags ? JSON.parse(tags) : [];
    } catch {
        tags = [];
    }

    // inject fileUrl into the matching exercise
    exercises = exercises.map((ex, i) => {
        if (exerciseFileMap[String(i)]) {
            return { ...ex, fileUrl: exerciseFileMap[String(i)] };
        }
        return ex;
    });

    if (!title || !category || !level) {
        return res.status(400).json({ error: "Missing required fields: title, category, or level" });
    }

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const newAssignment = await AssignmentModel.create({
            teacherId,
            title,
            description,
            thumbnail,
            level,
            category: JSON.parse(category),
            exercises,
            tags
        });

        newAssignment.maxScore = newAssignment.calculateMaxScore();
        await newAssignment.save()

        await redis.del(`teacherAssigns:${teacherId}`)
        await deleteByPattern("recommendedAssigns:*")
        res.status(201).json({ message: "assignment created successfully", assignment: newAssignment });

    } catch (error) {
        console.error("Error creating assignment:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put('/:assignId', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    const { assignId } = req.params;

    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });
    if (!assignId) return res.status(400).json({ error: "Missing assignment ID in parameters" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : undefined;

    let { title, description, level, category, exercises, tags } = req.body || {};

    try {
        exercises = exercises ? JSON.parse(exercises) : undefined;
    } catch {
        exercises = undefined;
    }
    try {
        tags = tags ? JSON.parse(tags) : undefined;
    } catch {
        tags = undefined;
    }

    try {

        const assignment = await AssignmentModel.findById(assignId);
        if (!assignment) return res.status(404).json({ error: "assignment not found" });
        if (assignment.teacherId !== teacherId) return res.status(403).json({ error: "You can only update your own assignments" });

        if (title) assignment.title = title;
        if (description) assignment.description = description;
        if (thumbnail) assignment.thumbnail = thumbnail;
        if (level) assignment.level = level;
        if (category) assignment.category = JSON.parse(category);
        if (exercises) assignment.exercises = exercises;
        if (tags) assignment.tags = tags;

        await assignment.save();
        await redis.del(`teacherAssigns:${teacherId}`)
        res.status(200).json({ message: "assignment updated successfully", assignment });

    } catch (error) {
        console.error("Error updating assignment:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/recommended/me', async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        const cachedKey = `recommendedAssigns:${currentUserId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        let interestIds = await resolveUserInterests(currentUserId, null)

        const assignments = await AssignmentModel.find({
            visibility: true,
            "category.id": { $in: interestIds }
        });

        if (!assignments.length) return res.json([]);

        const enriched = (await Promise.all(
            assignments.map(a => enrichContent(a, "assignment", [], []))
        )).filter(Boolean);

        // sort by most recent
        enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        await redis.setex(cachedKey, 120, JSON.stringify(enriched))
        res.json(enriched);

    } catch (err) {
        console.error("Error fetching recommended courses:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/', async (req, res) => {
    try {

        const assigns = await AssignmentModel.find()

        const enrichedAssigns = await Promise.all(
            assigns.map(async (assign) => {
                try {
                    return enrichContent(assign, "assignment")
                } catch (error) {
                    console.error("Error while fetching for the assigns", error.message)
                }
            })
        )

        res.status(200).json(enrichedAssigns)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher/:teacherId', async (req, res) => {

    const teacherId = req.params.teacherId

    try {

        const assigns = await AssignmentModel.find({ teacherId: teacherId })
        const enrichedAssigns = await Promise.all(
            assigns.map(async (assign) => {
                try {
                    let responseCategory = await resolveCategory(assign.category.id)
                    let responseField = await resolveField(assign.category.subCategory);

                    const comments = await CommentModel.find({
                        contentId: assign._id,
                        contentType: "assignment"
                    });

                    const solutions = await SolvingModel.find({ assignment: assign._id })

                    const thumbnail = assign.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                    return {
                        _id: assign._id,
                        teacherId: assign.teacherId,
                        title: assign.title,
                        description: assign.description,
                        thumbnail,
                        level: assign.level,
                        category: {
                            idSubject: responseCategory.idSubject,
                            name: responseCategory.name,
                            color: responseCategory.color
                        },
                        subCategory: responseField
                            ? {
                                idSub: responseField.idSub,
                                name: responseField.name
                            }
                            : null,
                        exercises: assign.exercises,
                        tags: assign.tags,
                        ratings: assign.ratings,
                        avgRating: assign.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        solveCount: solutions.length,
                        visibility: assign.visibility,
                        createdAt: assign.createdAt,
                    }
                } catch (error) {
                    console.error("Error while fetching for the assigns", error.message)
                }
            })
        )

        res.status(200).json(enrichedAssigns)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher-assigns', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {
        const cachedKey = `teacherAssigns:${userId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const assigns = await AssignmentModel.find({ teacherId: userId })
        const enrichedAssigns = await Promise.all(
            assigns.map(async (assign) => {
                try {
                    let responseCategory = await resolveCategory(assign.category.id)
                    let responseField = await resolveField(assign.category.subCategory);

                    const comments = await CommentModel.find({
                        contentId: assign._id,
                        contentType: "assignment"
                    });

                    const solutions = await SolvingModel.find({ assignment: assign._id })

                    const thumbnail = assign.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${assign.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                    return {
                        _id: assign._id,
                        teacherId: assign.teacherId,
                        title: assign.title,
                        description: assign.description,
                        thumbnail,
                        level: assign.level,
                        category: {
                            idSubject: responseCategory.idSubject,
                            name: responseCategory.name,
                            color: responseCategory.color
                        },
                        subCategory: responseField
                            ? {
                                idSub: responseField.idSub,
                                name: responseField.name
                            }
                            : null,
                        exercises: assign.exercises,
                        tags: assign.tags,
                        ratings: assign.ratings,
                        avgRating: assign.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        solveCount: solutions.length,
                        visibility: assign.visibility,
                        createdAt: assign.createdAt,
                    }
                } catch (error) {
                    console.error("Error while fetching for the assigns", error.message)
                }
            })
        )
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedAssigns))
        res.status(200).json(enrichedAssigns)
    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher-assigns/:userName', async (req, res) => {
    try {
        const assignCachedKey = `teacher:assigns:${req.params.userName}`
        const assignsCached = await redis.get(assignCachedKey)
        if (assignsCached) return res.status(200).json(JSON.parse(assignsCached))

        const userInfos = await resolveOtherUser(req.params.userName)

        const assignments = await AssignmentModel.find({ teacherId: userInfos.id })
        const enrichedAssigns = await Promise.all(
            assignments.map(async (assign) => {
                try {
                    const responseUser = userInfos
                    const responseCategory = await resolveCategory(assign.category.id)
                    const responseField = await resolveField(assign.category.subCategory);

                    const comments = await CommentModel.find({
                        contentId: assign._id,
                        contentType: "assignment"
                    });

                    const solutions = await SolvingModel.find({ assignment: assign._id })

                    const thumbnail = assign.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${assign.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                    return {
                        _id: assign._id,
                        teacherId: assign.teacherId,
                        title: assign.title,
                        description: assign.description,
                        thumbnail,
                        level: assign.level,
                        category: {
                            idSubject: responseCategory.idSubject,
                            name: responseCategory.name,
                            color: responseCategory.color
                        },
                        subCategory: responseField
                            ? {
                                idSub: responseField.idSub,
                                name: responseField.name
                            }
                            : null,
                        exercises: assign.exercises,
                        tags: assign.tags,
                        ratings: assign.ratings,
                        avgRating: assign.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        solveCount: solutions.length,
                        visibility: assign.visibility,
                        createdAt: assign.createdAt,
                        teacher: {
                            userId: responseUser.id,
                            userName: responseUser.userName,
                            familyName: responseUser.familyName,
                            givenName: responseUser.givenName,
                            userImg: responseUser.userImg,
                            role: "teacher"
                        }
                    }

                } catch (error) {
                    console.error("Error while fetching for the quizes", error.message)
                }
            })
        )

        await redis.setex(assignCachedKey, 120, JSON.stringify(enrichedAssigns))
        res.status(200).json(enrichedAssigns);

    } catch (error) {
        console.log("error: ", error.message)
        res.status(500).json({ error: error.message });
    }
})

router.get('/:id', async (req, res) => {
    const assignId = req.params.id
    try {
        const assignment = await AssignmentModel.findById(assignId);
        if (!assignment) return res.status(404).json({ error: "assignment not found" });

        const responseUser = await resolveUser(assignment.teacherId);
        let responseCategory = await resolveCategory(assignment.category.id);
        let responseField = await resolveField(assignment.category.subCategory);

        const thumbnail = assignment.thumbnail
            ? `${process.env.GATEWAY_URI}/content/uploads/${assignment.thumbnail}`
            : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

        const solutions = await SolvingModel.find({ assignment: assignment._id })

        const comments = await CommentModel.find({ contentId: assignId, contentType: "assignment" })
        let enrichedComments;
        if (comments) {
            enrichedComments = await Promise.all(
                comments.map(async (c) => {
                    let resolvedCommentUser = await resolveUser(c.userId)

                    const replies = c.replies
                    let enrichedReplies
                    if (replies) {
                        enrichedReplies = await Promise.all(
                            replies.map(async (r) => {
                                let resolvedUser = await resolveUser(r.userId)

                                return {
                                    _id: r._id,
                                    text: r.text,
                                    likes: r.likes,
                                    userName: resolvedUser.userName,
                                    familyName: resolvedUser.familyName,
                                    givenName: resolvedUser.givenName,
                                    userImg: resolvedUser.uerImg,
                                    role: resolvedUser.role
                                }
                            })
                        )
                    }

                    return {
                        _id: c._id,
                        text: c.text,
                        replies: enrichedReplies,
                        likes: c.likes,
                        userName: resolvedCommentUser.userName,
                        familyName: resolvedCommentUser.familyName,
                        givenName: resolvedCommentUser.givenName,
                        userImg: resolvedCommentUser.uerImg,
                        role: resolvedCommentUser.role,
                    }
                })
            )
        }

        const finalAssignment = {
            assignment: {
                _id: assignment._id,
                teacherId: assignment.teacherId,
                title: assignment.title,
                description: assignment.description,
                thumbnail,
                level: assignment.level,
                category: {
                    idSubject: responseCategory.idSubject,
                    name: responseCategory.name,
                    color: responseCategory.color
                },
                subCategory: responseField
                    ? {
                        idSub: responseField.idSub,
                        name: responseField.name
                    }
                    : null,
                exercises: assignment.exercises,
                tags: assignment.tags,
                ratings: assignment.ratings,
                avgRating: assignment.averageRating(),
                comments: enrichedComments,
                commentsCount: comments.length,
                solveCount: solutions.length,
                visibility: assignment.visibility,
                createdAt: assignment.createdAt,
            },
            comments: enrichedComments,
            teacher: {
                userId: responseUser.id,
                userName: responseUser.userName,
                familyName: responseUser.familyName,
                givenName: responseUser.givenName,
                userImg: responseUser.uerImg,
                role: "teacher"
            } || null
        }

        res.status(200).json(finalAssignment)

    } catch (error) {
        console.log("Internal Error Server", error.message)
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const assignment = await AssignmentModel.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: "assignment not found" });

        if (assignment.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await assignment.deleteOne();

        await redis.del(`teacherAssigns:${req.headers['x-user-id']}`)
        res.json({ message: "assignment deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//-----------Comments & Rating
router.get('/:id/comments', async (req, res) => {
    const courseId = req.params.id

    try {
        const comments = await CommentModel.find({ contentId: courseId, contentType: "assignment" })
        res.status(200).json(comments)
    } catch (error) {
        console.error("error while fetching comments", error.message)
    }
})

router.post('/:assignId/comment', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const assignId = req.params.assignId

    try {

        const assign = await AssignmentModel.findById(assignId)
        if (!assign) return res.status(404).json({ error: "assignment not found" })

        const newComment = await CommentModel.create({
            userId: userId,
            contentId: assignId,
            text: req.body.text,
            contentType: "assignment"
        })

        res.status(200).json(newComment)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})


router.post('/:assignId/comment/:commentId/reply', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const assignId = req.params.assignId
    const commentId = req.params.commentId

    try {

        const assignment = await AssignmentModel.findById(assignId)
        if (!assignment) return res.status(404).json({ error: "assignment not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "assignment not found" })

        const reply = {
            userId: userId,
            text: req.body.text,
        }

        comment.replies.push(reply)
        await comment.save()

        // Send back the actual new reply (last item after save)
        const savedReply = comment.replies[comment.replies.length - 1]
        res.status(200).json(savedReply)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})

router.post('/:assignId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const assignId = req.params.assignId
        const commentId = req.params.commentId

        const assignment = await AssignmentModel.findById(assignId)
        if (!assignment) return res.status(404).json({ error: "assignment not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "assignment not found" })

        const alreadyLiked = comment.likes.some(like => like.userId == userId);

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(like => like.userId != userId);
        } else {
            comment.likes.push({ userId });
        }

        await comment.save();
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.delete("/:assignId/comment/:commentId", async (req, res) => {
    try {

        const comment = await CommentModel.findById(req.params.commentId)
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        comment.deleteOne();

        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/rating', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const assignment = await AssignmentModel.findById(req.params.id);
        const rating = req.body.rating

        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        const alreadyRated = assignment.ratings.find((userRating) => userRating.userId == userId)

        if (alreadyRated) {
            if (rating) alreadyRated.rating = rating
        } else {
            assignment.ratings.push({
                userId: userId,
                rating: rating
            })
        }
        await assignment.save()
        res.json(assignment);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.post('/quizes', async (req, res) => {

    const teacherId = req.headers['x-user-id']

    let { title, description, difficulty, category, questions, score } = req.body || {}

    if (!title || !difficulty) return res.status(400).json({ error: "Missing fields: title, difficulty" })

    try {

        const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const existedQuize = await QuizeModel.findOne({ teacherId: teacherId })

        if (existedQuize) return res.status(400).json({ quizExist: "a quize already exists for this course" })

        const newQuize = await QuizeModel.create({
            title,
            description,
            difficulty,
            category,
            questions,
            courseId,
            score
        })

        res.status(200).json(newQuize)

    } catch (error) {

        console.log("Internal Server error", error.message)
    }
})

router.put('/quizes/:quizId', async (req, res) => {

    const teacherId = req.headers['x-user-id']
    const quizId = req.params.quizId

    let { title, description, difficulty, questions, score } = req.body || {}

    try {
        questions = questions ? JSON.parse(questions) : undefined;
    } catch (error) {
        questions = []
    }

    try {

        const quizToUpdate = await QuizeModel.findById({ quizId })
        if (!quizToUpdate) return res.status(404).json({ nonExist: "this quiz doesn't exist" })
        if (quizToUpdate.teacherId !== teacherId) return res.status(400).json({ error: "Unathorized" })

        if (title) quizToUpdate.title = title
        if (description) quizToUpdate.description = description
        if (difficulty) quizToUpdate.difficulty = difficulty
        if (questions) quizToUpdate.questions = questions
        if (score) quizToUpdate.score = score

        await quizToUpdate.save()

        res.status(200).json({ message: "quiz updated", quizToUpdate })

    } catch (error) {

        console.log("Internal Server error", error.message)
    }
})

router.get('/quizes/:quizId', async (req, res) => {

    const quizId = req.params.quizId

    try {
        const quiz = await QuizeModel.findById(quizId)
        if (!quiz) return res.status(404).json({ nonExist: "this quiz doesn't exist" })

        const responseUser = await resolveUser(quiz.teacherId)
        const responseCategory = await resolveCategory(quiz.category.id)
        const responseField = await resolveField(quiz.category.subCategory);

        const finalQuiz = {
            _id: quiz._id,
            teacherId: quiz.teacherId,
            title: quiz.title,
            description: quiz.description,
            difficulty: quiz.difficulty,
            category: responseCategory ? {
                idSubject: responseCategory.idSubject,
                name: responseCategory.name,
                color: responseCategory.color
            } : null,
            subCategory: responseField
                ? {
                    idSub: responseField.idSub,
                    name: responseField.name
                }
                : null,
            questions: quiz.questions,
            score: quiz.score,
            teacher: {
                userId: responseUser.id,
                userName: responseUser.userName,
                familyName: responseUser.familyName,
                givenName: responseUser.givenName,
                userImg: responseUser.uerImg,
                role: "teacher"
            } || null
        }
        res.status(200).json(finalQuiz)

    } catch (error) {
        console.log("Internal Server error", error.message)
        res.status(500).json({ error: "Internal server error", message: error.message })
    }
})

module.exports = router;