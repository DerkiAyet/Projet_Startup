const redis = require('../config/redis.config');
const axios = require('axios');
const { discoverAuthService } = require('../config/discovery.service');
const { getUser, getStudentInterests, getTeacherExpertise } = require('../config/kafka/consumer');

async function resolveUser(userId) {
    const id = String(userId);

    // Check Redis first
    const cached = await redis.get(`user:${id}`);
    if (cached) {
        console.log("Fetched from Redis")
        return JSON.parse(cached)
    };

    // Check Kafka in-memory cache
    const kafkaUser = getUser(id);
    if (kafkaUser) {
        // Save into Redis so all instances benefit
        await redis.setex(`user:${id}`, 300, JSON.stringify(kafkaUser));
        return kafkaUser;
    }

    // Fallback to HTTP
    const authServiceBaseUrl = await discoverAuthService();
    const { data } = await axios.get(
        `${authServiceBaseUrl}/get_user_byId/${id}`,
        { timeout: 5000 }
    );
    const user = {
        id: data.user.id,
        userName: data.user.userName,
        familyName: data.user.familyName,
        givenName: data.user.givenName,
        userImg: data.user.usrImg,
        role: data.user.role
    };

    // Cache result so next call is instant
    await redis.setex(`user:${id}`, 300, JSON.stringify(user));
    return user;
}

// Resolve interests: Redis → Kafka cache → Auth service HTTP
async function resolveUserInterests(userId, role) {
    const id = String(userId);
    const cacheKey = `interests:${id}`;

    // Check Redis
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    //Check Kafka cache
    let interests;
    if (role === 'teacher') {
        interests = getTeacherExpertise(id);
    } else if (role === 'student') {
        interests = getStudentInterests(id);
    } else {
        // role unknown — try both
        interests = getStudentInterests(id) || getTeacherExpertise(id);
    }

    if (interests && interests.length > 0) {
        await redis.setex(cacheKey, 300, JSON.stringify(interests));
        return interests;
    }

    // Fallback to HTTP
    try {
        const authServiceBaseUrl = await discoverAuthService();
        const { data } = await axios.get(
            `${authServiceBaseUrl}/infos/get-user-intrests`,
            { headers: { "x-user-id": id }, timeout: 5000 }
        );
        interests = data;
        await redis.setex(cacheKey, 300, JSON.stringify(interests));
        return interests;
    } catch {
        return [];
    }
}

async function getLikesCount(postId) {
    const cached = await redis.get(`likes:${postId}`);
    if (cached) return parseInt(cached);
    return null; // means use DB value
}

async function incrementLike(postId) {
    await redis.incr(`likes:${postId}`);
    await redis.expire(`likes:${postId}`, 3600); // 1 hour
}

async function decrementLike(postId) {
    await redis.decr(`likes:${postId}`);
    await redis.expire(`likes:${postId}`, 3600);
}

module.exports = { resolveUser, resolveUserInterests, getLikesCount, incrementLike, decrementLike };