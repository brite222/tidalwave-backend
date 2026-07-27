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

const UPDATABLE_FIELDS = [
  'first_name', 'last_name', 'phone', 'address', 'profile_photo_url',
  'agency', 'vehicle_number', 'drivers_license', 'assigned_area',
];

exports.updateProfile = async (id, data) => {
  const fields = Object.keys(data).filter((f) => UPDATABLE_FIELDS.includes(f));
  if (!fields.length) throw new ApiError(400, 'No valid fields to update');

  const set = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');
  const params = fields.map((f) => data[f]);
  params.push(id);

  const { rows } = await db.query(
    `UPDATE users SET ${set}, updated_at=now() WHERE id=$${params.length}
     RETURNING id, email, role, first_name, last_name, phone, address,
               profile_photo_url, agency, vehicle_number, drivers_license,
               assigned_area, email_verified, is_active, created_at`,
    params
  );
  if (!rows.length) throw new ApiError(404, 'User not found');
  return rows[0];
};
