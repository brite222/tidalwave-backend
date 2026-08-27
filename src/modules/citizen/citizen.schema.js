const { z } = require('zod');

// Bin codes look like "TW-23456" or "LK-001" — 2–4 letters, a dash, then 3–10 alphanumerics.
const binCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,4}-[A-Z0-9]{3,10}$/, 'Enter a valid Smart Bin ID, e.g. TW-23456');

const verifyBinSchema = z.object({ code: binCode });
const linkBinSchema = z.object({ code: binCode });

module.exports = {
  verifyBinSchema,
  linkBinSchema,
};
