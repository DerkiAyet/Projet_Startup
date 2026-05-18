const express = require('express')
const router = express.Router()
const CourseModel = require('../models/Courses')
const AssignmentModel = require('../models/Assignments')
const TipModel = require('../models/Tips')
const CommentModel = require('../models/Comments')
const QuizeModel = require('../models/Quizes')
const EnrollementModel = require('../models/Enrollements')
const { discoverAuthService, discoverNotifService } = require('../config/discovery.service')
const SolvingModel = require('../models/Solving')
const axios = require('axios')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunk size for streaming uploads to Cloudinary
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const { getUser, getSubject, getSubSubject, getTeacherExpertise, getStudentInterests } = require('../config/kafka/consumer');

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../tmp')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

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
        fieldSize: 50 * 1024 * 1024  // 50MB to handle base64 images in lesson HTML
    }
})

const uploadVideo = multer({  // separate multer instance for videos with higher file size limit - this is for handling video uploads in lessons, not course thumbnails
    storage: diskStorage, // using disk storage for videos to handle large file sizes without consuming too much memory
    limits: { fileSize: 4 * 1024 * 1024 * 1024 } // 4GB limit
});

async function enrichContent(item, typeContent, authServiceBaseUrl, categoryNames = [], subCategoryNames = []) {
    try {
        // Teacher + category info

        let responseUser = getUser(item.teacherId)
        if (!responseUser) {
            const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${item.teacherId}`)
            responseUser = data.user
        }
        let responseCategory = getSubject(item.category.id)
        if (!responseCategory) {
            const { data } = await axios.get(`${authServiceBaseUrl}/infos/subjects/${item.category.id}`)
            responseCategory = data
        }

        let responseField = null;
        if (item.category.subCategory) {
            try {
                responseField = getSubSubject(item.category.subCategory)

                if (!responseField) {
                    console.log(`Subcategory ${item.category.subCategory} not found in Kafka, trying API...`);
                    const { data } = await axios.get(
                        `${authServiceBaseUrl}/infos/sub-subjects/${item.category.subCategory}`
                    );
                    responseField = data;
                }
            } catch (subError) {
                console.log(`Subcategory ${item.category.subCategory} not found`);
                responseField = null;
            }
        }

        let comments = [];
        let enrolls = [];
        let solutions = [];
        let quiz = null;

        if (typeContent === "course") {
            [comments, enrolls, quiz] = await Promise.all([
                CommentModel.find({ contentId: item._id, contentType: "course" }),
                EnrollementModel.find({ courseId: item._id }),
                QuizeModel.findOne({ courseId: item._id })
            ]);
        }

        if (typeContent === "assignment") {
            solutions = await SolvingModel.find({ assignment: item._id })
        }

        // Thumbnail fallback
        const thumbnail = item.thumbnail
            ? `${process.env.GATEWAY_URI}/content/uploads/${item.thumbnail}`
            : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

        return {
            typeContent,
            _id: item._id,
            teacherId: item.teacherId,
            title: item.title,
            description: item.description,
            thumbnail,
            level: item.level,
            category: {
                idSubject: responseCategory.idSubject,
                name: responseCategory.name,
                color: responseCategory.color
            },
            subCategory: responseField
                ? { idSub: responseField.idSub, name: responseField.name }
                : null,
            lessons: item.lessons,
            exercises: item.exercises,
            tags: item.tags,
            visibility: item.visibility,
            createdAt: item.createdAt,
            avgRating: item.averageRating ? item.averageRating() : 0,

            comments,
            commentsCount: comments.length,
            enrollCount: enrolls.length,
            solveCount: solutions.length,
            quiz: quiz || null,

            teacher: {
                userId: responseUser.id,
                userName: responseUser.userName,
                familyName: responseUser.familyName,
                givenName: responseUser.givenName,
                userImg: responseUser.userImg || responseUser.uerImg,
                role: "teacher"
            }
        };
    } catch (err) {
        console.log("Error enriching:", err.message);
        return null;
    }
}

router.post('/', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : null;
    let { title, description, level, category, lessons, tags } = req.body || {};

    try {
        lessons = lessons ? JSON.parse(lessons) : [];
    } catch {
        lessons = [];
    }
    try {
        tags = tags ? JSON.parse(tags) : [];
    } catch {
        tags = [];
    }

    if (!title || !category || !level) {
        return res.status(400).json({ error: "Missing required fields: title, category, or level" });
    }

    try {
        const userRole = req.headers['x-user-role'];
        if (userRole !== 'teacher') return res.status(403).json({ error: "Unauthorized" });

        const newCourse = await CourseModel.create({
            teacherId,
            title,
            description,
            thumbnail,
            level,
            category: JSON.parse(category),
            lessons,
            tags
        });

        res.status(201).json({ message: "Course created successfully", course: newCourse });

    } catch (error) {
        console.error("Error creating course:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/upload-video', uploadVideo.single('video'), async (req, res) => {
    req.setTimeout(30 * 60 * 1000);
    res.setTimeout(30 * 60 * 1000);

    try {
        if (!req.file) return res.status(400).json({ error: "No video file provided" });

        const fileSize = fs.statSync(req.file.path).size;
        const isLarge = fileSize > 50 * 1024 * 1024; // files over 50MB use chunked upload

        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = isLarge
                ? cloudinary.uploader.upload_chunked_stream(
                    {
                        resource_type: 'video',
                        folder: 'course_videos',
                        chunk_size: CHUNK_SIZE,
                        timeout: 1800000,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                )
                : cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: 'course_videos',
                        timeout: 1800000,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

            fs.createReadStream(req.file.path).pipe(uploadStream);
        });

        fs.unlink(req.file.path, () => { });

        res.status(200).json({
            videoUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
        });

    } catch (error) {
        if (req.file?.path) fs.unlink(req.file.path, () => { });
        console.error("Video upload error:", error);
        res.status(500).json({ error: "Video upload failed" });
    }
});

router.delete('/video/:publicId', async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error("Video delete error:", error);
        res.status(500).json({ error: "Failed to delete video" });
    }
});

router.get('/', async (req, res) => {
    try {
        const courses = await CourseModel.find();
        const authServiceBaseUrl = await discoverAuthService();

        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                try {
                    let responseUser = getUser(course.teacherId)
                    if (!responseUser) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${course.teacherId}`)
                        responseUser = data.user
                    }
                    let responseCategory = getSubject(course.category.id)
                    if (!responseCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/subjects/${course.category.id}`)
                        responseCategory = data
                    }

                    let responseField = null;
                    if (course.category.subCategory) {
                        try {
                            responseField = getSubSubject(course.category.subCategory)

                            if (!responseField) {
                                console.log(`Subcategory ${course.category.subCategory} not found in Kafka, trying API...`);
                                const { data } = await axios.get(
                                    `${authServiceBaseUrl}/infos/sub-subjects/${course.category.subCategory}`
                                );
                                responseField = data;
                            }
                        } catch (subError) {
                            console.log(`Subcategory ${course.category.subCategory} not found`);
                            responseField = null;
                        }
                    }

                    const comments = await CommentModel.find({
                        contentId: course._id,
                        contentType: "course"
                    });

                    const enrolls = await EnrollementModel.find({ courseId: course._id })

                    const quiz = await QuizeModel.findOne({ courseId: course._id });

                    const thumbnail = course.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.data.subImg}`;

                    return {
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
                        tags: course.tags,
                        ratings: course.ratings,
                        avgRating: course.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        enrollCount: enrolls.length,
                        visibility: course.visibility,
                        createdAt: course.createdAt,
                        quiz: quiz || null,
                        teacher: {
                            userId: responseUser.id,
                            userName: responseUser.userName,
                            familyName: responseUser.familyName,
                            givenName: responseUser.givenName,
                            userImg: responseUser.uerImg,
                            role: "teacher"
                        } || null
                    };
                } catch (error) {
                    console.error("Error while enriching a course:", error.message);
                }
            })
        );

        res.json(enrichedCourses);

    } catch (error) {
        console.error("Error fetching courses:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/recommended/me', async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        let interestIds = [];
        if (userRole === 'student') {
            interestIds = getStudentInterests(currentUserId) || [];
        } else if (userRole === 'teacher') {
            interestIds = getTeacherExpertise(currentUserId) || [];
        }

        if (!interestIds || interestIds.length === 0) {
            const authServiceBaseUrl = await discoverAuthService();
            const { data } = await axios.get(
                `${authServiceBaseUrl}/infos/get-user-intrests`,
                { headers: { "x-user-id": currentUserId }, timeout: 5000 }
            );
            interestIds = data;
        }

        console.log("the intrest from kafka cache", interestIds)

        // ── Fetch only courses whose category.id is in the user's interests ──
        const courses = await CourseModel.find({
            visibility: true,
            "category.id": { $in: interestIds }
        });

        if (!courses.length) return res.json([]);

        const authServiceBaseUrl = await discoverAuthService();

        const enriched = (await Promise.all(
            courses.map(c => enrichContent(c, "course", authServiceBaseUrl, [], []))
        )).filter(Boolean);

        // sort by most recent
        enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(enriched);

    } catch (err) {
        console.error("Error fetching recommended courses:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/search', async (req, res) => {
    try {
        let { title, categoryId, categoryName, subCategoryName, level } = req.query;

        const normalizeList = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            return value.split(',').map(v => v.trim());
        };

        const categoryIds = normalizeList(categoryId);
        const categoryNames = normalizeList(categoryName);
        const subCategoryNames = normalizeList(subCategoryName);

        console.log('Search params:', { title, categoryIds, categoryNames, subCategoryNames, level });

        // ── ONLY filter by database-level filters (no title here!) ──
        const mongoFilter = { visibility: true };

        if (level) {
            mongoFilter.level = level;
        }

        if (categoryIds.length) {
            mongoFilter["category.id"] = { $in: categoryIds };
        }

        console.log('Mongo filter:', JSON.stringify(mongoFilter, null, 2));

        // Fetch ALL content that passes level and categoryId filters
        const [courses, assignments, tips] = await Promise.all([
            CourseModel.find(mongoFilter),
            AssignmentModel.find(mongoFilter),
            TipModel.find(mongoFilter)
        ]);

        console.log(`Found: ${courses.length} courses, ${assignments.length} assignments, ${tips.length} tips`);

        const authServiceBaseUrl = await discoverAuthService();

        // ── Enrich everything (pass empty arrays for categoryNames/subCategoryNames to disable filtering inside enrichContent) ──
        const allEnriched = (await Promise.all([
            ...courses.map(c => enrichContent(c, "course", authServiceBaseUrl, [], [])),
            ...assignments.map(a => enrichContent(a, "assignment", authServiceBaseUrl, [], [])),
            ...tips.map(t => enrichContent(t, "tip", authServiceBaseUrl, [], []))
        ])).filter(Boolean);

        console.log(`Total enriched items: ${allEnriched.length}`);

        // ── Apply OR filter in memory ──
        const hasFilters = title || categoryNames.length > 0 || subCategoryNames.length > 0;

        const filtered = !hasFilters
            ? allEnriched
            : allEnriched.filter(item => {
                let matches = false;

                // Check title match (if title provided)
                if (title && item.title) {
                    matches = item.title.toLowerCase().includes(title.toLowerCase());
                    if (matches) console.log(`Item "${item.title}" matched by title`);
                }

                // Check category match (if not already matched)
                if (!matches && categoryNames.length > 0 && item.category?.name) {
                    matches = categoryNames.some(catName =>
                        item.category.name.toLowerCase().includes(catName.toLowerCase())
                    );
                    if (matches) console.log(`Item "${item.title}" matched by category: ${item.category.name}`);
                }

                // Check subcategory match (if not already matched)
                if (!matches && subCategoryNames.length > 0 && item.subCategory?.name) {
                    matches = subCategoryNames.some(subName =>
                        item.subCategory.name.toLowerCase().includes(subName.toLowerCase())
                    );
                    if (matches) console.log(`Item "${item.title}" matched by subcategory: ${item.subCategory.name}`);
                }

                return matches;
            });

        console.log(`Filtered items: ${filtered.length}`);

        // Don't delete the names, just send them as is
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(filtered);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put('/:courseId', upload.single('thumbnail'), async (req, res) => {
    const teacherId = req.headers['x-user-id'];
    const { courseId } = req.params;

    if (!teacherId) return res.status(400).json({ error: "Missing user ID in headers" });
    if (!courseId) return res.status(400).json({ error: "Missing course ID in parameters" });

    const thumbnail = req.file?.filename ? `images/${req.file.filename}` : undefined;

    let { title, description, level, category, lessons, tags } = req.body || {};

    try {
        lessons = lessons ? JSON.parse(lessons) : undefined;
    } catch {
        lessons = undefined;
    }
    try {
        tags = tags ? JSON.parse(tags) : undefined;
    } catch {
        tags = undefined;
    }

    try {

        const course = await CourseModel.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (course.teacherId !== teacherId) return res.status(403).json({ error: "You can only update your own courses" });

        if (title) course.title = title;
        if (description) course.description = description;
        if (thumbnail) course.thumbnail = thumbnail;
        if (level) course.level = level;
        if (category) course.category = JSON.parse(category);
        if (lessons) course.lessons = lessons;
        if (tags) course.tags = tags;

        await course.save();

        res.status(200).json({ message: "Course updated successfully", course });

    } catch (error) {
        console.error("Error updating course:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/teacher/:teacherId', async (req, res) => {

    const teacherId = req.params.teacherId

    try {

        const courses = await CourseModel.find({ teacherId: teacherId })
        const authServiceBaseUrl = await discoverAuthService()

        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                try {

                    let responseCategory = getSubject(course.category.id)
                    if (!responseCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/subjects/${course.category.id}`)
                        responseCategory = data
                    }
                    let responseField = null;
                    if (course.category.subCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/sub-subjects/${course.category.subCategory}`);
                        responseField = data;
                    }

                    const comments = await CommentModel.find({
                        contentId: course._id,
                        contentType: "course"
                    });

                    const enrolls = await EnrollementModel.find({ courseId: course._id })

                    const quiz = await QuizeModel.findOne({ courseId: course._id });

                    const thumbnail = course.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                    return {
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
                        tags: course.tags,
                        ratings: course.ratings,
                        avgRating: course.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        enrollCount: enrolls.length,
                        visibility: course.visibility,
                        createdAt: course.createdAt,
                        quiz: quiz || null
                    }

                } catch (error) {
                    console.error("Error while fetching for the quizes", error.message)
                }
            })
        )

        res.status(200).json(enrichedCourses)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/teacher-courses', async (req, res) => {
    const userId = req.headers['x-user-id']

    try {

        const courses = await CourseModel.find({ teacherId: userId })
        const authServiceBaseUrl = await discoverAuthService()

        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                try {

                    let responseCategory = getSubject(course.category.id)
                    if (!responseCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/subjects/${course.category.id}`)
                        responseCategory = data
                    }
                    let responseField = null;
                    if (course.category.subCategory) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/infos/sub-subjects/${course.category.subCategory}`);
                        responseField = data;
                    }

                    const comments = await CommentModel.find({
                        contentId: course._id,
                        contentType: "course"
                    });

                    const enrolls = await EnrollementModel.find({ courseId: course._id })

                    const quiz = await QuizeModel.findOne({ courseId: course._id });

                    const thumbnail = course.thumbnail
                        ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
                        : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

                    return {
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
                        tags: course.tags,
                        ratings: course.ratings,
                        avgRating: course.averageRating(),
                        comments,
                        commentsCount: comments.length,
                        enrollCount: enrolls.length,
                        visibility: course.visibility,
                        createdAt: course.createdAt,
                        quiz: quiz || null
                    }

                } catch (error) {
                    console.error("Error while fetching for the quizes", error.message)
                }
            })
        )

        res.status(200).json(enrichedCourses)

    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
})

router.get('/:id', async (req, res) => {
    const courseId = req.params.id
    try {
        const course = await CourseModel.findById(courseId);
        if (!course) return res.status(404).json({ error: "course not found" });

        const authServiceBaseUrl = await discoverAuthService()

        let responseUser = getUser(course.teacherId)
        if (!responseUser) {
            const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${course.teacherId}`)
            responseUser = data.user
        }

        let responseCategory = getSubject(course.category.id)
        if (!responseCategory) {
            const { data } = await axios.get(`${authServiceBaseUrl}/infos/subjects/${course.category.id}`)
            responseCategory = data
        }
        let responseField = null;
        if (course.category.subCategory) {
            const { data } = await axios.get(`${authServiceBaseUrl}/infos/sub-subjects/${course.category.subCategory}`);
            responseField = data;
        }

        const thumbnail = course.thumbnail
            ? `${process.env.GATEWAY_URI}/content/uploads/${course.thumbnail}`
            : `${process.env.GATEWAY_URI}/auth/uploads/${responseCategory.subImg}`;

        const enrollemnts = await EnrollementModel.find({ courseId: course._id })

        const quiz = await QuizeModel.findOne({ courseId: course._id });

        const comments = await CommentModel.find({ contentId: courseId, contentType: "course" })
        let enrichedComments;
        if (comments) {
            enrichedComments = await Promise.all(
                comments.map(async (c) => {
                    let resolvedCommentUser = getUser(c.userId)
                    if (!resolvedCommentUser) {
                        const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${c.userId}`)
                        resolvedCommentUser = data.user
                    }

                    const replies = c.replies
                    let enrichedReplies

                    if (replies) {
                        enrichedReplies = await Promise.all(
                            replies.map(async (r) => {

                                let resolvedUser = getUser(r.userId)
                                if (!resolvedUser) {
                                    const { data } = await axios.get(`${authServiceBaseUrl}/get_user_byId/${r.userId}`)
                                    resolvedUser = data.user
                                }

                                return {
                                    _id: r._id,
                                    text: r.text,
                                    likes: r.likes,
                                    userName: resolvedUser.userName,
                                    familyName: resolvedUser.familyName,
                                    givenName: resolvedUser.givenName,
                                    userImg: resolvedUser.uerImg,
                                    role: resolvedUser.role
                                }
                            })
                        )
                    }

                    return {
                        _id: c._id,
                        text: c.text,
                        replies: enrichedReplies,
                        likes: c.likes,
                        userName: resolvedCommentUser.userName,
                        familyName: resolvedCommentUser.familyName,
                        givenName: resolvedCommentUser.givenName,
                        userImg: resolvedCommentUser.uerImg,
                        role: resolvedCommentUser.role,
                    }
                })
            )
        }

        const finalcourse = {
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
                tags: course.tags,
                ratings: course.ratings,
                avgRating: course.averageRating(),
                comments: enrichedComments,
                commentsCount: comments.length,
                enrollCount: enrollemnts.length,
                visibility: course.visibility,
                createdAt: course.createdAt,
                quiz: quiz || null,
            },
            comments: enrichedComments,
            teacher: {
                userId: responseUser.id,
                userName: responseUser.userName,
                familyName: responseUser.familyName,
                givenName: responseUser.givenName,
                userImg: responseUser.uerImg,
                role: "teacher"
            } || null
        }

        res.status(200).json(finalcourse)

    } catch (error) {
        console.log("Internal Error Server", error.message)
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "course not found" });

        if (course.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        await course.deleteOne();

        res.json({ message: "course deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//-----------Comments & Rating
router.get('/:id/comments', async (req, res) => {
    const courseId = req.params.id

    try {
        const comments = await CommentModel.find({ contentId: courseId, contentType: "course" })
        res.status(200).json(comments)
    } catch (error) {
        console.error("error while fetching comments", error.message)
    }
})

router.post('/:courseId/comment', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const courseId = req.params.courseId

    try {

        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })

        const newComment = await CommentModel.create({
            userId: userId,
            contentId: courseId,
            text: req.body.text,
            contentType: "course"
        })

        res.status(200).json(newComment)

    } catch (error) {
        console.error("error while creating the comment", error.message)
    }
})


router.post('/:courseId/comment/:commentId/reply', async (req, res) => {
    const userId = req.headers["x-user-id"]
    const courseId = req.params.courseId
    const commentId = req.params.commentId
    try {
        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })

        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "comment not found" })

        const reply = {
            userId: userId,
            text: req.body.text,
        }

        comment.replies.push(reply)         // push returns length, ignore it
        await comment.save()

        // Send back the actual new reply (last item after save)
        const savedReply = comment.replies[comment.replies.length - 1]
        res.status(200).json(savedReply)

    } catch (error) {
        console.error("error while creating the comment", error.message)
        res.status(500).json({ error: error.message })  // ← also add this, you had no error response!
    }
})

router.post('/:courseId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const courseId = req.params.courseId
        const commentId = req.params.commentId

        const course = await CourseModel.findById(courseId)
        if (!course) return res.status(404).json({ error: "course not found" })
        const comment = await CommentModel.findById(commentId)
        if (!comment) return res.status(404).json({ error: "course not found" })

        const alreadyLiked = comment.likes.some(like => like.userId == userId);

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(like => like.userId != userId);
        } else {
            comment.likes.push({ userId });
        }

        await comment.save();
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.delete("/:courseId/comment/:commentId", async (req, res) => {
    try {

        const comment = await CommentModel.findById(req.params.commentId)
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        comment.deleteOne();

        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/rating', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const course = await CourseModel.findById(req.params.id);
        const rating = req.body.rating

        if (!course) return res.status(404).json({ error: "Coourse not found" });

        const alreadyRated = course.ratings.find((userRating) => userRating.userId == userId)

        if (alreadyRated) {
            if (rating) alreadyRated.rating = rating
        } else {
            course.ratings.push({
                userId: userId,
                rating: rating
            })
        }
        await course.save()
        res.json(course.ratings);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

//------------Quizes
router.post('/:courseId/quiz', async (req, res) => {
    const courseId = req.params.courseId;
    const teacherId = req.headers['x-user-id']

    try {
        const course = await CourseModel.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });

        const category = {
            id: course.category.id,
            subCategory: course.category.subCategory
        }

        let { title, description, difficulty, questions, score } = req.body || {}

        if (!title || !difficulty) return res.status(400).json({ error: "Missing fields: title, difficulty" })

        const existedQuize = await QuizeModel.findOne({ courseId: courseId })

        if (existedQuize) return res.status(400).json({ quizExist: "a quize already exists for this course" })

        const newQuize = await QuizeModel.create({
            teacherId,
            title,
            description,
            difficulty,
            category,
            questions,
            courseId,
            score,
        })

        res.status(200).json(newQuize)

    } catch (error) {

        console.log("Internal Server error", error.message)
    }
})

module.exports = router;