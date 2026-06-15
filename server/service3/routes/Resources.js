require('dotenv').config({ path: '../config/config.env' });
const express = require('express')
const router = express.Router()
const ResourceModel = require('../models/Resources')
const CommentModel = require('../models/Comments')
const multer = require('multer')
const { resolveUser, resolveCategory, resolveField, resolveUserInterests, resolveOtherUser } = require('../helpers/utils')
const redis = require('../config/redis.config')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'attachmentFiles') {
            cb(null, 'uploads/attachments/')
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
        fieldSize: 50 * 1024 * 1024
    }
})

function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
        '.pdf': 'pdf',
        '.pptx': 'pptx', '.ppt': 'pptx',
        '.docx': 'docx', '.doc': 'docx',
        '.xlsx': 'xlsx', '.xls': 'xlsx',
        '.mp4': 'video', '.mov': 'video', '.avi': 'video',
        '.mp3': 'audio', '.wav': 'audio',
        '.zip': 'archive', '.rar': 'archive',
    };
    return map[ext] || 'other';
}

router.post('/', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'attachmentFiles', maxCount: 10 }
]), async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "student") return res.status(403).json({ error: "Action Forbidden" })

    const thumbnail = req.files?.thumbnail?.[0]?.filename
        ? `images/${req.files.thumbnail[0].filename}`
        : null;

    const attachments = (req.files?.attachmentFiles || []).map((file) => ({
        fileUrl: `attachments/${file.filename}`,
        fileType: getFileType(file.originalname),
    }));

    const { title, description, category } = req.body || {}
    if (!title || !category) {
        return res.status(400).json({ error: "Missing required fields: title or category" });
    }

    try {
        const studentId = Number(req.headers['x-user-id'])
        const newResource = await ResourceModel.create({
            studentId,
            title,
            description,
            thumbnail,
            category: JSON.parse(category),
            attachments
        })

        await redis.del(`myResources:${studentId}`)
        return res.status(201).json(newResource)
    } catch (error) {
        console.error("Error occured while creating the resource: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/me', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "student") return res.status(403).json({ error: "Action Forbidden" })

        const studentId = Number(req.headers['x-user-id'])
        const cachedKey = `myResources:${studentId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const resources = await ResourceModel.find({ studentId: studentId })
        const enrichedResources = await Promise.all(
            resources.map(async (resource) => {
                const responceUser = await resolveUser(studentId)
                const responseCategory = await resolveCategory(resource.category.id)
                const responseField = await resolveField(resource.category.subCategory)

                const thumbnail = resource.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${resource.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const comments = await CommentModel.find({ contentId: resource._id, contentType: "resource" })
                const enrichedComments = await Promise.all(
                    comments.map(async (c) => {
                        const responseCommentUser = await resolveUser(c.userId)
                        return {
                            _id: c._id,
                            text: c.text,
                            userId: responseCommentUser.id,
                            userName: responseCommentUser.userName,
                            familyName: responseCommentUser.familyName,
                            givenName: responseCommentUser.givenName,
                            userImg: responseCommentUser.userImg,
                            role: responseCommentUser.role
                        }
                    })
                )
                return {
                    _id: resource._id,
                    title: resource.title,
                    description: resource.description,
                    thumbnail,
                    student: responceUser,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                    attachments: resource.attachments,
                    comments: enrichedComments,
                    commentsCount: comments.length,
                    avgRating: resource.averageRating(),
                    ratings: resource.ratings,
                    viewCount: resource.views.length,
                    visibility: resource.visibility,
                    createdAt: resource.createdAt
                }
            })
        )

        await redis.setex(cachedKey, 120, JSON.stringify(enrichedResources))
        res.status(200).json(enrichedResources)
    } catch (error) {
        console.error("Error occured while fetching the student's resources: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/recommended/me', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id'])

        const cachedKey = `recommendedResources:${userId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const interestIds = await resolveUserInterests(userId, null)

        if (!interestIds?.length) return res.status(200).json([])   // <-- guard

        const resources = await ResourceModel.find({
            visibility: true,
            "category.id": { $in: interestIds }
        });

        if (!resources.length) return res.status(200).json([]);

        const enrichedResources = await Promise.all(
            resources.map(async (resource) => {
                const responseUser = await resolveUser(resource.studentId)
                const responseCategory = await resolveCategory(resource.category.id)
                const responseField = await resolveField(resource.category.subCategory)

                const thumbnail = resource.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${resource.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const comments = await CommentModel.find({ contentId: resource._id, contentType: "resource" })
                const enrichedComments = await Promise.all(
                    comments.map(async (c) => {
                        const responseCommentUser = await resolveUser(c.userId)
                        return {
                            _id: c._id,
                            text: c.text,
                            userId: responseCommentUser.id,
                            userName: responseCommentUser.userName,
                            familyName: responseCommentUser.familyName,
                            givenName: responseCommentUser.givenName,
                            userImg: responseCommentUser.userImg,
                            role: responseCommentUser.role
                        }
                    })
                )
                return {
                    _id: resource._id,
                    title: resource.title,
                    description: resource.description,
                    thumbnail,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                    attachments: resource.attachments,
                    commentsCount: comments.length,
                    comments: enrichedComments,
                    avgRating: resource.averageRating(),
                    ratings: resource.ratings,
                    viewCount: resource.views.length,
                    visibility: resource.visibility,
                    createdAt: resource.createdAt,
                    student: responseUser
                }
            })
        )

        await redis.set(cachedKey, JSON.stringify(enrichedResources), 'EX', 300)
        return res.status(200).json(enrichedResources)

    } catch (error) {
        console.error("Error occured while fetching for recommendations: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/student-resources/:userName', async(req, res) => {
    try {
        const resourceCachedKey = `student:resources:${req.params.userName}`
        const resourcesCached = await redis.get(resourceCachedKey)
        if (resourcesCached) return res.status(200).json(JSON.parse(resourcesCached))

        const userInfos = await resolveOtherUser(req.params.userName)

        const resources = await ResourceModel.find({studentId: userInfos.id})
        const enrichedResources = await Promise.all(
            resources.map(async (resource) => {
                const responseUser = userInfos
                const responseCategory = await resolveCategory(resource.category.id)
                const responseField = await resolveField(resource.category.subCategory)

                const thumbnail = resource.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${resource.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const comments = await CommentModel.find({ contentId: resource._id, contentType: "resource" })
                const enrichedComments = await Promise.all(
                    comments.map(async (c) => {
                        const responseCommentUser = await resolveUser(c.userId)
                        return {
                            _id: c._id,
                            text: c.text,
                            userId: responseCommentUser.id,
                            userName: responseCommentUser.userName,
                            familyName: responseCommentUser.familyName,
                            givenName: responseCommentUser.givenName,
                            userImg: responseCommentUser.userImg,
                            role: responseCommentUser.role
                        }
                    })
                )
                return {
                    _id: resource._id,
                    title: resource.title,
                    description: resource.description,
                    thumbnail,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                    attachments: resource.attachments,
                    comments: enrichedComments,
                    commentsCount: comments.length,
                    avgRating: resource.averageRating(),
                    ratings: resource.ratings,
                    viewCount: resource.views.length,
                    visibility: resource.visibility,
                    createdAt: resource.createdAt,
                    student: responseUser
                }
            })
        )

        await redis.setex(resourceCachedKey, 120, JSON.stringify(enrichedResources))
        return res.status(200).json(enrichedResources)
    } catch (error) {
        console.error("Error occured while fetching for student ressources: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get("/:resourceId", async (req, res) => {
    try {
        const resourceId = req.params.resourceId
        const resource = await ResourceModel.findById(resourceId)
        if (!resource) return res.status(404).json({ error: "no resource with such id" })

        const responseUser = await resolveUser(resource.studentId)
        const responseCategory = await resolveCategory(resource.category.id)
        const responseField = await resolveField(resource.category.subCategory)

        const comments = await CommentModel.find({ contentId: resourceId, contentType: "resource" })
        const enrichedComments = await Promise.all(
            comments.map(async (c) => {
                const resolvedCommentUser = await resolveUser(c.userId)
                const replies = c.replies
                let enrichedReplies
                if (replies) {
                    enrichedReplies = await Promise.all(
                        replies.map(async (r) => {
                            const resolvedUser = await resolveUser(r.userId)

                            return {
                                _id: r._id,
                                text: r.text,
                                likes: r.likes,
                                userName: resolvedUser.userName,
                                familyName: resolvedUser.familyName,
                                givenName: resolvedUser.givenName,
                                userImg: resolvedUser.userImg,
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
                    userImg: resolvedCommentUser.userImg,
                    role: resolvedCommentUser.role,
                }
            })
        )
        return {
            _id: resource._id,
            title: resource.title,
            description: resource.description,
            thumbnail,
            category: responseCategory,
            subCategory: responseField ?? null,
            attachments: resource.attachments,
            comments: enrichedComments,
            commentsCount: comments.length,
            avgRating: resource.averageRating(),
            visibility: resource.visibility,
            createdAt: resource.createdAt,
            student: responseUser
        }
    } catch (error) {
        console.error("Error occured while fetching the resource: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.put('/:id/view', async (req, res) => {
    try {
        const userId = Number(req.headers['x-user-id'])
        const resource = await ResourceModel.findById(req.params.id)
        if (!resource) return res.status(404).json({ err: "resource not found" })

        const isOwner = resource.studentId === userId
        if (isOwner) return res.status(400).json({ msg: "you're the owner of the resource" })
        const alreadyViewed = resource.views.some((v) => v.userId === userId)
        if (!alreadyViewed) return res.status(400).json({ msg: "user already viewed this resource" })

        resource.views.push({ userId })
        await resource.save()

        res.status(200).json({ msg: "mark as view", viewAdded: true })
    } catch (error) {
        console.error("Error occured while marking a view to the resource: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/:id/comment', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const resourceId = req.params.id

        const resource = await ResourceModel.findById(resourceId)
        if (!resource) return res.status(404).json({ error: "resource not found" })

        const newComment = await CommentModel.create({
            userId: userId,
            contentId: resourceId,
            text: req.body.text,
            contentType: "resource"
        })

        res.status(200).json(newComment)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})


router.post('/:resourceId/comment/:commentId/reply', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const resourceId = req.params.resourceId
    const commentId = req.params.commentId

    try {

        const resource = await ResourceModel.findById(resourceId)
        if (!resource) return res.status(404).json({ error: "resource not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "resource not found" })

        const reply = {
            userId: userId,
            text: req.body.text,
        }

        comment.replies.push(reply)
        await comment.save()

        const savedReply = comment.replies[comment.replies.length - 1]
        res.status(200).json(savedReply)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})

router.post('/:resourceId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const resourceId = req.params.resourceId
        const commentId = req.params.commentId

        const resource = await ResourceModel.findById(resourceId)
        if (!resource) return res.status(404).json({ error: "resource not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "resource not found" })

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

router.delete("/:resourceId/comment/:commentId", async (req, res) => {
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
        const resource = await ResourceModel.findById(req.params.id);
        const rating = req.body.rating

        if (!resource) return res.status(404).json({ error: "Coourse not found" });

        const alreadyRated = resource.ratings.find((userRating) => userRating.userId == userId)

        if (alreadyRated) {
            if (rating) alreadyRated.rating = rating
        } else {
            resource.ratings.push({
                userId: userId,
                rating: rating
            })
        }
        await resource.save()
        res.json(resource);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router