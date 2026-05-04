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
const { getUser, getSubject, getSubSubject } = require('../config/kafka/consumer');

router.get('/my-students/stats', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];

        if (userRole !== "teacher") {
            return res.status(403).json("Unauthorized");
        }

        const courses = await CourseModel.find({ teacherId }).select('_id');
        const courseIds = courses.map(c => c._id);

        const enrollmentsCount = await EnrollementModel.countDocuments({
            courseId: { $in: courseIds }
        });

        const assignments = await AssignmentModel.find({ teacherId }).select('_id');
        const assignmentIds = assignments.map(a => a._id);

        const solutions = await SolvingModel.find({
            assignment: { $in: assignmentIds },
            posted: true
        });

        const pendingSolutionsCount = solutions.filter(
            s => s.status === "submitted"
        ).length;

        // AVERAGE SCORE (GLOBAL)
        const scoreStats = await SolvingModel.aggregate([
            {
                $match: {
                    assignment: { $in: assignmentIds },
                    posted: true
                }
            },
            {
                // Join assignment to get its maxScore
                $lookup: {
                    from: "assignments", // your actual collection name
                    localField: "assignment",
                    foreignField: "_id",
                    as: "assignmentData"
                }
            },
            { $unwind: "$assignmentData" },
            {
                $project: {
                    score: 1,
                    maxScore: "$assignmentData.maxScore",
                    // percentage for THIS submission
                    percentage: {
                        $cond: [
                            { $gt: ["$assignmentData.maxScore", 0] },
                            { $multiply: [{ $divide: ["$score", "$assignmentData.maxScore"] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$score" },
                    avgPercentage: { $avg: "$percentage" }, // ✅ meaningful average
                    count: { $sum: 1 }
                }
            }
        ]);

        const avgScore = scoreStats[0]?.avgScore || 0;
        const submissionCount = scoreStats[0]?.count || 0;
        const averagePercentage = Math.round(scoreStats[0]?.avgPercentage || 0); // ✅ no more division bug



        // information of enrollements per category
        const detailedEnrollements = await EnrollementModel.aggregate([
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },

            // Unwind the array so "course" becomes a plain object
            {
                $unwind: "$course"
            },

            {
                $match: {
                    "course.teacherId": teacherId
                }
            },

            {
                $group: {
                    _id: "$course.category.subCategory",
                    enrollments: { $sum: 1 }
                }
            },

            {
                $project: {
                    _id: 0,
                    subCategoryId: "$_id",
                    enrollments: 1
                }
            }
        ]);

        const authServiceBaseUrl = await discoverAuthService()
        const enrichedDetailedEnrollements = await Promise.all(

            detailedEnrollements.map(async (e) => {
                let responseCategory = getSubject(e.subCategoryId)

                if (!responseCategory) {
                    const { data } = await axios.get(`${authServiceBaseUrl}/infos/sub-subjects/${e.subCategoryId}`)
                    responseCategory = data
                }

                return {
                    subCategoryId: e.subCategoryId,
                    subCategoryName: responseCategory.name,
                    enrollments: e.enrollments
                }
            })

        )

        return res.json({
            teacherId,
            totalEnrollments: enrollmentsCount,
            totalAssignments: assignments.length,

            solutions: {
                totalSolutions: solutions.length,
                pendingSolutionsCount
            },

            scores: {
                averageScore: avgScore,
                submissions: submissionCount,
                averagePercentage
            },

            enrollementPerCategories: enrichedDetailedEnrollements
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json("Server error");
    }
});

router.get('/assignments/avg-score-by-subcategory', async (req, res) => {
    try {
        const teacherId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (userRole !== 'teacher') {
            return res.status(403).json("Unauthorized");
        }

        // Get all teacher's assignment IDs with their subcategory and maxScore
        const assignments = await AssignmentModel.find({ teacherId }).select('_id category maxScore');
        const assignmentIds = assignments.map(a => a._id);

        // Build a map: assignmentId -> { subCategoryId, maxScore }
        const assignmentMeta = Object.fromEntries(
            assignments.map(a => [
                a._id.toString(),
                {
                    subCategoryId: a.category?.subCategory,
                    maxScore: a.maxScore || 0
                }
            ])
        );

        // Aggregate average scores per assignment from solutions
        const scoreStats = await SolvingModel.aggregate([
            {
                $match: {
                    assignment: { $in: assignmentIds },
                    posted: true,
                    score: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$assignment",
                    avgScore: { $avg: "$score" },
                    submissionCount: { $sum: 1 }
                }
            }
        ]);

        // Group by subcategory, computing weighted average percentage
        const subcategoryMap = {};

        for (const stat of scoreStats) {
            const meta = assignmentMeta[stat._id.toString()];
            if (!meta) continue;

            const { subCategoryId, maxScore } = meta;
            const key = subCategoryId?.toString() ?? 'uncategorized';

            if (!subcategoryMap[key]) {
                subcategoryMap[key] = {
                    subCategoryId,
                    totalWeightedScore: 0,
                    totalMaxScore: 0,
                    totalSubmissions: 0,
                    assignmentCount: 0
                };
            }

            subcategoryMap[key].totalWeightedScore += stat.avgScore * stat.submissionCount;
            subcategoryMap[key].totalMaxScore += maxScore * stat.submissionCount;
            subcategoryMap[key].totalSubmissions += stat.submissionCount;
            subcategoryMap[key].assignmentCount += 1;
        }

        // Enrich with subcategory names
        const authServiceBaseUrl = await discoverAuthService();

        const result = await Promise.all(
            Object.values(subcategoryMap).map(async (entry) => {
                const { subCategoryId, totalWeightedScore, totalMaxScore, totalSubmissions, assignmentCount } = entry;

                let subCategoryName = 'Unknown';
                try {
                    let responseCategory = getSubSubject(subCategoryId);
                    if (!responseCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/sub-subjects/${subCategoryId}`);
                        responseCategory = data;
                    }
                    subCategoryName = responseCategory.name;
                } catch (_) { /* keep 'Unknown' if lookup fails */ }

                const avgPercentage = totalMaxScore > 0
                    ? Math.round((totalWeightedScore / totalMaxScore) * 100)
                    : 0;

                return {
                    subCategoryId,
                    subCategoryName,
                    assignmentCount,
                    totalSubmissions,
                    avgScorePercentage: avgPercentage
                };
            })
        );

        return res.json({ teacherId, avgScoreBySubcategory: result });

    } catch (err) {
        console.error(err);
        return res.status(500).json("Server error");
    }
});

router.get('/assignments/stats-by-student', async (req, res) => {
    try {
        const teacherId = Number(req.headers['x-user-id']);
        const userRole = req.headers['x-user-role'];

        if (userRole !== 'teacher') {
            return res.status(403).json("Unauthorized");
        }

        const assignments = await AssignmentModel.find({ teacherId }).select('_id maxScore');
        const assignmentIds = assignments.map(a => a._id);

        // maxScore lookup map
        const maxScoreMap = Object.fromEntries(
            assignments.map(a => [a._id.toString(), a.maxScore || 0])
        );

        // Aggregate per student
        const studentStats = await SolvingModel.aggregate([
            {
                $match: {
                    assignment: { $in: assignmentIds },
                    posted: true,
                    score: { $ne: null }
                },
            },
            {
                $group: {
                    _id: "$studentId",
                    submissionCount: { $sum: 1 },
                    avgScore: { $avg: "$score" },
                    totalScore: { $sum: "$score" },
                    assignmentIds: { $push: "$assignment" }
                }
            }
        ]);

        const authServiceBaseUrl = await discoverAuthService();

        const result = await Promise.all(
            studentStats.map(async (stat) => {

                const totalMaxScore = stat.assignmentIds.reduce((sum, aId) => {
                    return sum + (maxScoreMap[aId.toString()] || 0);
                }, 0);

                const avgPercentage = totalMaxScore > 0
                    ? Math.round((stat.totalScore / totalMaxScore) * 100)
                    : 0;


                const [enrollmentCount, quizAttemptCount] = await Promise.all([
                    EnrollementModel.aggregate([
                        {
                            $match: {
                                studentId: stat._id
                            }
                        },
                        {
                            $lookup: {
                                from: "courses",
                                localField: "courseId",
                                foreignField: "_id",
                                as: "course"
                            }
                        },
                        {
                            $match: {
                                "course.teacherId": teacherId
                            }
                        },
                        {
                            $count: "count"
                        }
                    ]).then(res => (res[0]?.count || 0)),

                    QuizAttemptModel.aggregate([
                        {
                            $match: {
                                studentId: stat._id
                            }
                        },
                        {
                            $lookup: {
                                from: "quizes",
                                localField: "quizId",
                                foreignField: "_id",
                                as: "quiz"
                            }
                        },
                        {
                            $match: {
                                "quiz.teacherId": teacherId
                            }
                        },
                        {
                            $count: "count"
                        }
                    ]).then(res => (res[0]?.count || 0)),
                ]);

                let userInfo = null;
                try {
                    let responseUser = getUser(stat._id);
                    if (!responseUser) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${stat._id}`);
                        responseUser = data.user;
                    }
                    userInfo = responseUser;
                } catch (_) { }

                return {
                    studentId: stat._id,
                    studentFamilyName: userInfo?.familyName || 'Unknown',
                    studentGivenName: userInfo?.givenName || 'Unknown',
                    studentEmail: userInfo?.email || null,
                    studentImg: userInfo?.uerImg || null,
                    submissionCount: stat.submissionCount,
                    avgScore: Math.round(stat.avgScore * 100) / 100,
                    avgScorePercentage: avgPercentage,
                    enrollmentCount,
                    quizAttemptCount,
                };
            })
        );

        // sort by best performers first
        result.sort((a, b) => b.avgScorePercentage - a.avgScorePercentage);

        return res.json({ teacherId, statsByStudent: result });

    } catch (err) {
        console.error(err);
        return res.status(500).json("Server error");
    }
});

router.get('/assignments/activity-breakdown', async (req, res) => {
    try {
        const teacherId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (userRole !== 'teacher') {
            return res.status(403).json("Unauthorized");
        }

        // Assignment submissions
        const assignments = await AssignmentModel.find({ teacherId }).select('_id');
        const assignmentIds = assignments.map(a => a._id);

        const solutionsCount = await SolvingModel.countDocuments({
            assignment: { $in: assignmentIds },
            posted: true
        });

        // Quiz attempts
        const quizzes = await QuizModel.find({ teacherId }).select('_id');
        const quizIds = quizzes.map(q => q._id);

        const quizAttemptsCount = await QuizAttemptModel.countDocuments({
            quizId: { $in: quizIds }
        });

        // Enrollments
        const courses = await CourseModel.find({ teacherId }).select('_id');
        const courseIds = courses.map(c => c._id);

        const enrollmentsCount = await EnrollementModel.countDocuments({
            courseId: { $in: courseIds }
        });

        return res.json({
            teacherId,
            breakdown: {
                solutions: solutionsCount,
                quizAttempts: quizAttemptsCount,
                enrollments: enrollmentsCount,
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json("Server error");
    }
});

router.get('/student/:studentId/solutions', async (req, res) => {
    try {
        const teacherId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (userRole !== 'teacher') {
            return res.status(403).json("Unauthorized");
        }

        const studentId = req.params.studentId;

        const assignments = await AssignmentModel.find({ teacherId });
        if (!assignments.length) {
            return res.status(404).json("No assignments made by the teacher yet");
        }

        const solutions = await Promise.all(
            assignments.map(async (a) => {
                const solution = await SolvingModel
                    .findOne({ studentId, assignment: a._id, posted: true })
                    .select('_id status score');

                // Skip if no solution
                if (!solution) return null;

                const authServiceUrl = await discoverAuthService();
                let responseField = getSubSubject(a.category.subCategory);

                if (!responseField) {
                    const { data } = await axios.get(
                        `${authServiceUrl}/infos/sub-subjects/${a.category.subCategory}`
                    );
                    responseField = data;
                }

                return {
                    title: a.title,
                    speciality: responseField.name,
                    maxScore: a.maxScore,
                    solution
                };
            })
        );

        // Remove null entries
        const filteredSolutions = solutions.filter(Boolean);

        res.status(200).json(filteredSolutions);

    } catch (error) {
        console.error(error);
        return res.status(500).json("Server error");
    }
});

router.get('/my-children/stats', async (req, res) => {
    try {
        const parentId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (userRole !== 'parent') return res.status(403).json({ error: 'Unauthorized' });

        const authServiceUrl = await discoverAuthService();
        const { data: myChildren } = await axios.get(`${authServiceUrl}/infos/get-children`, {
            headers: { 'x-user-id': parentId, 'x-user-role': userRole },
            timeout: 5000,
        });

        if (!myChildren || myChildren.length === 0) {
            return res.json({ parentId, childrenStats: [] });
        }

        const childIds = myChildren.map(c => c.userId);

        const allAssignments = await AssignmentModel.find({}).select('_id maxScore category');
        const maxScoreMap = Object.fromEntries(
            allAssignments.map(a => [
                a._id.toString(),
                { maxScore: a.maxScore || 0, subCatId: a.category?.subCategory }
            ])
        );
        const allAssignmentIds = allAssignments.map(a => a._id);

        const [enrollmentsByChild, submissionsByChild, quizAttemptsByChild] = await Promise.all([

            EnrollementModel.aggregate([
                { $match: { studentId: { $in: childIds } } },
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseId',
                        foreignField: '_id',
                        as: 'course',
                    },
                },
                { $unwind: '$course' },
                {
                    $group: {
                        _id: {
                            studentId: '$studentId',
                            subCategoryId: '$course.category.subCategory',
                        },
                        enrollmentCount: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.studentId',
                        totalEnrollments: { $sum: '$enrollmentCount' },
                        enrollmentsBySubCategory: {
                            $push: {
                                subCategoryId: '$_id.subCategoryId',
                                count: '$enrollmentCount',
                            },
                        },
                    },
                },
            ]),

            SolvingModel.aggregate([
                {
                    $match: {
                        studentId: { $in: childIds },
                        assignment: { $in: allAssignmentIds },
                        posted: true,
                        score: { $ne: null },
                    },
                },
                {
                    $group: {
                        _id: '$studentId',
                        totalSubmissions: { $sum: 1 },
                        totalScore: { $sum: '$score' },
                        submissions: {
                            $push: { assignmentId: '$assignment', score: '$score' },
                        },
                    },
                },
            ]),

            QuizAttemptModel.aggregate([
                { $match: { studentId: { $in: childIds } } },
                {
                    $group: {
                        _id: '$studentId',
                        totalQuizAttempts: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const enrollmentMap = Object.fromEntries(enrollmentsByChild.map(e => [e._id.toString(), e]));
        const submissionMap  = Object.fromEntries(submissionsByChild.map(s => [s._id.toString(), s]));
        const quizMap        = Object.fromEntries(quizAttemptsByChild.map(q => [q._id.toString(), q]));

        const allSubCatIds = new Set();
        enrollmentsByChild.forEach(e =>
            e.enrollmentsBySubCategory.forEach(s => {
                if (s.subCategoryId) allSubCatIds.add(s.subCategoryId.toString());
            })
        );
        submissionsByChild.forEach(s =>
            s.submissions.forEach(({ assignmentId }) => {
                const meta = maxScoreMap[assignmentId?.toString()];
                if (meta?.subCatId) allSubCatIds.add(meta.subCatId.toString());
            })
        );

        const subCatNameMap = {};
        await Promise.all(
            [...allSubCatIds].map(async (subCatId) => {
                try {
                    let cat = getSubject(subCatId);
                    if (!cat) {
                        const { data } = await axios.get(`${authServiceUrl}/infos/sub-subjects/${subCatId}`);
                        cat = data;
                    }
                    subCatNameMap[subCatId] = cat.name;
                } catch (_) {
                    subCatNameMap[subCatId] = 'Unknown';
                }
            })
        );

        // 5. Build per-child stats
        const childrenStats = myChildren.map(child => {
            const childId = child.userId.toString();

            const enrollData = enrollmentMap[childId];
            const totalEnrollments = enrollData?.totalEnrollments ?? 0;
            const enrollmentsBySubCategory = (enrollData?.enrollmentsBySubCategory ?? []).map(e => ({
                subCategoryId: e.subCategoryId,
                subCategoryName: subCatNameMap[e.subCategoryId?.toString()] ?? 'Unknown',
                count: e.count,
            }));

            const subData = submissionMap[childId];
            const totalSubmissions = subData?.totalSubmissions ?? 0;

            const categoryScores = {};
            let grandTotalScore = 0;
            let grandTotalMax   = 0;

            (subData?.submissions ?? []).forEach(({ assignmentId, score }) => {
                // use subCatId not categoryId
                const meta = maxScoreMap[assignmentId?.toString()];
                if (!meta) return;

                const catId = meta.subCatId?.toString() ?? 'uncategorized';
                if (!categoryScores[catId]) categoryScores[catId] = { totalScore: 0, totalMax: 0 };

                categoryScores[catId].totalScore += score;
                categoryScores[catId].totalMax   += meta.maxScore;
                grandTotalScore += score;
                grandTotalMax   += meta.maxScore;
            });

            const avgScoreByCategory = Object.entries(categoryScores).map(([subCatId, { totalScore, totalMax }]) => ({
                subCategoryId: subCatId,
                subCategoryName: subCatNameMap[subCatId] ?? 'Unknown',
                avgScorePercentage: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
            }));

            const overallAvgScorePercentage = grandTotalMax > 0
                ? Math.round((grandTotalScore / grandTotalMax) * 100)
                : 0;

            const totalQuizAttempts = quizMap[childId]?.totalQuizAttempts ?? 0;

            return {
                studentId: child.userId,
                familyName: child.familyName ?? 'Unknown',
                givenName:  child.givenName  ?? 'Unknown',
                email:      child.email      ?? null,
                img:        child.userImg    ?? null,
                linkedAt: child.linkedAt,
                totalEnrollments,
                enrollmentsBySubCategory,
                totalSubmissions,
                overallAvgScorePercentage,
                avgScoreByCategory,
                totalQuizAttempts,
            };
        });

        return res.json({ parentId, childrenStats });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error', message: error.message });
    }
});

module.exports = router