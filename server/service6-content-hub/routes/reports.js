const express = require('express')
const router = express.Router()
const { Reports, Warnings } = require('../models')

router.get('/', async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

    try {
        const reports = await Reports.findAll()
        return res.status(200).json(reports)
    } catch (error) {
        console.log("error while fetching the reports: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

// GET reports by current user
router.get('/me', async (req, res) => {
    const userId = Number(req.headers['x-user-id'])

    try {
        const reports = await Reports.findAll({ where: { userId } })
        return res.status(200).json(reports)
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/', async (req, res) => {
    const userId = Number(req.headers['x-user-id'])
    const { about, refId, refType, message } = req.body || {}

    if (!about || !message) {
        return res.status(400).json({ error: "Missing required fields: about or message" })
    }

    try {
        const report = await Reports.create({ userId, about, refId, refType, message })
        return res.status(201).json(report)
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

// mark report as processed (admin only)
router.put('/:id/process', async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })
    const adminId = Number(req.headers['x-user-id'])

    try {
        const report = await Reports.findByPk(req.params.id)
        if (!report) return res.status(404).json({ error: "Report not found" })

        await report.update({ processedByAdmin: adminId })
        return res.status(200).json(report)
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.delete('/:id', async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

    try {
        const report = await Reports.findByPk(req.params.id)
        if (!report) return res.status(404).json({ error: "Report not found" })

        await report.destroy()
        return res.status(200).json({ message: "Report deleted successfully" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/admin/stats', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") 
            return res.status(403).json({ error: "Action Forbidden" })

        const allReports = await Reports.findAll()

        const counts = allReports.reduce((acc, r) => {
            acc[r.about] = (acc[r.about] || 0) + 1
            return acc
        }, {})

        const final = {
            totalCount: allReports.length,
            details: [
                { name: "user", count: counts.user || 0 },
                { name: "post", count: counts.post || 0 },
                { name: "content", count: counts.content || 0 },
                { name: "comment", count: counts.comment || 0 }
            ]
        }

        return res.status(200).json(final)

    } catch (error) {
        console.log("error: ", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

//------------Warnings---------------

router.post('/:reportId/warning', async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })
    const adminId = Number(req.headers['x-user-id'])

    const { message, type, targetId } = req.body || {}
    if (!message || !targetId) {
        return res.status(400).json({ error: "Missing required fields: message or targetId" })
    }

    try {
        const report = await Reports.findByPk(req.params.reportId)
        if (!report) return res.status(404).json({ error: "Report not found" })

        const warning = await Warnings.create({
            reportId: report.id,
            targetId,
            sentByAdmin: adminId,
            message,
            type: type ?? 'warning'
        })

        // mark the report as processed at the same time
        await report.update({ processedByAdmin: adminId })

        return res.status(201).json(warning)
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

// GET all warnings for a specific user (admin or the user themselves)
router.get('/warnings/:targetId', async (req, res) => {
    const userRole = req.headers['x-user-role']
    const userId = Number(req.headers['x-user-id'])
    const targetId = Number(req.params.targetId)

    if (userRole !== "admin" && userId !== targetId) {
        return res.status(403).json({ error: "Action Forbidden" })
    }

    try {
        const warnings = await Warnings.findAll({
            where: { targetId },
            include: [{ model: Reports }]
        })
        return res.status(200).json(warnings)
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router