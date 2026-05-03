const express = require('express')
const router = express.Router()
const TipModel = require('../models/Tips')
const CommentModel = require('../models/Comments')
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios')
const multer = require('multer')
const { getUser, getSubject, getSubSubject } = require('../config/kafka/consumer')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })

router.post('/', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : null;
    let { title, description, content, category } = req.body || {};

    if (!title || !content) {
        return res.status(400).json({ error: "Missing required fields: title or content" });
    }

    try {
         const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const newTip = await TipModel.create({
            teacherId,
            title,
            description,
            thumbnail,
            content,
            category
        });

        res.status(201).json({ message: "Tip created successfully", tip: newTip });

    } catch (error) {
        console.error("Error creating tip:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.put('/:id', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    const tipId = req.params.id;

    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });
    if (!tipId) return res.status(400).json({ error: "Missing tip ID in parameters" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : undefined;

    let { title, description, content, category } = req.body || {};

    try {

        const tip = await TipModel.findById(tipId);
        if (!tip) return res.status(404).json({ error: "tip not found" });
        if (tip.teacherId !== teacherId) return res.status(403).json({ error: "You can only update your own tips" });

        if (title) tip.title = title;
        if (description) tip.description = description;
        if (thumbnail) tip.thumbnail = thumbnail;
        if (content) tip.content = content;
        if (category) tip.category = category;

        await tip.save();

        res.status(200).json({ message: "tip updated successfully", tip });

    } catch (error) {
        console.error("Error updating tip:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/teacher/:id', async (req, res) => {
    const teacherId = req.params.id

    try {
        const tips = await TipModel.find({ teacherId: teacherId })
        res.status(200).json(tips)
    } catch (error) {
        console.error("Error while fetching the teacher tips:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get('/teacher-tips/', async (req, res) => {
    const teacherId = req.headers["x-user-id"]

    try {
        const tips = await TipModel.find({ teacherId: teacherId })
        res.status(200).json(tips)
    } catch (error) {
        console.error("Error while fetching the teacher tips:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const tip = await TipModel.findById(req.params.id);
        if (!tip) return res.status(404).json({ error: "tip not found" });

        if (tip.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await tip.deleteOne();

        res.json({ message: "tip deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Comments and Rating
router.get('/:id/comments', async (req, res) => {
    const tipId = req.params.id

    try {
        const comments = await CommentModel.find({ contentId: tipId, contentType: "tip" })
        res.status(200).json(comments)
    } catch (error) {
        console.error("error while fetching comments", error.message)
        res.status(500).json({ error: "Internal server error" });
    }
})

router.post('/:id/comment', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const tipId = req.params.id

    try {

        const tip = await TipModel.findById(tipId)
        if (!tip) return res.status(404).json({ error: "tip not found" })

        const newComment = await CommentModel.create({
            userId: userId,
            contentId: tipId,
            text: req.body.text,
            contentType: "tip"
        })

        res.status(200).json(newComment)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})


router.post('/:tipId/comment/:commentId/reply', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const tipId = req.params.tipId
    const commentId = req.params.commentId

    try {

        const tip = await TipModel.findById(tipId)
        if (!tip) return res.status(404).json({ error: "tip not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "tip not found" })

        const reply = {
            userId: userId,
            text: req.body.text,
        }

        comment.replies.push(reply)         // push returns length, ignore it
        await comment.save()

        // Send back the actual new reply (last item after save)
        const savedReply = comment.replies[comment.replies.length - 1]
        res.status(200).json(savedReply)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})

router.post('/:tipId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const tipId = req.params.tipId
        const commentId = req.params.commentId

        const tip = await TipModel.findById(tipId)
        if (!tip) return res.status(404).json({ error: "tip not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "tip not found" })

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

router.delete("/:tipId/comment/:commentId", async (req, res) => {
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
        const tip = await TipModel.findById(req.params.id);
        const rating = req.body.rating

        if (!tip) return res.status(404).json({ error: "Coourse not found" });

        const alreadyRated = tip.ratings.find((userRating) => userRating.userId == userId)

        if (alreadyRated) {
            if (rating) alreadyRated.rating = rating
        } else {
            tip.ratings.push({
                userId: userId,
                rating: rating
            })
        }
        await tip.save()
        res.json(tip);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;