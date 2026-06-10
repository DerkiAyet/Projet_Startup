const express = require('express')
const router = express.Router()
const EnrollementModel = require('../models/Enrollements')
const CourseModel = require('../models/Courses')
const SolvingModel = require('../models/Solving')
const AssignmentModel = require('../models/Assignments')
const QuizAttemptModel = require('../models/QuizAttempts')
const QuizeModel = require("../models/Quizes");
const axios = require('axios')
const multer = require('multer')
const { updateGamification } = require('../config/kafka/producer')
const { resolveCategory, resolveField, resolveUser, resolveUserInterests } = require('../helpers/utils')
const redis = require('../config/redis.config')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/solutions/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })

const solutionUpload = upload.fields([{ name: 'solutionFiles', maxCount: 20 }]);

router.post('/enrollements/:courseId', async (req, res) => {
    const studentId = Number(req.headers['x-user-id'])
    const courseId = req.params.courseId

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const enrollementExisted = await EnrollementModel.findOne({ studentId: studentId, courseId: courseId })
        if (enrollementExisted) return res.status(200).json({ exist: "student already enrolled the course" })

        const newEnrollement = await EnrollementModel.create({
            studentId,
            courseId
        })

        await updateGamification("ENROLL_COURSE", studentId)
        await redis.del(`enrollments:${studentId}`)
        res.status(200).json({ newEnrollement })
    } catch (error) {

        console.log("error while adding the enrolement", error.message)
        res.status(500).json("Internal server error", error)

    }
})

router.get('/enrollements/:idCourse', async (req, res) => {
    const studentId = req.headers['x-user-id']
    const courseId = req.params.idCourse

    try {
        const userRole = req.headers['x-user-role'];
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
        const cachedKey = `enrollments:${userId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const enrolls = await EnrollementModel.find({ studentId: userId })
        if (!enrolls.length) return res.status(404).json({ error: "No courses enrolled yet" })

        const enrichedEnrolls = await Promise.all(enrolls.map(async (enroll) => {
            const course = await CourseModel.findById(enroll.courseId)

            let responseUser = await resolveUser(course.teacherId);
            let responseCategory = await resolveCategory(course.category.id);
            let responseField = await resolveField(course.category.subCategory);

            const thumbnail = course.thumbnail
                ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

            return {
                _id: enroll._id,
                courseId: enroll.courseId,
                studentId: enroll.studentId,
                lessonsCompleted: enroll.lessonsCompleted,
                totalLessons: course.lessons.length,
                enrolledAt: enroll.enrolledAt,
                course: {
                    _id: course._id,
                    teacherId: course.teacherId,
                    title: course.title,
                    description: course.description,
                    thumbnail,
                    level: course.level,
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
                    lessons: course.lessons,
                    teacher: {
                        userId: responseUser.id,
                        userName: responseUser.userName,
                        familyName: responseUser.familyName,
                        givenName: responseUser.givenName,
                        userImg: responseUser.uerImg,
                        role: "teacher"
                    } || null
                }
            }
        }))
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedEnrolls))
        res.status(200).json(enrichedEnrolls)
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

router.put('/solutions/:assignmentId/draft', solutionUpload, async (req, res) => {
    const studentId = req.headers['x-user-id'];
    const assignmentId = req.params.assignmentId;

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        let problemsSolved = req.body.problemsSolved ? JSON.parse(req.body.problemsSolved) : [];

        if (req.files?.solutionFiles) {
            req.files.solutionFiles.forEach((file) => {
                const index = parseInt(file.originalname.split('_')[0]);
                if (problemsSolved[index]) {
                    problemsSolved[index].fileUrl = `solutions/${file.filename}`;
                }
            });
        }

        const studentSolution = await SolvingModel.findOne({ studentId, assignment: assignmentId });

        if (studentSolution) {
            studentSolution.problemsSolved = problemsSolved;
            await studentSolution.save();
            return res.status(200).json(studentSolution);
        }

        const newSolution = await SolvingModel.create({ studentId, assignment: assignmentId, problemsSolved });
        res.status(200).json(newSolution);

    } catch (error) {
        console.log("error while adding the solution of student", error.message);
        res.status(500).json("Internal server error");
    }
});

router.put('/solutions/:assignmentId/submit', solutionUpload, async (req, res) => {
    const studentId = req.headers['x-user-id'];
    const assignmentId = req.params.assignmentId;

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const assignment = await AssignmentModel.findById(assignmentId);
        if (!assignment) return res.status(404).json({ error: "Assignment not found" });

        let problemsSolved = req.body.problemsSolved ? JSON.parse(req.body.problemsSolved) : [];

        if (req.files?.solutionFiles) {
            req.files.solutionFiles.forEach((file) => {
                const index = parseInt(file.originalname.split('_')[0]);
                if (problemsSolved[index]) {
                    problemsSolved[index].fileUrl = `solutions/${file.filename}`;
                }
            });
        }

        let studentSolution = await SolvingModel.findOne({ studentId, assignment: assignmentId });

        if (studentSolution) {
            studentSolution.problemsSolved = problemsSolved;
            studentSolution.posted = true;
        } else {
            studentSolution = new SolvingModel({ studentId, assignment: assignmentId, problemsSolved, posted: true });
        }

        studentSolution.calculateScore(assignment);
        await studentSolution.save();

        await updateGamification("SEND_SOLUTION", studentId)
        await redis.del(`solutions:${studentId}`)
        res.status(200).json(studentSolution);
    } catch (error) {
        console.log("error while submitting solution:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

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
        solution.calculateScore(assignment)
        await solution.save()

        res.status(200).json(solution)

    } catch (error) {
        console.log("error while updatinng the solution of student", error.message)
        res.status(500).json("Internal server error", error)
    }
})

router.put('/solutions/:solutionId/teacher-grade', async (req, res) => {
    const teacherId = req.headers['x-user-id']
    const solutionId = req.params.solutionId
    const { teacherReview } = req.body

    try {
        const solution = await SolvingModel.findById(solutionId)
        if (!solution) return res.status(404).json({ error: "solution doesn't exist" })

        const assignment = await AssignmentModel.findById(solution.assignment)
        if (assignment.teacherId != teacherId) return res.status(400).json({ error: "Unathorized" })

        await Promise.all(teacherReview.map((review) => {
            const exerciseId = review.exerciseId
            const problem = solution.problemsSolved.find((p) => p.exerciseId.toString() === review.exerciseId.toString())

            if (!problem) return null
            if (problem.exerciseType === "mcq") return null

            if (review.grade !== undefined) problem.grade = review.grade
            if (review.teacherExplanation) problem.teacherExplanation = review.teacherExplanation
        }))

        solution.status = "graded"
        solution.calculateScore(assignment)
        await solution.save()

        const studentId = solution.studentId
        await updateGamification("GET_GRADE", studentId)
        await redis.del(`solutions:${studentId}`)
        res.status(200).json(solution)

    } catch (error) {
        console.log("error while grading the solution of student", error.message)
        res.status(500).json("Internal server error", error)
    }
})

router.get('/solutions/:solutionId', async (req, res) => {
    const solutionId = req.params.solutionId
    try {

        const solution = await SolvingModel.findById(solutionId)
        if (!solution) return res.status(404).json({ error: "solution doesn't exist" })

        const assignment = await AssignmentModel.findById(solution.assignment)
        const student = await resolveUser(solution.studentId);

        res.status(200).json({ solution, assignment, student });
    } catch (error) {
        console.log("Error fetching solution:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get('/my-solutions/:assignmentId', async (req, res) => {
    const studentId = req.headers['x-user-id']
    const assignmentId = req.params.assignmentId
    try {

        const userRole = req.headers['x-user-role']
        if (userRole !== "student") res.status(400).json("Unauthorized")

        const assignment = await AssignmentModel.findById(assignmentId)
        if (!assignment) return res.status(404).json({ error: "assignment doesn't exist" })

        const solution = await SolvingModel.findOne({ studentId: studentId, assignment: assignmentId })
        if (!solution) return res.status(404).json({ error: "no solutions submitted yet" })
        if (solution.studentId.toString() !== studentId.toString()) return res.status(400).json({ error: "not your solution dear student" })

        res.status(200).json({ problemsSolved: solution.problemsSolved, status: solution.status })

    } catch (error) {
        console.log("Error fetching solution:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get('/student-solutions', async (req, res) => {
    const studentId = req.headers['x-user-id'];

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const cachedKey = `solutions:${studentId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const solutions = await SolvingModel.find({ studentId: studentId });
        const enrichedSolutions = await Promise.all(
            solutions.map(async (s) => {
                const assignment = await AssignmentModel.findById(s.assignment)

                const responseUser = await resolveUser(assignment.teacherId)
                const responseCategory = await resolveCategory(assignment.category.id)
                const responseField = await resolveField(assignment.category.subCategory);

                const thumbnail = assignment.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${assignment.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                return {
                    _id: s._id,
                    studentId: s.studentId,
                    problemsSolved: s.problemsSolved,
                    totalExercises: assignment.exercises.length,
                    solvedAt: s.solvedAt,
                    posted: s.posted,
                    status: s.status,
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
                        teacher: {
                            userId: responseUser.id,
                            userName: responseUser.userName,
                            familyName: responseUser.familyName,
                            givenName: responseUser.givenName,
                            userImg: responseUser.uerImg,
                            role: "teacher"
                        } || null
                    }
                }
            })
        )
        await redis.setex(`solutions:${studentId}`, 120, JSON.stringify(enrichedSolutions))
        res.status(200).json(enrichedSolutions)
    } catch (error) {
        console.log("error while fetching student solutions:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})

//----- Quiz Attempts
router.post("/quiz-attempts/start", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { quizId } = req.body;

    try {
        const quiz = await QuizeModel.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        // If an incomplete attempt exists, return it instead of creating a new one
        const existing = await QuizAttemptModel.findOne({ studentId, quizId });
        if (existing && !existing.completedAt) return res.status(200).json({ attempt: existing, resumed: true }); // resumed: frontend uses this to know it's a resume
        if (existing && existing.completedAt) return res.status(200).json({ attempt: existing, solved: true, message: "You have already completed this quiz. Starting a new attempt is not allowed." });


        const maxScore = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
        const attempt = await QuizAttemptModel.create({
            studentId,
            quizId,
            maxScore,
            startedAt: new Date(),
        });

        res.status(201).json({ attempt, resumed: false });

    } catch (error) {
        console.log("Error starting quiz attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// save the attempt without submitting (allows resuming later, no score calculation)
router.put("/quiz-attempts/:attemptId/save", async (req, res) => {
    const studentId = req.headers["x-user-id"];
    const { attemptId } = req.params;
    const { answers } = req.body;

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const attempt = await QuizAttemptModel.findById(attemptId);
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        if (attempt.studentId != studentId)
            return res.status(403).json({ error: "Unauthorized" });

        if (attempt.completedAt)
            return res.status(400).json({ error: "This attempt has already been submitted" });

        // Just save answers, no scoring, no completedAt
        attempt.answers = answers;
        await attempt.save();

        res.status(200).json(attempt);

    } catch (error) {
        console.log("Error saving quiz progress:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Submit a quiz attempt (calculates score)
router.put("/quiz-attempts/:attemptId/submit", async (req, res) => {
    const studentId = Number(req.headers["x-user-id"]);
    const { attemptId } = req.params;
    const { answers } = req.body;

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'student') return res.status(403).json({ error: "Unauthorized" });

        const attempt = await QuizAttemptModel.findById(attemptId);
        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        if (attempt.studentId != studentId)
            return res.status(403).json({ error: "Unauthorized" });

        if (attempt.completedAt)
            return res.status(400).json({ error: "This attempt has already been submitted" });

        const quiz = await QuizeModel.findById(attempt.quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        // Set answers
        attempt.answers = answers;

        // Calculate score
        attempt.calculateScore(quiz);

        // Mark as completed
        attempt.completedAt = new Date();
        attempt.timeTaken = Math.floor((attempt.completedAt - attempt.startedAt) / 1000); // seconds

        await attempt.save();

        await updateGamification("SOLVE_QUIZ", studentId)
        await redis.del(`quizAttempts:${studentId}`)
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
        const quiz = await QuizeModel.findById(quizId);
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
        await redis.del(`quizAttempts:${studentId}`)
        res.status(200).json({ message: "Attempt deleted successfully" });
    } catch (error) {
        console.log("Error deleting attempt:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/me/quizes', async (req, res) => {

    const userId = req.headers['x-user-id']

    try {
        const cachedKey = `quizAttempts:${userId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const solvedQuizes = await QuizAttemptModel.find({ studentId: userId })
        const enrichedQuizes = await Promise.all(
            solvedQuizes.map(async (attempt) => {
                const quiz = await QuizeModel.findById(attempt.quizId)

                let responseUser = await resolveUser(quiz.teacherId);
                let responseCategory = await resolveCategory(quiz.category.id);
                let responseField = await resolveField(quiz.category.subCategory);
                return {
                    attempt,
                    quiz: {
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
                }
            })
        )
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedQuizes))
        res.status(200).json(enrichedQuizes)
    } catch (error) {
        console.log("Internal Server error", error.message)
        res.status(500).json({ error: "Internal server error", message: error.message })
    }
})

module.exports = router;