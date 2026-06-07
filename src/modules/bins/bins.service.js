const db = require('../../config/database');
const redis = require('../../config/redis');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');

const computeStatus = (fill) => {
  if (fill >= 100) return 'overflow';
  if (fill >= env.THRESHOLDS.CRITICAL) return 'critical';
  if (fill >= env.THRESHOLDS.WARNING) return 'warning';
  return 'normal';
};

exports.createBin = async (b) => {
  const { rows } = await db.query(
    `INSERT INTO bins (code, zone, location, address, assigned_contractor_id)
     VALUES ($1,$2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5, $6)
     RETURNING id, code, zone, fill_level, status`,
    [b.code, b.zone, b.lng, b.lat, b.address, b.assigned_contractor_id]
  );
  return rows[0];
};

exports.listBins = async ({ zone, status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  if (zone)   { params.push(zone);   where.push(`zone=$${params.length}`); }
  if (status) { params.push(status); where.push(`status=$${params.length}`); }
  const wsql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  params.push(limit, offset);
  const { rows } = await db.query(
    `SELECT id, code, zone, fill_level, status, address,
            ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
            assigned_contractor_id, last_updated
     FROM bins ${wsql}
     ORDER BY last_updated DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const { rows: c } = await db.query(`SELECT COUNT(*)::int AS total FROM bins ${wsql}`, params.slice(0, where.length));
  return { items: rows, total: c[0].total };
};

exports.getBin = async (id) => {
  const { rows } = await db.query(
    `SELECT id, code, zone, fill_level, status, address,
            ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng,
            assigned_contractor_id, last_updated FROM bins WHERE id=$1`, [id]
  );
  if (!rows.length) throw new ApiError(404, 'Bin not found');
  return rows[0];
};

exports.ingestTelemetry = async (payload, io) => {
  const { rows } = await db.query('SELECT id, status FROM bins WHERE code=$1', [payload.bin_code]);
  if (!rows.length) throw new ApiError(404, 'Bin not registered');
  const bin = rows[0];

  const newStatus = computeStatus(payload.fill_level);

  await db.query(
    `INSERT INTO bin_telemetry (bin_id, fill_level, battery, temperature)
     VALUES ($1,$2,$3,$4)`,
    [bin.id, payload.fill_level, payload.battery, payload.temperature]
  );

  await db.query(
    `UPDATE bins SET fill_level=$1, status=$2, last_updated=now() WHERE id=$3`,
    [payload.fill_level, newStatus, bin.id]
  );

  // cache real-time
  await redis.set(`bin:${bin.id}:state`,
    JSON.stringify({ fill_level: payload.fill_level, status: newStatus, ts: Date.now() }),
    'EX', 3600);

  // Emit websocket
  if (io) {
    io.to('dashboard').emit('bin:update', {
      bin_id: bin.id, code: payload.bin_code,
      fill_level: payload.fill_level, status: newStatus,
    });
  }

  // Alert if status escalated
  if (newStatus !== bin.status && ['warning', 'critical', 'overflow'].includes(newStatus)) {
    await db.query(
      `INSERT INTO alerts (bin_id, type, severity, message)
       VALUES ($1, 'fill_threshold', $2, $3)`,
      [bin.id, newStatus, `Bin ${payload.bin_code} reached ${newStatus} (${payload.fill_level}%)`]
    );
    // TODO: enqueue notification job
  }

  return { bin_id: bin.id, fill_level: payload.fill_level, status: newStatus };
};