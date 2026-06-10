const express = require('express')
const router = express.Router()
const { LevelModel } = require('../models/Level')
const multer = require('multer')
const redis = require('../config/redis.config')

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

router.post('/', upload.single("coverImg"), async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const { name, xpRequired } = req.body
        const coverImg = req.file ? `images/${req.file.filename}` : null

        const level = await LevelModel.findOne({ name })
        if (level) return res.status(400).json({ error: "a level already exists with this name" })

        const lastKey = await LevelModel.find().countDocuments()

        const newLevel = await LevelModel.create({
            creatorId: Number(req.headers['x-user-id']),
            name,
            key: lastKey,
            coverImg,
            missions: [],
            xpRequired
        })

        await redis.del('gameLevels')
        return res.status(201).json({ newLevel })
    } catch (error) {
        console.log("error while creating a new level", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.get('/', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const cachedKey = 'gameLevels'
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const levels = await LevelModel.find()

        await redis.setex(cachedKey, 600, JSON.stringify(levels))
        res.status(200).json(levels)
    } catch (error) {
        console.log("error while fetching the levels", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.get('/:levelId', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const cachedKey = `game:level:${req.params.levelId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        await redis.setex(cachedKey, 600, JSON.stringify(level))
        res.status(200).json(level)
    } catch (error) {
        console.log("error while fetching the levels", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.put('/:levelId', upload.single("coverImg"), async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        const { name, xpRequired } = req.body
        const coverImg = req.file ? `images/${req.file.filename}` : null

        level.name = name
        level.coverImg = coverImg
        level.xpRequired = xpRequired
        await level.save()

        await redis.del(`game:level:${req.params.levelId}`)
        return res.status(200).json(level)
    } catch (error) {
        console.log("error while updating the level", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.delete('/:levelId', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        await level.deleteOne();

        await redis.del(`game:level:${req.params.levelId}`)
        return res.status(200).json({ msg: "level deleted" })
    } catch (error) {
        console.log("error while deleting the level", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.put('/:levelId/missions', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        const { toDo, type } = req.body
        const mission = level.missions.some((m) => m.type === type)
        if (mission) return res.status(200).json({ msg: "mission already exist with this type" })
        level.missions.push({
            type,
            toDo
        })
        await level.save()

        await redis.del(`game:level:${req.params.levelId}`)

        const newMission = level.missions[level.missions.length - 1]
        return res.status(201).json(newMission)
    } catch (error) {
        console.log("error while adding a mission to the level", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.put('/:levelId/missions/:missionId', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        const { toDo, type } = req.body

        // find the mission, not just check existence
        const mission = level.missions.find(
            m => m._id.toString() === req.params.missionId
        )
        if (!mission) return res.status(404).json({ error: "mission doesn't exist" })

        const updatedLevel = await LevelModel.findOneAndUpdate(
            {
                _id: req.params.levelId,
                'missions._id': req.params.missionId
            },
            {
                $set: {
                    'missions.$.type': type,           // $ refers to matched mission
                    'missions.$.toDo': toDo
                }
            },
            { new: true }
        )

        const updatedMission = level.missions.find(m => m._id.toString() === req.params.missionId)

        await redis.del(`game:level:${req.params.levelId}`)
        return res.status(200).json(updatedMission)
    } catch (error) {
        console.log("error while updating mission", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

router.delete('/:levelId/missions/:missionId', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Forbidden" })

        const level = await LevelModel.findById(req.params.levelId)
        if (!level) return res.status(404).json({ error: "level doesn't exist" })

        const mission = level.missions.find(
            m => m._id.toString() === req.params.missionId
        )
        if (!mission) return res.status(404).json({ error: "mission doesn't exist" })

        level.missions = level.missions.filter((m) => m._id.toString() !== mission._id)
        await level.save()

        await redis.del(`game:level:${req.params.levelId}`)
        return res.status(200).json(level)
    } catch (error) {
        console.log("error while updating mission", error.message)
        return res.status(500).json({ error: "Internal Server Error", message: error.message })
    }
})

module.exports = router