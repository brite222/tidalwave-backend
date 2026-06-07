const { z } = require('zod');

exports.createBinSchema = z.object({
  code: z.string().min(1),
  zone: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  assigned_contractor_id: z.string().uuid().optional(),
});

exports.telemetrySchema = z.object({
  bin_code: z.string(),
  fill_level: z.number().min(0).max(100),
  battery: z.number().optional(),
  temperature: z.number().optional(),
});