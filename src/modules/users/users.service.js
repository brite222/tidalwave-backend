const db = require('../../config/database');
const ApiError = require('../../utils/apiError');

exports.getById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, email, role, first_name, last_name, phone, address,
            profile_photo_url, agency, vehicle_number, drivers_license,
            assigned_area, email_verified, is_active, created_at
     FROM users WHERE id=$1`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'User not found');
  return rows[0];
};
