const express = require('express')
const router = express.Router()
const OnlineCourseModel = require('../models/OnlineCourses')
const { resolveCategory, resolveField, resolveUser, resolveUserInterests } = require('../helpers/utils')
const redis = require('../config/redis.config')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/images/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 50 * 1024 * 1024
    }
})

router.get('/', async (req, res) => {  // all the courses - for the admin
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "admin") return res.status(403).json({ error: "Action Forbidden" })

        const cachedKey = 'onlineCourses'
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const courses = await OnlineCourseModel.find({ visibility: true })
        const enrichedCourses = (await Promise.all(
            courses.map(async (course) => {
                const responseUser = await resolveUser(course.teacherId)
                const responseCategory = await resolveCategory(course.category.id)
                const responseField = await resolveField(course.category.subCategory)

                const thumbnail = course.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const { thumbnail: _, ...courseData } = course.toObject()
                return {
                    ...courseData,
                    thumbnail,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                    teacher: responseUser,
                    isOutdated: course.isOutdated()
                }

            })
        )).filter(c => !c.isOutdated)
        
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedCourses))
        return res.status(200).json(enrichedCourses)
    } catch (error) {
        console.log("Error while fetching the courses", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/me', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher") return res.status(403).json({ error: "Action Forbidden" })
        const teacherId = Number(req.headers['x-user-id'])

        const cachedKey = `teacherOnlineCourses:${teacherId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const courses = await OnlineCourseModel.find({ teacherId: teacherId, visibility: true })
        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                const responseCategory = await resolveCategory(course.category.id)
                const responseField = await resolveField(course.category.subCategory)

                const thumbnail = course.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const { thumbnail: _t, category: _c, ...courseData } = course.toObject()
                return {
                    ...courseData,
                    thumbnail,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                }

            })
        )
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedCourses))
        return res.status(200).json(enrichedCourses)
    } catch (error) {
        console.log("Error while fetching the courses", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/recommended/me', async (req, res) => {
    try {
        const userRole = req.headers['x-user-role']
        if (userRole !== "teacher" && userRole !== "student") return res.status(403).json({ error: "Action Forbidden" })
        const userId = Number(req.headers['x-user-id'])

        const cachedKey = `recommendedOnlineCourses:${userId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const interestIds = await resolveUserInterests(userId, null)
        const courses = await OnlineCourseModel.find({
            visibility: true,
            "category.id": { $in: interestIds }
        });
        if (!courses.length) return res.json([]);

        const enrichedCourses = (await Promise.all(
            courses.map(async (course) => {
                const responseCategory = await resolveCategory(course.category.id)
                const responseField = await resolveField(course.category.subCategory)

                const thumbnail = course.thumbnail
                    ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                    : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                const { thumbnail: _t, category: _c, ...courseData } = course.toObject()
                return {
                    ...courseData,
                    thumbnail,
                    category: responseCategory,
                    subCategory: responseField ?? null,
                    isOutdated: course.isOutdated()
                }
            })
        )).filter(c => !c.isOutdated)
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedCourses))
        return res.status(200).json(enrichedCourses)
    } catch (error) {
        console.log("Error while fetching the courses", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const course = await OnlineCourseModel.findById(req.params.id)
        if (!course) return res.status(404).json({ error: "course no found" })

        const responseUser = await resolveUser(course.studentId)
        const responseCategory = await resolveCategory(course.category.id)
        const responseField = await resolveField(course.category.subCategory)

        const thumbnail = course.thumbnail
            ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
            : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

        const { thumbnail: _, category: _, ...courseData } = course.toObject()

        const finalData = {
            ...courseData,
            thumbnail,
            category: responseCategory,
            subCategory: responseField ?? null,
            teacher: responseUser
        }

        return res.status(200).json(finalData)
    } catch (error) {
        console.log("Error while fetching the course", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post('/', upload.single('thumbnail'), async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "teacher") return res.status(403).json({ error: "Action Forbidden" })
    const teacherId = Number(req.headers['x-user-id'])

    const { title, description, platform, sessionUrl, schedule, category } = req.body || {}

    if (!title || !platform || !sessionUrl || !category) {
        return res.status(400).json({ error: "Missing required fields: title, platform, sessionUrl or category" })
    }

    const thumbnail = req.file
        ? `images/${req.file.filename}`
        : null;

    try {
        const newCourse = await OnlineCourse.create({
            teacherId,
            title,
            description,
            thumbnail,
            platform,
            sessionUrl,
            schedule: JSON.parse(schedule),
            category: JSON.parse(category)
        })

        await redis.del(`teacherOnlineCourses:${teacherId}`)
        return res.status(201).json(newCourse)
    } catch (error) {
        console.log("Error while creating the course", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.put('/:id', upload.single("thumbnail"), async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "teacher") return res.status(403).json({ error: "Action Forbidden" })
    const teacherId = Number(req.headers['x-user-id'])

    try {
        const course = await OnlineCourseModel.findById(req.params.id)
        if (!course) return res.status(404).json({ error: "Course not found" })
        if (course.teacherId !== teacherId) return res.status(403).json({ error: "Action Forbidden" })

        const thumbnail = req.file
            ? `images/${req.file.filename}`
            : null;

        const allowed = ['title', 'description', 'platform', 'sessionUrl', 'schedule', 'category', 'visibility']
        allowed.forEach(field => {
            if (req.body[field] !== undefined) course[field] = req.body[field]
        })

        if (thumbnail) course.thumbnail = thumbnail;

        await course.save()

        await redis.del(`teacherOnlineCourses:${teacherId}`)
        return res.status(200).json(course)
    } catch (error) {
        console.log("Error while editing the course", error.message)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.delete('/:id', async (req, res) => {
    const userRole = req.headers['x-user-role']
    if (userRole !== "teacher") return res.status(403).json({ error: "Action Forbidden" })
    const teacherId = Number(req.headers['x-user-id'])

    try {
        const course = await OnlineCourseModel.findById(req.params.id)
        if (!course) return res.status(404).json({ error: "Course not found" })
        if (course.teacherId !== teacherId) return res.status(403).json({ error: "Action Forbidden" })

        await course.deleteOne()

        await redis.del(`teacherOnlineCourses:${teacherId}`)
        return res.status(200).json({ message: "Course deleted successfully" })
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
})

module.exports = router