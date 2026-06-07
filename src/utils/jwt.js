const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.signAccess = (payload) =>
  jwt.sign(payload, env.JWT.ACCESS_SECRET, { expiresIn: env.JWT.ACCESS_EXPIRY });

exports.signRefresh = (payload) =>
  jwt.sign(payload, env.JWT.REFRESH_SECRET, { expiresIn: env.JWT.REFRESH_EXPIRY });

exports.verifyAccess = (token) => jwt.verify(token, env.JWT.ACCESS_SECRET);
exports.verifyRefresh = (token) => jwt.verify(token, env.JWT.REFRESH_SECRET);