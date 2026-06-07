const db = require('../../config/database');

exports.nearestBin = async ({ lat, lng, radius_m = 2000 }) => {
  const { rows } = await db.query(
    `SELECT id, code, zone, fill_level, status, address,
            ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
            ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS distance_m
     FROM bins
     WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
     ORDER BY distance_m ASC LIMIT 10`,
    [lng, lat, radius_m]
  );
  return rows;
};

exports.reportIllegalDumping = async ({ user_id, lat, lng, description, photo_url, address, severity }) => {
  const { rows } = await db.query(
    `INSERT INTO issues (reporter_id, type, severity, description, photo_url, address, location)
     VALUES ($1,'illegal_dumping',$2,$3,$4,$5, ST_SetSRID(ST_MakePoint($6,$7),4326)::geography)
     RETURNING *`,
    [user_id, severity || 'high', description, photo_url, address, lng, lat]
  );
  await creditPoints(user_id, 25, 'illegal_dumping_report', rows[0].id);
  return rows[0];
};

exports.logDisposal = async ({ user_id, bin_id, waste_type, photo_url, notes }) => {
  const pointsMap = { recyclable: 50, organic: 50, general: 30, ewaste: 100 };
  const points = pointsMap[waste_type] || 20 + (photo_url ? 10 : 0);
  const { rows } = await db.query(
    `INSERT INTO disposals (citizen_id, bin_id, waste_type, photo_url, notes, points_earned)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [user_id, bin_id, waste_type, photo_url, notes, points]
  );
  await creditPoints(user_id, points, 'disposal', rows[0].id);
  return rows[0];
};

const creditPoints = (user_id, points, reason, reference_id) =>
  db.query(
    `INSERT INTO citizen_credits (user_id, points, reason, reference_id) VALUES ($1,$2,$3,$4)`,
    [user_id, points, reason, reference_id]
  );

exports.getBalance = async (user_id) => {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(points),0)::int AS balance FROM citizen_credits WHERE user_id=$1`,
    [user_id]
  );
  return { balance: rows[0].balance };
};

exports.history = async (user_id) => {
  const { rows } = await db.query(
    `SELECT * FROM citizen_credits WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [user_id]
  );
  return rows;
};

exports.claimReward = async ({ user_id, reward_id }) => {
  const client = await require('../../config/database').getClient();
  try {
    await client.query('BEGIN');
    const { rows: r } = await client.query(
      `SELECT * FROM rewards_catalog WHERE id=$1 AND is_active=true`, [reward_id]);
    if (!r.length) throw new Error('Reward not found');
    const { rows: b } = await client.query(
      `SELECT COALESCE(SUM(points),0)::int AS bal FROM citizen_credits WHERE user_id=$1`, [user_id]);
    if (b[0].bal < r[0].points_required) throw new Error('Insufficient points');

    await client.query(
      `INSERT INTO citizen_credits (user_id, points, reason, reference_id) VALUES ($1,$2,'reward_claim',$3)`,
      [user_id, -r[0].points_required, reward_id]);
    const { rows: claim } = await client.query(
      `INSERT INTO reward_claims (user_id, reward_id, points_spent) VALUES ($1,$2,$3) RETURNING *`,
      [user_id, reward_id, r[0].points_required]);
    await client.query('COMMIT');
    return claim[0];
  } catch (e) {
    await client.query('ROLLBACK'); throw e;
  } finally { client.release(); }
};