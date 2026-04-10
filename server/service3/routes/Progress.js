const express = require('express')
const router = express.Router()
const EnrollementModel = require('../models/Enrollements')
const CourseModel = require('../models/Courses')
const SolvingModel = require('../models/Solving')
const AssignmentModel = require('../models/Assignments')
const QuizAttemptModel = require('../models/QuizAttempts')
const QuizModel = require("../models/Quizes");
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios')

router.post('/enrollements/:courseId', async (req, res) => {
    const studentId = req.headers['x-user-id']
    const courseId = req.params.courseId

    try {
        const serviceAuthBaseUrl = await discoverAuthService();
        const response = await axios.get(`${serviceAuthBaseUrl}/get_user_byId/${studentId}`, { timeout: 5000 });

        const userRole = response.data.user.role;
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const enrollementExisted = await EnrollementModel.findOne({ studentId: studentId, courseId: courseId })
        if (enrollementExisted) return res.status(400).json({ error: "student already enrolled the course" })

        const newEnrollement = await EnrollementModel.create({
            studentId,
            courseId
        })

        res.status(200).json({ newEnrollement })
    } catch (error) {

        console.log("error while adding the enrolement", error.message)
        res.status(500).json("Internal server error", error)

    }
})

router.get('/enrollements/:idCourse', async(req, res) => {
    const studentId = req.headers['x-user-id']
    const courseId = req.params.idCourse

    try {
        const serviceAuthBaseUrl = await discoverAuthService();
        const response = await axios.get(`${serviceAuthBaseUrl}/get_user_byId/${studentId}`, { timeout: 5000 });

        const userRole = response.data.user.role;
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const enrollement = await EnrollementModel.findOne({ studentId: studentId, courseId: courseId })
        if (!enrollement) return res.status(400).json({ error: "student didn't enroll the course yet" })

        res.status(200).json(enrollement)
    } catch (error) {

        console.log("error while adding the enrolement", error.message)
        res.status(500).json("Internal server error", error)

    }
})

router.get('/courses-enrolled', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {

        const enrolls = await EnrollementModel.find({ studentId: userId })
        if (!enrolls.length) return res.status(404).json({ error: "No courses enrolled yet" })
        const courses = await Promise.all(
            enrolls.map(async (enrollement) => {
                return await CourseModel.findById(enrollement.courseId)
            })
        )

        res.status(200).json(courses)
    } catch (error) {
        console.log("error while fetching the courses", error.message)
        res.status(500).json("Internal server error", error)
    }

})

router.put("/enrollements/:id/lesson-completed/:lessonId", async (req, res) => {
    const enrollId = req.params.id
    const lessonId = req.params.lessonId

    try {

        const enrollement = await EnrollementModel.findById(enrollId)
        if (!enrollement) return res.status(404).json({ error: "no enrollement with such ID" })

        const lessonDone = enrollement.lessonsCompleted.find((l) => l.toString() == lessonId)

        if (lessonDone) {
            enrollement.lessonsCompleted = enrollement.lessonsCompleted.filter((l) => l.toString() !== lessonId)
        } else {
            enrollement.lessonsCompleted.push(lessonId)
        }

        await enrollement.save()
        res.status(200).json(enrollement)
    } catch (error) {
        console.log("error while editing the enrollement", error.message)
        res.status(500).json("Internal server error", error)
    }
})

//--------Student Solutions

router.post('/solutions/:assignmentId', async (req, res) => {
    const studentId = req.headers['x-user-id']
    const assignmentId = req.params.assignmentId

    try {
        const serviceAuthBaseUrl = await discoverAuthService();
        const response = await axios.get(`${serviceAuthBaseUrl}/get_user_byId/${studentId}`, { timeout: 5000 });

        const userRole = response.data.user.role;
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const studentSolution = await SolvingModel.findOne({ studentId: studentId, assignment: assignmentId })
        if (studentSolution) return res.status(400).json({ error: "student already sent a solution of the assignment" })

        const newSolution = await SolvingModel.create({
            studentId,
            assignment: assignmentId,
            problemsSolved: req.body.problemsSolved
        })

        res.status(200).json(newSolution)
    } catch (error) {
        console.log("error while adding the solution of student", error.message)
        res.status(500).json("Internal server error", error)
    }
})

router.put('/solutions/:solutionId/teacher-explanation/problem/:problemId', async (req, res) => {
    const teacherId = req.headers['x-user-id']
    const solutionId = req.params.solutionId
    const problemId = req.params.problemId
    const { grade, teacherExplination } = req.body || {}

    try {
        const solution = await SolvingModel.findById(solutionId)
        if (!solution) return res.status(404).json({ error: "solution doesn't exist" })

        const assignment = await AssignmentModel.findById(solution.assignment)
        if (assignment.teacherId != teacherId) return res.status(400).json({ error: "Unathorized" })

        const problem = solution.problemsSolved.find((p) => p.id.toString() == problemId)

        if (grade) problem.grade = grade
        if (teacherExplination) problem.teacherExplination = teacherExplination

        solution.status = "graded"
        solution.calculateScore()
        await solution.save()

        res.status(200).json(solution)

    } catch (error) {
        console.log("error while updatinng the solution of student", error.message)
        res.status(500).json("Internal server error", error)
    }
})

//----- Quiz Attempts
router.post("/quiz-attempts/start", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { quizId } = req.body;

    try {
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        const existing = await QuizAttemptModel.findOne({ studentId, quizId, completedAt: null });
        if (existing) return res.status(400).json({ error: "You already have an ongoing attempt for this quiz" });

        const maxScore = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);

        const attempt = await QuizAttemptModel.create({
            studentId,
            quizId,
            maxScore,
            startedAt: new Date(),
        });

        res.status(201).json(attempt);

    } catch (error) {
        console.log("Error starting quiz attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Submit a quiz attempt (calculates score)
router.put("/quiz-attempts/:attemptId/submit", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { attemptId } = req.params;
    const { answers } = req.body;

    try {
        const attempt = await QuizAttemptModel.findById(attemptId);
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        if (attempt.studentId != studentId)
            return res.status(403).json({ error: "Unauthorized" });

        if (attempt.completedAt)
            return res.status(400).json({ error: "This attempt has already been submitted" });

        const quiz = await QuizModel.findById(attempt.quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        // Set answers
        attempt.answers = answers;

        // Calculate score
        attempt.calculateScore(quiz);

        // Mark as completed
        attempt.completedAt = new Date();
        attempt.timeTaken = Math.floor((attempt.completedAt - attempt.startedAt) / 1000); // seconds

        await attempt.save();

        res.status(200).json(attempt);

    } catch (error) {
        console.log("Error submitting quiz attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/quiz-attempts/:attemptId", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { attemptId } = req.params;

    try {
        const attempt = await QuizAttemptModel.findById(attemptId).populate("quizId");
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        if (attempt.studentId != studentId)
            return res.status(403).json({ error: "Unauthorized" });

        res.status(200).json(attempt);

    } catch (error) {
        console.log("Error fetching attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/quiz-attempts/student/me", async (req, res) => {
    const studentId = req.headers["x-user-id"];

    try {
        const attempts = await QuizAttemptModel.find({ studentId })
            .populate("quizId", "title description difficulty")
            .sort({ createdAt: -1 });

        res.status(200).json(attempts);

    } catch (error) {
        console.log("Error fetching student attempts:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/quiz-attempts/quiz/:quizId", async (req, res) => {
    const teacherId = req.headers["x-user-id"];
    const { quizId } = req.params;

    try {
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        if (quiz.teacherId != teacherId)
            return res.status(403).json({ error: "Unauthorized" });

        const attempts = await QuizAttemptModel.find({ quizId })
            .sort({ createdAt: -1 });

        res.status(200).json(attempts);

    } catch (error) {
        console.log("Error fetching quiz attempts:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ── 6. Delete an attempt ──────────────────────────────────────────────────────
router.delete("/quiz-attempts/:attemptId", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { attemptId } = req.params;

    try {
        const attempt = await QuizAttemptModel.findById(attemptId);
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        if (attempt.studentId != studentId)
            return res.status(403).json({ error: "Unauthorized" });

        if (attempt.completedAt)
            return res.status(400).json({ error: "Cannot delete a completed attempt" });

        await QuizAttemptModel.findByIdAndDelete(attemptId);

        res.status(200).json({ message: "Attempt deleted successfully" });

    } catch (error) {
        console.log("Error deleting attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;