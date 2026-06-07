const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'contractor', 'driver', 'citizen']),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  agency: z.string().optional(),
  vehicle_number: z.string().optional(),
  drivers_license: z.string().optional(),
  assigned_area: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotSchema,
  resetSchema,
};