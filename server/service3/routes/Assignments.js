const express = require('express')
const router = express.Router()
const CommentModel = require('../models/Comments')
const AssignmentModel = require('../models/Assignments')
const QuizeModel = require('../models/Quizes')
const { discoverAuthService, discoverNotifService } = require('../config/discovery.service')
const axios = require('axios')
const multer = require('multer')

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

    if (!title || !category || !level) {
        return res.status(400).json({ error: "Missing required fields: title, category, or level" });
    }

    try {
        const serviceAuthBaseUrl = await discoverAuthService();
        const response = await axios.get(`${serviceAuthBaseUrl}/get_user_byId/${teacherId}`, { timeout: 5000 });

        const userRole = response.data.user.role;
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

        res.status(201).json({ message: "assignment created successfully", course: newAssignment });

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

        res.status(200).json({ message: "assignment updated successfully", assignment });

    } catch (error) {
        console.error("Error updating assignment:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/teacher/:teacherId', async (req, res) => {

    const teacherId = req.params.teacherId

    try {

        const assigns = await AssignmentModel.find({ teacherId: teacherId })

        res.status(200).json(assigns)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher-assigns', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {

        const assigns = await AssignmentModel.find({ teacherId: userId })

        res.status(200).json(assigns)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const assignment = await AssignmentModel.findById(req.params.id);
        if (!assignment) return res.status(404).json({ error: "assignment not found" });

        if (assignment.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await assignment.deleteOne();

        res.json({ message: "assignment deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//-----------Comments & Rating
router.get('/:id/comments', async(req, res) =>{
    const courseId = req.params.id

    try {
        const comments = await CommentModel.find({contentId: courseId, contentType: "assignment"})
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

        const newReply = comment.replies.push({
            userId: userId,
            text: req.body.text,
        })

        await comment.save()

        res.status(200).json(newReply)

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

    let { title, description, difficulty, questions, score } = req.body || {}

    if (!title || !difficulty) return res.status(400).json({ error: "Missing fields: title, difficulty" })

    try {

        const serviceAuthBaseUrl = await discoverAuthService();
        const response = await axios.get(`${serviceAuthBaseUrl}/get_user_byId/${teacherId}`, { timeout: 5000 });

        const userRole = response.data.user.role;
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const existedQuize = await QuizeModel.findOne({ teacherId: teacherId })

        if (existedQuize) return res.status(400).json({ quizExist: "a quize already exists for this course" })

        const newQuize = await QuizeModel.create({
            title,
            description,
            difficulty,
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

module.exports = router;