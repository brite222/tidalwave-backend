const db = require('../../config/database');
const ApiError = require('../../utils/apiError');

// One-time reward for connecting a first smart bin to the account.
const BIN_LINK_BONUS_POINTS = 100;

const binSummary = (b) => ({
  id: b.id,
  code: b.code,
  zone: b.zone,
  address: b.address,
  status: b.status,
  next_pickup_at: b.next_pickup_at || null,
});

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

// ─── Smart bin linking (post-registration onboarding) ──────────────────────────

// Step 1: "Locating bin registry" — check the entered code before committing.
exports.verifyBin = async ({ user_id, code }) => {
  const { rows } = await db.query(
    `SELECT id, code, zone, address, status, next_pickup_at FROM bins WHERE code=$1`,
    [code]
  );
  if (!rows.length) {
    throw new ApiError(404, "We couldn't find a smart bin with that ID. Check the QR label and try again.");
  }
  const bin = rows[0];

  const { rows: mine } = await db.query(
    `SELECT 1 FROM bin_links WHERE bin_id=$1 AND user_id=$2`,
    [bin.id, user_id]
  );
  const { rows: others } = await db.query(
    `SELECT COUNT(*)::int AS c FROM bin_links WHERE bin_id=$1`,
    [bin.id]
  );

  return {
    bin: binSummary(bin),
    already_linked: mine.length > 0,
    household_size: others[0].c,
  };
};

// Step 2 & 3: "Authenticating device" + "Assigning to your account".
exports.linkBin = async ({ user_id, code }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows: b } = await client.query(
      `SELECT id, code, zone, address, status, next_pickup_at FROM bins WHERE code=$1 FOR UPDATE`,
      [code]
    );
    if (!b.length) {
      throw new ApiError(404, "We couldn't find a smart bin with that ID. Check the QR label and try again.");
    }
    const bin = b[0];

    const { rows: dupe } = await client.query(
      `SELECT id FROM bin_links WHERE bin_id=$1 AND user_id=$2`,
      [bin.id, user_id]
    );
    if (dupe.length) throw new ApiError(409, 'This smart bin is already linked to your account.');

    const { rows: link } = await client.query(
      `INSERT INTO bin_links (bin_id, user_id) VALUES ($1,$2)
       RETURNING id, status, linked_at`,
      [bin.id, user_id]
    );

    // First-ever bin link earns a one-time welcome bonus.
    const { rows: prior } = await client.query(
      `SELECT 1 FROM citizen_credits WHERE user_id=$1 AND reason='bin_link' LIMIT 1`,
      [user_id]
    );
    let points_earned = 0;
    if (!prior.length) {
      points_earned = BIN_LINK_BONUS_POINTS;
      await client.query(
        `INSERT INTO citizen_credits (user_id, points, reason, reference_id) VALUES ($1,$2,'bin_link',$3)`,
        [user_id, points_earned, link[0].id]
      );
    }

    const { rows: u } = await client.query(
      `SELECT first_name, last_name FROM users WHERE id=$1`,
      [user_id]
    );
    const linked_to = [u[0]?.first_name, u[0]?.last_name].filter(Boolean).join(' ') || 'You';

    await client.query(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES ($1,$2,$3,'bin_link',$4)`,
      [
        user_id,
        'Smart Bin linked 🚀',
        `${bin.code} is now connected to your account. Track pickups and earn points.`,
        JSON.stringify({ bin_id: bin.id, code: bin.code }),
      ]
    );

    await client.query('COMMIT');

    return {
      link_id: link[0].id,
      status: link[0].status,
      linked_at: link[0].linked_at,
      linked_to,
      points_earned,
      bin: binSummary(bin),
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.listMyBins = async (user_id) => {
  const { rows } = await db.query(
    `SELECT bl.id AS link_id, bl.status, bl.linked_at,
            b.id, b.code, b.zone, b.address, b.status AS bin_status, b.next_pickup_at
     FROM bin_links bl
     JOIN bins b ON b.id = bl.bin_id
     WHERE bl.user_id=$1
     ORDER BY bl.linked_at DESC`,
    [user_id]
  );
  return rows.map((r) => ({
    link_id: r.link_id,
    status: r.status,
    linked_at: r.linked_at,
    bin: {
      id: r.id,
      code: r.code,
      zone: r.zone,
      address: r.address,
      status: r.bin_status,
      next_pickup_at: r.next_pickup_at || null,
    },
  }));
};

exports.unlinkBin = async ({ user_id, link_id }) => {
  const { rowCount } = await db.query(
    `DELETE FROM bin_links WHERE id=$1 AND user_id=$2`,
    [link_id, user_id]
  );
  if (!rowCount) throw new ApiError(404, 'Bin link not found');
};