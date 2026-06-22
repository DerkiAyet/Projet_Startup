const redis = require('../config/redis.config');
const axios = require('axios');
const { discoverAuthService } = require('../config/discovery.service');
const { getUser, getStudentInterests, getTeacherExpertise } = require('../config/kafka/consumer');

async function resolveUser(userId) {
    const id = String(userId);

    const cached = await redis.get(`user:${id}`);
    if (cached) {
        return JSON.parse(cached)
    };

    const kafkaUser = getUser(id);
    if (kafkaUser) {
        await redis.setex(`user:${id}`, 300, JSON.stringify(kafkaUser));
        return kafkaUser;
    }

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
        userImg: data.user.userImg,
        role: data.user.role
    };

    await redis.setex(`user:${id}`, 300, JSON.stringify(user));
    return user;
}

async function resolveUserInterests(userId, role) {
    const id = String(userId);
    const cacheKey = `interests:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

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

    try {
        const authServiceBaseUrl = await discoverAuthService();
        const { data } = await axios.get(
            `${authServiceBaseUrl}/infos/get-user-intrests`,
            { headers: { "x-user-id": id }, timeout: 5000 }
        );
        interests = data;

        // only cache if there's actual data (that's the bug in the case of register for first time)
        if (interests && interests.length > 0) {
            await redis.setex(cacheKey, 300, JSON.stringify(interests));
        }

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

const deleteByPattern = async ( pattern) => {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } while (cursor !== "0");
};

module.exports = { resolveUser, resolveUserInterests, getLikesCount, incrementLike, decrementLike, deleteByPattern };