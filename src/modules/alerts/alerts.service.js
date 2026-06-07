const db = require('../../config/database');

exports.list = async ({ resolved, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = resolved !== undefined ? `WHERE resolved=${resolved === 'true'}` : '';
  const { rows } = await db.query(
    `SELECT a.*, b.code AS bin_code FROM alerts a
     LEFT JOIN bins b ON b.id=a.bin_id
     ${where} ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

exports.resolve = async (id) => {
  const { rows } = await db.query(
    `UPDATE alerts SET resolved=true WHERE id=$1 RETURNING *`, [id]);
  return rows[0];
};