/**
 * Zod schemas for /api/auth/* routes.
 * These are intentionally strict — only the fields each route legitimately
 * needs are accepted; unknown keys are stripped by .strict() or omitted by
 * the default "strip" mode.
 */
const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  gymSlug:  z.string().trim().toLowerCase().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
});

module.exports = { loginSchema, changePasswordSchema };
