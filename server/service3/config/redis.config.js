const Redis = require('ioredis');
require('dotenv').config({ path: './config.env' });


const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT  || 6379,
  password: process.env.REDIS_PASSWORD,
});

module.exports = redis