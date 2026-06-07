const db = require('../../config/database');

exports.zoneVolume = async ({ from, to }) => {
  const { rows } = await db.query(
    `SELECT b.zone, DATE_TRUNC('day', rb.picked_up_at) AS day,
            COUNT(*) AS pickups
     FROM route_bins rb JOIN bins b ON b.id=rb.bin_id
     WHERE rb.picked_up_at BETWEEN $1 AND $2
     GROUP BY b.zone, day ORDER BY day DESC`,
    [from, to]
  );
  return rows;
};

exports.recyclingRate = async () => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE waste_type IN ('recyclable','organic'))::float /
      NULLIF(COUNT(*),0) AS recycling_rate
    FROM disposals
    WHERE created_at > now() - interval '30 days'`);
  return rows[0];
};

exports.contractorPerformance = async () => {
  const { rows } = await db.query(`
    SELECT u.id, u.first_name || ' ' || u.last_name AS name,
      COUNT(rb.id) AS assigned,
      COUNT(rb.id) FILTER (WHERE rb.picked_up_at IS NOT NULL) AS completed,
      AVG(EXTRACT(EPOCH FROM (rb.picked_up_at - r.started_at)))/60 AS avg_response_min
    FROM users u
    JOIN routes r ON r.driver_id=u.id
    JOIN route_bins rb ON rb.route_id=r.id
    WHERE u.role IN ('driver','contractor')
    GROUP BY u.id`);
  return rows;
};

exports.costSavings = async () => {
  const { rows } = await db.query(`
    SELECT SUM(distance_km) AS optimized_km,
           SUM(distance_km) * 1.4 AS baseline_km,
           (SUM(distance_km) * 0.4) * 250 AS estimated_savings_ngn
    FROM routes WHERE status='completed'
      AND completed_at > now() - interval '30 days'`);
  return rows[0];
};