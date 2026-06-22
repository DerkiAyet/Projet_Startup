const express = require('express')
const router = express.Router()
const { LevelModel, XP_POINTS } = require('../models/Level')
const { RecordModel, EDUCATION_POINTS } = require('../models/Record')
const { emitToGameRoom } = require('../config/kafka/producer')
const EDUCATION_MISSION_TYPES = new Set(Object.keys(EDUCATION_POINTS))
const redis = require('../config/redis.config')

async function checkLevelUp(record) {
    const levelCacheKey = `game:level:${record.currentLevelId}`
    let currentLevel;
    const cached = await redis.get(levelCacheKey)
    if (cached) {
        currentLevel = JSON.parse(cached)
    } else {
        currentLevel = await LevelModel.findById(record.currentLevelId)
        if (currentLevel) await redis.setex(levelCacheKey, 3600, JSON.stringify(currentLevel)) // 1 hour since they don't change and the service is very active 
    }

    const allMissionsAchieved = currentLevel.missions.every(mission => // verify that every mission is achieved
        record.achievements.some(
            a => (a.missionId.toString() === mission._id.toString() && a.completed)
        )
    )
    if (!allMissionsAchieved) return null

    // then we check if student has enough XP for next level
    const nextLevel = await LevelModel.findOne({
        key: currentLevel.key + 1
    })
    if (!nextLevel) return null  // already at max level

    if (record.xp < nextLevel.xpRequired) return null  // not enough XP yet

    // Both conditions met → level up
    await RecordModel.findOneAndUpdate(
        { studentId: record.studentId },
        { $set: { currentLevelId: nextLevel._id } }
    )

    await redis.del(`game:progress:${record.studentId}`)

    return nextLevel
}

async function progressMission(studentId, missionType) {
    const record = await RecordModel.findOne({ studentId })
    if (!record) throw new Error('Record not found')

    const currentLevel = await LevelModel.findById(record.currentLevelId)
    if (!currentLevel) throw new Error('Level not found')

    const mission = currentLevel.missions.find(m => m.type === missionType)
    if (!mission) return null

    // Find or create the achievement entry
    let achievement = record.achievements.find(
        a => a.missionId.toString() === mission._id.toString()
    )

    const currentProgress = achievement ? achievement.progress : 0
    const newProgress = currentProgress + 1
    const justCompleted = newProgress >= mission.toDo

    // XP and points only awarded upon full completion
    const xpGain = justCompleted ? XP_POINTS[missionType] * mission.toDo : 0
    const pointsGain = justCompleted && EDUCATION_POINTS[missionType]
        ? EDUCATION_POINTS[missionType] * mission.toDo
        : 0

    let updatedRecord

    if (!achievement) {
        // First progress on this mission → push new achievement
        updatedRecord = await RecordModel.findOneAndUpdate(
            { studentId },
            {
                $inc: { xp: xpGain, points: pointsGain },
                $push: {
                    achievements: {
                        missionId: mission._id,
                        progress: newProgress,
                        completed: justCompleted,
                        achievedAt: justCompleted ? new Date() : null
                    }
                }
            },
            { new: true }
        )
    } else {
        // Update existing achievement progress
        updatedRecord = await RecordModel.findOneAndUpdate(
            { studentId, 'achievements.missionId': mission._id },
            {
                $inc: {
                    xp: xpGain,
                    points: pointsGain,
                    'achievements.$.progress': 1
                },
                $set: {
                    'achievements.$.completed': justCompleted,
                    'achievements.$.achievedAt': justCompleted ? new Date() : null
                }
            },
            { new: true }
        )
    }

    const newLevel = justCompleted ? await checkLevelUp(updatedRecord) : null

    if (newLevel) {
        const nextLevelXp = await LevelModel.findOne({
            key: newLevel.key + 1
        }).select("xpRequired")
        if (!nextLevelXp) return null

        await emitToGameRoom(`gamification:${studentId}`, "new_level", { xpGain, pointsGain, nextLevel: newLevel, nextLevelXp: nextLevelXp.xpRequired })
    } else if (justCompleted && !achievement?.completed) {
        await emitToGameRoom(`gamification:${studentId}`, "new_achievement", { mission, xpGain, pointsGain })
    }

    await redis.del(`game:progress:${studentId}`)
    return { updatedRecord, xpGain, pointsGain, justCompleted, newLevel }
}

async function IntiateProgress(studentId) {
    try {
        const existing = await RecordModel.findOne({ studentId })
        if (existing) return null

        const firstLevel = await LevelModel.findOne({ key: 0 })
        if (!firstLevel) return null

        const newRecord = await RecordModel.create({
            studentId,
            currentLevelId: firstLevel._id
        })

        const nextLevelXp = await LevelModel.findOne({
            key: firstLevel.key + 1
        }).select("xpRequired")
        if (!nextLevelXp) return null

        await emitToGameRoom(`gamification:${studentId}`, "game_started", { firstLevel, nextLevelXp: nextLevelXp.xpRequire })

        return newRecord
    } catch (error) {
        console.log("error while creating the record for the new student", error.message)
        throw error
    }
}

router.get('/my-progress', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "student") return res.status(403).json({ error: "Forbidden" })

        const cacheKey = `game:progress:${studentId}`
        const cached = await redis.get(cacheKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const record = await RecordModel.findOne({ studentId: studentId })
        if (!record) return res.status(404).json({ error: "no record for this student" })

        const currentLevel = await LevelModel.findById(record.currentLevelId)

        const awaitedMissions = currentLevel.missions
            .filter(m => !record.achievements.some(
                a => a.missionId.toString() === m._id.toString() && a.completed
            ))
            .map(m => {
                const achievement = record.achievements.find(
                    a => a.missionId.toString() === m._id.toString()
                )
                return {
                    ...m.toObject(),
                    progress: achievement ? achievement.progress : 0
                }
            })

        const nextLevel = await LevelModel.findOne({ key: currentLevel.key + 1 }).select("coverImg name xpRequired")

        const result = {
            currentLevel: {
                name: currentLevel.name,
                coverImg: currentLevel.coverImg,
                missions: currentLevel.missions
            },
            currentProgress: record,
            whatToDo: awaitedMissions,
            nextLevel: nextLevel ? {
                name: nextLevel.name,
                coverImg: nextLevel.coverImg,
                xpRequired: nextLevel.xpRequired
            } : null,
        }
        
        await redis.setex(cacheKey, 300, JSON.stringify(result))
        return res.status(200).json(result)
    } catch (error) {
        console.log("error fetching for the student progress", error.message)
        res.status(500).json({ error: "Internal Server Error", msg: error.message })
    }
})

router.delete('/', async (req, res) => {
    try {
        const studentId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "student") return res.status(403).json({ error: "Forbidden" })

        const record = await RecordModel.findOne({ studentId: studentId })
        if (!record) return res.status(404).json({ error: "no record for this student" })

        await record.deleteOne()
        return res.status(200).json({ msg: "item deleted" })
    } catch (error) {
        console.log("error while deleting", error.message)
        res.status(500).json({ error: "Internal Server Error", msg: error.message })
    }
})

module.exports = { router, progressMission, IntiateProgress }