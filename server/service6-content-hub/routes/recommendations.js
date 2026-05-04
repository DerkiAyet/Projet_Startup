const express = require('express')
const router = express.Router()
const { Recommendations } = require('../models')
const multer = require('multer')
const { getSubSubject, getSubject } = require('../config_server/kafka/consumer')
const { discoverAuthService } = require('../config_server/discovery.service')
const axios = require('axios')
const { publishNotification } = require('../config_server/kafka/producer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/ressources/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({ storage: storage })

router.post('/', async (req, res) => {
    try {

        const parentId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "parent") return res.status(403).json({ error: "unauthorized" })

        const studentId = Number(req.body.studentId)
        const recommendation = await Recommendations.findOne({ where: { parentId, studentId, contentType: req.body.contentType, contentId: req.body.contentId } })
        if (recommendation) return res.status(200).json("already recommended")

        const newRecommendation = await Recommendations.create({
            parentId,
            studentId,
            contentId: req.body.contentId,
            contentType: req.body.contentType,
            contentTitle: req.body.contentTitle,
            categoryId: req.body.categoryId ? Number(req.body.categoryId) : null,
            subCategoryId: req.body.subCategoryId ? Number(req.body.subCategoryId) : null
        })

        await publishNotification('NEW_RECOMMENDATION', {
            idSender: parentId,
            idReceiver: studentId,
            title: `your parent recommended you a course`,
            message: `your parent recommended you a course: ${newRecommendation.contentTitle}`,
            metadata: {
                data: newRecommendation,
                link: `/courses/${newRecommendation.contentId}?type=${newRecommendation.contentType}`
            },
        })

        res.status(201).json(newRecommendation)

    } catch (error) {
        console.log("error while recommending", error.message)
        res.status(500).json({ error: `Internal Server Error: ${error}` })
    }
})

router.get('/children/:childId/my-recommendations/', async (req, res) => {
    try {
        const parentId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "parent") return res.status(403).json({ error: "unauthorized" })

        const studentId = Number(req.params.childId)
        const recommendations = await Recommendations.findAll({ where: { parentId, studentId } })

        const enrichedRecommendations = await Promise.all(
            recommendations.map(async (rec) => {
                const authServiceUrl = await discoverAuthService()

                let resolvedCategory = null;
                if (rec.categoryId) {
                    resolvedCategory = getSubject(rec.categoryId)
                    if (!resolvedCategory) {
                        const { data } = await axios.get(`${authServiceUrl}/infos/subjects/${rec.categoryId}`)
                        resolvedCategory = data
                    }
                }
                
                let resolvedField = null;
                if (rec.subCategoryId) {
                    resolvedField = getSubSubject(rec.subCategoryId)
                    if (!resolvedField) {
                        const { data } = await axios.get(`${authServiceUrl}/infos/sub-subjects/${rec.subCategoryId}`)
                        resolvedField = data
                    }
                }

                return {
                    id: rec.id,
                    parentId: rec.parentId,
                    studentId: rec.studentId,
                    contentId: rec.contentId,
                    contentTitle: rec.contentTitle,
                    category: resolvedCategory ?{
                        idSubject: resolvedCategory.idSubject,
                        name: resolvedCategory.name,
                        color: resolvedCategory.color
                    } : null,
                    subCategory: resolvedField
                        ? { idSub: resolvedField.idSub, name: resolvedField.name }
                        : null,
                    viewed: rec.viewedByStudent
                }
            })
        )

        res.status(200).json(enrichedRecommendations)

    } catch (error) {
        console.log("error while fetching", error.message)
        res.status(500).json({ error: `Internal Server Error: ${error}` })
    }
})

router.put('/:recomendId/mark-read', async (req, res) => {
    try {
        const childId = Number(req.headers['x-user-id'])
        const userRole = req.headers['x-user-role']
        if (userRole !== "student") return res.status(403).json({ error: { unauthorized } })

        const recommendation = await Recommendations.findByPk(Number(req.params.recomendId))
        if (!recommendation) return res.status(404).json({ error: "recommendation not found" })

        if (recommendation.studentId !== childId) return res.status(400).json({ error: "not recommended for this child" })
        if (recommendation.viewedByStudent) return res.status(200).json("already marked as read")

        recommendation.viewedByStudent = true
        await recommendation.save()

        res.status(200).json({ msg: "operation success", recommendation })
    } catch (error) {
        console.log("error while mark as read", error.message)
        res.status(500).json({ error: `Internal Server Error: ${error}` })
    }
})

module.exports = router