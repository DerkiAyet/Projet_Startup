const express = require('express')
const router = express.Router()
const CourseModel = require('../models/Courses')
const CommentModel = require('../models/Comments')
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
    let { title, description, level, category, lessons, tags } = req.body || {};

    try {
        lessons = lessons ? JSON.parse(lessons) : [];
    } catch {
        lessons = [];
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

        const newCourse = await CourseModel.create({
            teacherId,
            title,
            description,
            thumbnail,
            level,
            category: JSON.parse(category),
            lessons,
            tags
        });

        res.status(201).json({ message: "Course created successfully", course: newCourse });

    } catch (error) {
        console.error("Error creating course:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put('/:courseId', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    const { courseId } = req.params;

    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });
    if (!courseId) return res.status(400).json({ error: "Missing course ID in parameters" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : undefined;

    let { title, description, level, category, lessons, tags } = req.body || {};

    try {
        lessons = lessons ? JSON.parse(lessons) : undefined;
    } catch {
        lessons = undefined;
    }
    try {
        tags = tags ? JSON.parse(tags) : undefined;
    } catch {
        tags = undefined;
    }

    try {

        const course = await CourseModel.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (course.teacherId !== teacherId) return res.status(403).json({ error: "You can only update your own courses" });

        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail) course.thumbnail = thumbnail;
        if (level) course.level = level;
        if (category) course.category = JSON.parse(category);
        if (lessons) course.lessons = lessons;
        if (tags) course.tags = tags;

        await course.save();

        res.status(200).json({ message: "Course updated successfully", course });

    } catch (error) {
        console.error("Error updating course:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/teacher/:teacherId', async (req, res) => {

    const teacherId = req.params.teacherId

    try {

        const courses = await CourseModel.find({ teacherId: teacherId })

        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                try {

                    const quiz = await QuizeModel.findOne({ courseId: course._id })

                    return {
                        ...course.toObject(),
                        quiz: quiz || null
                    }

                } catch (error) {
                    console.error("Error while fetching for the quizes", error.message)
                }
            })
        )

        res.status(200).json(enrichedCourses)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher-courses', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {

        const courses = await CourseModel.find({ teacherId: userId })

        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                try {

                    const quiz = await QuizeModel.findOne({ courseId: course._id })

                    return {
                        ...course.toObject(),
                        quiz: quiz || null
                    }

                } catch (error) {
                    console.error("Error while fetching for the quizes", error.message)
                }
            })
        )

        res.status(200).json(enrichedCourses)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "course not found" });

        if (course.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await course.deleteOne();

        res.json({ message: "course deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//-----------Comments & Rating
router.get('/:id/comments', async(req, res) =>{
    const courseId = req.params.id

    try {
        const comments = await CommentModel.find({contentId: courseId, contentType: "course"})
        res.status(200).json(comments)
    } catch (error) {
        console.error("error while fetching comments", error.message)
    }
})

router.post('/:courseId/comment', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const courseId = req.params.courseId

    try {

        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })

        const newComment = await CommentModel.create({
            userId: userId,
            contentId: courseId,
            text: req.body.text,
            contentType: "course"
        })

        res.status(200).json(newComment)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})


router.post('/:courseId/comment/:commentId/reply', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const courseId = req.params.courseId
    const commentId = req.params.commentId

    try {

        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "course not found" })

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

router.post('/:courseId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const courseId = req.params.courseId
        const commentId = req.params.commentId

        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "course not found" })

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

router.delete("/:courseId/comment/:commentId", async (req, res) => {
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
        const course = await CourseModel.findById(req.params.id);
        const rating = req.body.rating

        if (!course) return res.status(404).json({ error: "Coourse not found" });

        const alreadyRated = course.ratings.find((userRating) => userRating.userId == userId)

        if (alreadyRated) {
            if (rating) alreadyRated.rating = rating
        } else {
            course.ratings.push({
                userId: userId,
                rating: rating
            })
        }
        await course.save()
        res.json(course);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

//------------Quizes
router.post('/:courseId/quiz', async (req, res) => {
    const courseId = req.params.courseId;
    const teacherId = req.headers['x-user-id']

    try {
        const course = await CourseModel.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });

        let { title, description, difficulty, questions, score } = req.body || {}

        if (!title || !difficulty) return res.status(400).json({ error: "Missing fields: title, difficulty" })

        const existedQuize = await QuizeModel.findOne({ courseId: courseId })

        if (existedQuize) return res.status(400).json({ quizExist: "a quize already exists for this course" })

        const newQuize = await QuizeModel.create({
            teacherId,
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

module.exports = router;