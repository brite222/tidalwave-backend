const { Worker } = require('bullmq');
const { connection } = require('./index');
const db = require('../config/database');

new Worker('notifications', async (job) => {
  const { user_id, title, body, type, data } = job.data;
  await db.query(
    `INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1,$2,$3,$4,$5)`,
    [user_id, title, body, type, JSON.stringify(data || {})]
  );
  // TODO: FCM push using device_tokens
}, { connection });

console.log('Worker started');