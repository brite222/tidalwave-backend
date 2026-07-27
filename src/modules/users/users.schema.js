const { z } = require('zod');

const updateProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  profile_photo_url: z.string().url().optional(),
  agency: z.string().optional(),
  vehicle_number: z.string().optional(),
  drivers_license: z.string().optional(),
  assigned_area: z.string().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

module.exports = {
  updateProfileSchema,
};
