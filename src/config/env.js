require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  S3: {
    ENDPOINT: process.env.S3_ENDPOINT,
    REGION: process.env.S3_REGION,
    BUCKET: process.env.S3_BUCKET,
    ACCESS_KEY: process.env.S3_ACCESS_KEY,
    SECRET_KEY: process.env.S3_SECRET_KEY,
  },
  THRESHOLDS: {
    WARNING: parseInt(process.env.BIN_WARNING_THRESHOLD || '61', 10),
    CRITICAL: parseInt(process.env.BIN_CRITICAL_THRESHOLD || '86', 10),
  },
};