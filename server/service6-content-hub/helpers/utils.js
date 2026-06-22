const redis = require('../config_server/redis.config');
const axios = require('axios');
const { discoverAuthService } = require('../config_server/discovery.service');
const { getUser } = require('../config_server/kafka/consumer');

async function resolveUser(userId) {
    const id = String(userId);

    // Check Redis
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

module.exports = {resolveUser}