const db = require('../../config/database');
const ApiError = require('../../utils/apiError');

// Generate optimized route — prioritize critical/warning bins
exports.generateRoute = async ({ driver_id, zone, max_bins = 15 }) => {
  const { rows: bins } = await db.query(
    `SELECT id, code, fill_level, status,
            ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
     FROM bins
     WHERE zone=$1 AND status IN ('warning','critical','overflow')
     ORDER BY 
       CASE status WHEN 'overflow' THEN 1 WHEN 'critical' THEN 2 WHEN 'warning' THEN 3 END,
       fill_level DESC
     LIMIT $2`,
    [zone, max_bins]
  );
  if (!bins.length) throw new ApiError(400, 'No bins eligible for pickup');

  // Nearest-neighbour ordering from first bin
  const ordered = nearestNeighbour(bins);

  const { rows: r } = await db.query(
    `INSERT INTO routes (driver_id, name, scheduled_date)
     VALUES ($1, $2, CURRENT_DATE) RETURNING *`,
    [driver_id, `${zone} Route`]
  );
  const route = r[0];

  const values = ordered.map((b, i) => `('${route.id}','${b.id}',${i + 1})`).join(',');
  await db.query(`INSERT INTO route_bins (route_id, bin_id, sequence) VALUES ${values}`);

  return { ...route, bins: ordered };
};

const haversine = (a, b) => {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const nearestNeighbour = (bins) => {
  if (bins.length <= 1) return bins;
  const out = [bins[0]];
  const remaining = bins.slice(1);
  while (remaining.length) {
    const last = out[out.length - 1];
    let best = 0, bestD = Infinity;
    remaining.forEach((b, i) => {
      const d = haversine(last, b);
      if (d < bestD) { bestD = d; best = i; }
    });
    out.push(remaining.splice(best, 1)[0]);
  }
  return out;
};

exports.getDriverRoutes = async (driver_id) => {
  const { rows } = await db.query(
    `SELECT r.*, 
       (SELECT json_agg(json_build_object(
          'bin_id', rb.bin_id, 'sequence', rb.sequence,
          'picked_up_at', rb.picked_up_at, 'code', b.code,
          'fill_level', b.fill_level, 'status', b.status,
          'lat', ST_Y(b.location::geometry), 'lng', ST_X(b.location::geometry)
        ) ORDER BY rb.sequence)
        FROM route_bins rb JOIN bins b ON b.id=rb.bin_id
        WHERE rb.route_id=r.id) AS bins
     FROM routes r
     WHERE r.driver_id=$1 ORDER BY r.scheduled_date DESC LIMIT 50`,
    [driver_id]
  );
  return rows;
};

exports.startRoute = async (route_id, driver_id) => {
  const { rows } = await db.query(
    `UPDATE routes SET status='active', started_at=now()
     WHERE id=$1 AND driver_id=$2 AND status='pending' RETURNING *`,
    [route_id, driver_id]
  );
  if (!rows.length) throw new ApiError(400, 'Cannot start route');
  return rows[0];
};

exports.confirmPickup = async ({ route_id, bin_id, driver_id, notes }) => {
  const check = await db.query(
    `SELECT 1 FROM routes WHERE id=$1 AND driver_id=$2`, [route_id, driver_id]);
  if (!check.rowCount) throw new ApiError(403, 'Not your route');

  await db.query(
    `UPDATE route_bins SET picked_up_at=now(), notes=$1
     WHERE route_id=$2 AND bin_id=$3`,
    [notes, route_id, bin_id]
  );
  // Reset bin
  await db.query(
    `UPDATE bins SET fill_level=0, status='normal', last_updated=now() WHERE id=$1`,
    [bin_id]
  );

  // Auto-complete route if all bins done
  const { rows } = await db.query(
    `SELECT COUNT(*) FILTER (WHERE picked_up_at IS NULL)::int AS remaining
     FROM route_bins WHERE route_id=$1`, [route_id]);
  if (rows[0].remaining === 0) {
    await db.query(
      `UPDATE routes SET status='completed', completed_at=now() WHERE id=$1`,
      [route_id]);
  }
  return { remaining: rows[0].remaining };
};