const express = require("express");
const router = express.Router();
const Post = require("../models/Posts");
const Follow = require("../models/Followers");
const Save = require("../models/Savings")
const multer = require('multer');
const path = require('path');
const { discoverAuthService } = require('../config/discovery.service')
const axios = require('axios')
const { publishNotification, updateGamification } = require('../config/kafka/producer')
const redis = require('../config/redis.config')
const { resolveUser, resolveUserInterests, incrementLike, decrementLike, getLikesCount } = require('../helpers/utils.js')

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Check file type and save to appropriate folder
        if (file.mimetype.startsWith('image/')) {
            cb(null, 'uploads/images/');
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, 'uploads/videos/');
        } else {
            cb(new Error('Invalid file type'), null);
        }
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos
    }
});

router.get("/", async (req, res) => {
    try {
        const currentUserId = req.headers["x-user-id"];
        const userRole = req.headers['x-user-role'];

        const userInterests = await resolveUserInterests(currentUserId, userRole)

        if (!Array.isArray(userInterests) || userInterests.length === 0) {
            return res.json([]);
        }

        const feedCacheKey = `feed:${currentUserId}`; //get the feed of the user if cached in redis (for 2min)
        const cachedFeed = await redis.get(feedCacheKey);
        if (cachedFeed) {
            return res.json(JSON.parse(cachedFeed));
        }

        const posts = await Post.find().sort({ createdAt: -1 });

        const filteredPosts = [];

        for (const post of posts) {
            let authorInterests = await resolveUserInterests(String(post.userId), null);
            if (!authorInterests || authorInterests.length === 0) continue;

            const shareCommon = authorInterests.some((id) =>
                userInterests.map(String).includes(String(id))
            );

            if (shareCommon) filteredPosts.push(post);
        }

        // Enrich filtered posts with full user + comments detail
        const enrichedPosts = await Promise.all(
            filteredPosts.map(async (post) => {
                try {
                    let resolvedUser = await resolveUser(post.userId)

                    const commentsCount = post.comments.reduce((acc, c) => {
                        return acc + 1 + (c.replies ? c.replies.length : 0);
                    }, 0);
                    const enrichedComments = await Promise.all(
                        (post.comments || []).map(async (c) => {
                            let resolvedCommentUser = await resolveUser(c.userId)
                            const enrichedReplies = await Promise.all(
                                (c.replies || []).map(async (r) => {
                                    let resolvedReplyUser = await resolveUser(r.userId)
                                    return {
                                        _id: r._id,
                                        text: r.text,
                                        likes: r.likes,
                                        userName: resolvedReplyUser.userName,
                                        familyName: resolvedReplyUser.familyName,
                                        givenName: resolvedReplyUser.givenName,
                                        userImg: resolvedReplyUser.userImg,
                                        role: resolvedReplyUser.role,
                                    };
                                })
                            );

                            return {
                                _id: c._id,
                                text: c.text,
                                replies: enrichedReplies,
                                likes: c.likes,
                                userId: c.userId,
                                userName: resolvedCommentUser.userName,
                                familyName: resolvedCommentUser.familyName,
                                givenName: resolvedCommentUser.givenName,
                                userImg: resolvedCommentUser.userImg,
                                role: resolvedCommentUser.role,
                                createdAt: c.createdAt
                            };
                        })
                    );

                    return {
                        _id: post._id,
                        userId: post.userId,
                        content: post.content,
                        mediaUrl: post.mediaUrl,
                        mediaType: post.mediaType,
                        mediaSize: post.mediaSize,
                        visibility: post.visibility,
                        tags: post.tags,
                        mentions: post.mentions,
                        urls: post.urls,
                        likes: post.likes,
                        createdAt: post.createdAt,
                        comments: enrichedComments,
                        likesCount: post.likes.length,
                        commentsCount,
                        user: {
                            userId: resolvedUser.id,
                            userName: resolvedUser.userName,
                            familyName: resolvedUser.familyName,
                            givenName: resolvedUser.givenName,
                            userImg: resolvedUser.userImg,
                            role: resolvedUser.role
                        }
                    };

                } catch (err) {
                    console.error("Failed to enrich post:", err.message);
                    return { ...post.toObject(), user: null };
                }
            })
        );
        //Cache the final feed for 2 minutes
        await redis.setex(feedCacheKey, 120, JSON.stringify(enrichedPosts));

        res.json(enrichedPosts);
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/parent-hub', async (req, res) => {
    try {
        const parentId = req.headers['x-user-id']
        const userRole = req.headers['x-user-role'];
        if (userRole !== "parent") return res.status(403).json({ error: "Action unauthorized" })

        const cachedKey = `feed:${parentId}`
        const cached = await redis.get(cachedKey)
        if (cached) return res.status(200).json(JSON.parse(cached))

        const posts = await Post.find({ isParentHub: true }).sort({ createdAt: -1 })
        const enrichedPosts = await Promise.all(
            posts.map(async (post) => {
                try {
                    let resolvedUser = await resolveUser(post.userId)

                    const commentsCount = post.comments.reduce((acc, c) => {
                        return acc + 1 + (c.replies ? c.replies.length : 0);
                    }, 0);
                    const enrichedComments = await Promise.all(
                        (post.comments || []).map(async (c) => {
                            let resolvedCommentUser = await resolveUser(c.userId)
                            const enrichedReplies = await Promise.all(
                                (c.replies || []).map(async (r) => {
                                    let resolvedReplyUser = await resolveUser(r.userId)
                                    return {
                                        _id: r._id,
                                        text: r.text,
                                        likes: r.likes,
                                        userName: resolvedReplyUser.userName,
                                        familyName: resolvedReplyUser.familyName,
                                        givenName: resolvedReplyUser.givenName,
                                        userImg: resolvedReplyUser.userImg,
                                        role: resolvedReplyUser.role,
                                    };
                                })
                            );

                            return {
                                _id: c._id,
                                text: c.text,
                                replies: enrichedReplies,
                                likes: c.likes,
                                userName: resolvedCommentUser.userName,
                                familyName: resolvedCommentUser.familyName,
                                givenName: resolvedCommentUser.givenName,
                                userImg: resolvedCommentUser.userImg,
                                role: resolvedCommentUser.role
                            };
                        })
                    );

                    return {
                        _id: post._id,
                        userId: post.userId,
                        content: post.content,
                        mediaUrl: post.mediaUrl,
                        mediaType: post.mediaType,
                        mediaSize: post.mediaSize,
                        visibility: post.visibility,
                        tags: post.tags,
                        mentions: post.mentions,
                        urls: post.urls,
                        likes: post.likes,
                        createdAt: post.createdAt,
                        comments: enrichedComments,
                        likesCount: post.likes.length,
                        commentsCount,
                        user: {
                            userId: resolvedUser.id,
                            userName: resolvedUser.userName,
                            familyName: resolvedUser.familyName,
                            givenName: resolvedUser.givenName,
                            userImg: resolvedUser.userImg,
                            role: resolvedUser.role
                        }
                    };

                } catch (err) {
                    console.error("Failed to enrich post:", err.message);
                    return { ...post.toObject(), user: null };
                }
            })
        );
        await redis.setex(cachedKey, 120, JSON.stringify(enrichedPosts));
        res.json(enrichedPosts);

    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: err.message });
    }
})

// CREATE POST
router.post("/", upload.single('media'), async (req, res) => {

    const userId = req.headers["x-user-id"]
    const userName = req.headers["x-user-name"]
    const userRole = req.headers["x-user-role"]

    try {
        let mediaInfo = null;

        if (req.file) {
            // Determine if it's an image or video
            const isVideo = req.file.mimetype.startsWith('video/');

            mediaInfo = {
                url: `${isVideo ? 'videos' : 'images'}/${req.file.filename}`,
                type: isVideo ? 'video' : 'image',
                mimeType: req.file.mimetype,
                size: req.file.size
            };
        }

        let tags = [], mentions = [], urls = [];
        try { tags = req.body.tags ? JSON.parse(req.body.tags) : [] } catch { }
        try { mentions = req.body.mentions ? JSON.parse(req.body.mentions) : [] } catch { }
        try { urls = req.body.urls ? JSON.parse(req.body.urls) : [] } catch { }

        const newPost = await Post.create({
            userId: req.headers["x-user-id"], // from gateway
            content: req.body.content,
            mediaUrl: mediaInfo?.url || null,
            mediaType: mediaInfo?.type || null,
            mediaSize: mediaInfo?.size || null,
            tags: tags,
            mentions: mentions,
            urls: mentions,
            isParentHub: req.body.isParentHub
        });

        // notify followers
        const myFollowers = await Follow.find({ followeeId: userId }).select("followerId");

        await Promise.all(
            myFollowers.map(async (follower) => {
                await publishNotification('NEW_POST', {
                    idSender: userId,
                    idReceiver: follower.followerId,
                    title: `new post from: ${userName}`,
                    message: `${userName} has recently published a new post`,
                    metadata: newPost,
                })
                await redis.del(`feed:${follower.followerId}`)
            })
        );

        if (userRole === "student") await updateGamification("PUBLISH_POST", Number(userId))

        res.status(201).json(newPost);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});



// GET POST BY ID
router.get("/post-info/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        try {
            const resolvedUser = await resolveUser(post.userId)

            user = {
                userId: resolvedUser.id,
                userName: resolvedUser.userName,
                familyName: resolvedUser.familyName,
                givenName: resolvedUser.givenName,
                userImg: resolvedUser.userImg,
                role: resolvedUser.role
            } || null;
        } catch (err) {
            console.error("Failed to fetch user:", err.message);
        }

        res.json({
            ...post.toObject(),
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET POSTS BY USER
router.get("/user/:userId", async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.params.userId });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE POST
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        post.content = req.body.content ?? post.content;
        post.mediaUrl = req.body.mediaUrl ?? post.mediaUrl;
        post.tags = req.body.tags ?? post.tags;

        await post.save();

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE POST
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (post.userId != req.headers["x-user-id"]) return res.status(403).json({ error: "Not allowed" });

        await post.deleteOne();
        const myFollowers = await Follow.find({ followeeId: req.headers["x-user-id"] }).select("followerId");
        await Promise.all(
            myFollowers.map(f => redis.del(`feed:${f.followerId}`))
        );

        res.json({ message: "Post deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LIKE / UNLIKE POST
router.post("/:id/like", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const userName = req.headers["x-user-name"]
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const alreadyLiked = post.likes.some(like => like.userId == userId);

        if (alreadyLiked) {
            post.likes = post.likes.filter(like => like.userId != userId);
            await decrementLike(String(post._id));
        } else {
            post.likes.push({ userId });
            await incrementLike(String(post._id))
            await publishNotification('NEW_LIKE', {
                idSender: userId,
                idReceiver: post.userId,
                title: `new like from: ${userName}`,
                message: `${userName} liked your post`,
                metadata: post,
            });
        }
        await post.save();

        // Invalidate the post author's feed cache so likes update
        await redis.del(`feed:${post.userId}`);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD COMMENT
router.post("/:id/comment", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        post.comments.push({
            userId: req.headers["x-user-id"],
            text: req.body.text
        });

        await publishNotification('NEW_COMMENT', {
            idSender: req.headers["x-user-id"],
            idReceiver: post.userId,
            title: `new comment from: ${req.headers["x-user-name"]}`,
            message: `${req.headers["x-user-name"]} commented on your post`,
            metadata: post,
        });

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//LIKE TO A COMMENT
router.post('/:postId/comment/:commentId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const postId = req.params.postId
        const commentId = req.params.commentId

        const post = await Post.findById(postId)
        if (!post) return res.status(404).json({ error: "post not found" })
        const comment = post.comments.find(((c) => c._id == commentId))
        if (!comment) return res.status(404).json({ error: "comment not found" })

        const alreadyLiked = comment.likes.some(like => like.userId == userId);

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(like => like.userId != userId);
        } else {
            comment.likes.push({ userId });

            await publishNotification('NEW_LIKE', {
                idSender: userId,
                idReceiver: comment.userId,
                title: `${req.headers["x-user-name"]} liked your comment`,
                message: `${req.headers["x-user-name"]} liked your comment`,
                metadata: post,
            });
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// like to a reply
router.post('/:postId/comment/:commentId/reply/:replyId/like', async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const postId = req.params.postId
        const commentId = req.params.commentId
        const replyId = req.params.replyId

        const post = await Post.findById(postId)
        if (!post) return res.status(404).json({ error: "post not found" })
        const comment = post.comments.find(((c) => c._id == commentId))
        if (!comment) return res.status(404).json({ error: "comment not found" })
        const reply = comment.replies.find((r) => r._id == replyId)
        if (!reply) return res.status(404).json({ reply: "reply not found" })

        console.log("looking for replyId:", replyId, typeof replyId);
        console.log("reply ids in db:", comment.replies.map(r => ({ id: r._id, type: typeof r._id })));

        const alreadyLiked = reply.likes.some(like => like.userId == userId);

        if (alreadyLiked) {
            reply.likes = reply.likes.filter(like => like.userId != userId);
        } else {
            reply.likes.push({ userId });

            await publishNotification('NEW_LIKE', {
                idSender: userId,
                idReceiver: reply.userId,
                title: `${req.headers["x-user-name"]} liked your reply`,
                message: `${req.headers["x-user-name"]} liked your reply`,
                metadata: post,
            });
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// REPLY TO A COMMENT
router.post("/:postId/comment/:commentId/reply", async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        comment.replies.push({
            userId: req.headers["x-user-id"],
            text: req.body.text
        });

        await publishNotification('NEW_REPLY', {
            idSender: req.headers["x-user-id"],
            idReceiver: comment.userId,
            title: `new reply from: ${req.headers["x-user-name"]} on your recent comment`,
            message: `${req.headers["x-user-name"]} replied to you`,
            metadata: post,
        });

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE COMMENT
router.delete("/:postId/comment/:commentId", async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.userId != req.headers["x-user-id"])
            return res.status(403).json({ error: "Not allowed" });

        comment.deleteOne();

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/follow', async (req, res) => {
    try {
        const followerId = req.headers["x-user-id"];
        const followeeId = req.body.followeeId;
        const userRole = req.headers["x-user-role"]

        if (!followeeId) {
            return res.status(400).json({ error: "followeeId is required" });
        }

        const existingFollow = await Follow.findOne({ followerId, followeeId });

        if (existingFollow) {
            // Unfollow
            await existingFollow.deleteOne();
            return res.status(200).json({ followRemoved: "Unfollowed successfully" });
        } else {
            // Follow
            await Follow.create({ followerId, followeeId });

            await publishNotification('NEW_FOLLOW', {
                idSender: followerId,
                idReceiver: followeeId,
                title: `Welcome your new follower: ${req.headers["x-user-name"]}`,
                message: `${req.headers["x-user-name"]} is following you now`,
                metadata: {
                    newFollowerId: followerId,
                    followerUserName: req.headers['x-user-name']
                },
            });

            const followeeInfo = await resolveUser(followeeId);

            //new achievement for the followee if they're a student
            if (followeeInfo.role === "student") await updateGamification("NEW_FOLLOWER", Number(followeeId))

            // new achievement for user
            if (userRole === "student") await updateGamification("NEW_FOLLOWEE", Number(followerId))

            return res.status(201).json({ followAdded: "Following successfully" });
        }

    } catch (error) {
        console.error("Follow error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/get-followers', async (req, res) => {

    try {
        const userId = req.headers["x-user-id"]
        const followers = await Follow.find({ followeeId: userId })

        const followersIds = followers.map((f) => f.followerId)

        const enrichedFollowers = await Promise.all(
            followers.map(async (follower) => {
                try {

                    const resolvedUser = await resolveUser(follower.followerId);

                    return {
                        id: follower.followerId,
                        userName: resolvedUser.userName,
                        familyName: resolvedUser.familyName,
                        givenName: resolvedUser.givenName,
                        userImg: resolvedUser.userImg,
                        role: resolvedUser.role
                    }

                } catch (error) {
                    console.error("Failed to fetch user:", err.message);
                }
            })
        )

        res.status(200).json(
            {
                followers: enrichedFollowers,
                followersIds: followersIds
            })

    } catch (error) {
        res.status(500).json({ error: err.message });
    }

})

router.get('/get-followees', async (req, res) => {

    try {
        const userId = req.headers['x-user-id']
        const followers = await Follow.find({ followerId: userId })
        const followeesIds = followers.map((f) => f.followeeId)

        const enrichedFollowees = await Promise.all(
            followers.map(async (followee) => {
                try {
                    const resolvedUser = await resolveUser(followee.followeeId);
                    return {
                        id: followee.followeeId,
                        userName: resolvedUser.userName,
                        familyName: resolvedUser.familyName,
                        givenName: resolvedUser.givenName,
                        userImg: resolvedUser.userImg,
                        role: resolvedUser.role
                    }
                } catch (error) {
                    console.error("Failed to fetch user:", err.message);
                }
            })
        )

        res.status(200).json({
            followees: enrichedFollowees,
            followeesIds: followeesIds
        })

    } catch (error) {
        res.status(500).json({ error: err.message });
    }

})

router.get("/suggestions", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        // Get all people the user follows
        const myFollowees = await Follow.find({ followerId: userId }).select("followeeId");
        const myFolloweeIds = myFollowees.map(f => f.followeeId.toString());

        // Get all people who follow the user
        const myFollowers = await Follow.find({ followeeId: userId }).select("followerId");
        const myFollowerIds = myFollowers.map(f => f.followerId.toString());

        // 3️⃣ Collect candidate suggestions:
        //   - People followed by my followees
        const followeesFollowees = await Follow.find({
            followerId: { $in: myFolloweeIds }
        }).select("followeeId");

        //   - People who follow my followers
        const followersFollowers = await Follow.find({
            followeeId: { $in: myFollowerIds }
        }).select("followerId");

        // Combine & remove duplicates
        let candidates = [
            ...followeesFollowees.map(f => f.followeeId.toString()),
            ...followersFollowers.map(f => f.followerId.toString())
        ];

        // Remove self & people already followed
        candidates = [...new Set(candidates)].filter(
            id => id !== userId && !myFolloweeIds.includes(id)
        );

        // 4️⃣ Enrich candidates with user info via Auth Service
        const enrichedSuggestions = await Promise.all(
            candidates.map(async candidateId => {
                try {
                    const resolvedUser = await resolveUser(candidateId);
                    return {
                        id: resolvedUser.id,
                        userName: resolvedUser.userName,
                        familyName: resolvedUser.familyName,
                        givenName: resolvedUser.givenName,
                        userImg: resolvedUser.userImg,
                        role: resolvedUser.role
                    };
                } catch (error) {
                    console.error("Failed to fetch user info:", error.message);
                }
            })
        );

        // Filter out any undefined entries
        res.status(200).json(enrichedSuggestions.filter(Boolean));

    } catch (error) {
        console.error("Suggestion error:", error);
        res.status(500).json({ error: error.message });
    }
});

// SAVE / UNSAVE POST
router.post("/:id/save", async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ error: "Post not found" });

        const alreadySaved = await Save.findOne({ userId, postId: post._id });

        if (alreadySaved) {
            await alreadySaved.deleteOne()
            return res.status(200).json({ SaveRemoved: "Unsaved successfully" });
        } else {
            await Save.create({
                userId: userId,
                postId: post._id
            })
            return res.status(200).json({ SaveAdded: "Saved successfully" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/get-savings', async (req, res) => {

    try {
        const userId = req.headers["x-user-id"]
        const savings = await Save.find({ userId })

        const enrichedSavings = await Promise.all(
            savings.map(async (save) => {

                try {

                    const postData = await Post.findById(save.postId)

                    return {
                        ...save.toObject(),
                        post: postData || null
                    }

                } catch (error) {
                    console.error("Failed to fetch post details:", err.message);
                }

            })
        )

        res.status(200).json(enrichedSavings)

    } catch (error) {

        res.status(500).json({ error: err.message });

    }

})

module.exports = router;