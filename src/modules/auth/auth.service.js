const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function register(payload) {
  const exists = await db.query('SELECT id FROM users WHERE email=$1', [payload.email]);
  if (exists.rowCount) throw new ApiError(409, 'Email already registered');

  const hash = await bcrypt.hash(payload.password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, address, agency, vehicle_number, drivers_license, assigned_area)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id, email, role, first_name, last_name, created_at`,
    [payload.email, hash, payload.role, payload.first_name, payload.last_name,
     payload.phone, payload.address, payload.agency, payload.vehicle_number,
     payload.drivers_license, payload.assigned_area]
  );
  return rows[0];
}

async function login({ email, password }) {
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) throw new ApiError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  return issueTokens(user);
}

async function issueTokens(user) {
  const payload = { id: user.id, role: user.role, email: user.email };
  const access_token = signAccess(payload);
  const refresh_token = signRefresh({ id: user.id });

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [user.id, hashToken(refresh_token)]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    access_token,
    refresh_token,
  };
}

async function refresh(refresh_token) {
  let decoded;
  try { decoded = verifyRefresh(refresh_token); }
  catch { throw new ApiError(401, 'Invalid refresh token'); }

  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND revoked=false AND expires_at>now()`,
    [decoded.id, hashToken(refresh_token)]
  );
  if (!rows.length) throw new ApiError(401, 'Refresh token revoked');

  await db.query('UPDATE refresh_tokens SET revoked=true WHERE id=$1', [rows[0].id]);
  const { rows: u } = await db.query('SELECT * FROM users WHERE id=$1', [decoded.id]);
  return issueTokens(u[0]);
}

async function logout(user_id) {
  await db.query('UPDATE refresh_tokens SET revoked=true WHERE user_id=$1', [user_id]);
}

async function forgotPassword(email) {
  const { rows } = await db.query('SELECT id FROM users WHERE email=$1', [email]);
  if (!rows.length) return;
  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1,$2, now() + interval '1 hour')`,
    [rows[0].id, hashToken(token)]
  );
  return token;
}

async function resetPassword({ token, password }) {
  const { rows } = await db.query(
    `SELECT * FROM password_resets WHERE token_hash=$1 AND used=false AND expires_at>now()`,
    [hashToken(token)]
  );
  if (!rows.length) throw new ApiError(400, 'Invalid or expired token');
  const hash = await bcrypt.hash(password, 10);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, rows[0].user_id]);
  await db.query('UPDATE password_resets SET used=true WHERE id=$1', [rows[0].id]);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};