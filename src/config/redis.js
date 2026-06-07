const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
redis.on('error', (e) => console.error('Redis error', e));

module.exports = redis;