const express = require('express')
const router = express.Router()
const PostModel = require("../models/Posts");
const redis = require('../config/redis.config')

router.get('/stats', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

        const cachedKey = "postStats"
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const postsCount = await PostModel.countDocuments()

        await redis.setex(cachedKey, 300, postsCount)
        res.status(200).json(postsCount)
    } catch (error) {
        console.log("error: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

module.exports= router