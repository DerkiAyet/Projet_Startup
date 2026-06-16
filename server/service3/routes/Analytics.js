const express = require('express')
const router = express.Router()
const AssignmentModel = require('../models/Assignments')
const CourseModel = require('../models/Courses')
const QuizeModel = require('../models/Quizes')
const OnlineCourseModel = require('../models/OnlineCourses')
const TipModel = require('../models/Tips')
const redis = require('../config/redis.config')

router.get('/stats', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

        const cachedKey = "educontentStats"
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const coursesCount = await CourseModel.countDocuments({visibility: true})
        const assignsCount = await AssignmentModel.countDocuments({visibility: true})
        const tipsCount = await TipModel.countDocuments({visibility: true})
        const onlineclassCount = await OnlineCourseModel.countDocuments({visibility: true})
        const quizesCount = await QuizeModel.countDocuments()

        const result = [
            {
                name: "courses",
                count: coursesCount,
            },
            {
                name: "assignments",
                count: assignsCount,
            },
            {
                name: "tips",
                count: tipsCount,
            },
            {
                name: "quizes",
                count: quizesCount,
            },
            {
                name: "online classes",
                count: onlineclassCount,
            },
        ]

        const final = {
            totalCount: (onlineclassCount + coursesCount + tipsCount + assignsCount + quizesCount), 
            details: result
        }
        await redis.setex(cachedKey, 300, JSON.stringify(final))
        res.status(200).json(final)
    } catch (error) {
        console.log("error: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

module.exports= router