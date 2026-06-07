const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const env = require('../config/env');

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

exports.notificationQueue = new Queue('notifications', { connection });
exports.routeQueue = new Queue('routes', { connection });
exports.connection = connection;