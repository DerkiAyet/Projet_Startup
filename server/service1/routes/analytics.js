const express = require('express')
const router = express.Router()
const { Users, Students, Parents, Teachers } = require('../models');
const redis = require('../config_service/redis.config')

router.get('/stats', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

        const cachedKey = "userStats"
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const students = await Users.count({ where: { role: "student", isActive: true } })
        const teachers = await Users.count({ where: { role: "teacher", isActive: true } })
        const parents = await Users.count({ where: { role: "parent", isActive: true } })

        const result = [
            {
                name: "students",
                count: students
            },
            {
                name: "teachers",
                count: teachers
            },
            {
                name: "parents",
                count: parents
            }
        ]

        await redis.setex(cachedKey, 300, JSON.stringify({details: result, totalUsers: (students + teachers + parents)}))
        res.status(200).json({details: result, totalUsers: (students + teachers + parents)})
    } catch (error) {
        console.log("error: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

module.exports = router