/**
 * Zod schemas for /api/superadmin/* routes.
 */
const { z } = require('zod');

const createAdminSchema = z.object({
  username:     z.string().min(1, 'Username is required').max(40).trim(),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  gymName:      z.string().min(1, 'Gym name is required').max(100).trim(),
  address:      z.string().max(200).trim().optional().default(''),
  contact:      z.string().max(100).trim().optional().default(''),
  workingHours: z.string().max(100).trim().optional().default(''),
});

const updateAdminSchema = z.object({
  gymName:      z.string().min(1).max(100).trim().optional(),
  address:      z.string().max(200).trim().optional(),
  contact:      z.string().max(100).trim().optional(),
  workingHours: z.string().max(100).trim().optional(),
  themeColor:   z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
});

const updateSettingsSchema = z.object({
  currency:               z.string().max(10).optional(),
  termsUrl:               z.string().url('Invalid URL').optional().or(z.literal('')),
  platformBillingEnabled: z.boolean().optional(),
  platformBillingNote:    z.string().max(500).optional(),
});

const suspendAdminSchema = z.object({
  suspend: z.boolean(),
});

const disableAdminSchema = z.object({
  enable: z.boolean(),
});

module.exports = {
  createAdminSchema,
  updateAdminSchema,
  updateSettingsSchema,
  suspendAdminSchema,
  disableAdminSchema,
};
