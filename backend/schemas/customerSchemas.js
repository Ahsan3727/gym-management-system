/**
 * Zod schemas for /api/customer/* routes.
 */
const { z } = require('zod');

const updateProfileSchema = z.object({
  phone: z.string().max(30).trim().optional(),
  goals: z.string().max(500).trim().optional(),
  notificationPrefs: z.object({
    email: z.boolean().optional(),
    inApp: z.boolean().optional(),
  }).optional(),
});

const logWorkoutSchema = z.object({
  exercise:        z.string().min(1, 'Exercise name is required').max(100).trim(),
  sets:            z.number().int().positive().optional().nullable(),
  reps:            z.number().int().positive().optional().nullable(),
  weight:          z.number().nonnegative().optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  isRestDay:       z.boolean().optional().default(false),
  notes:           z.string().max(500).trim().optional().default(''),
  date:            z.string().optional(),
});

const logDietSchema = z.object({
  meal:     z.string().min(1, 'Meal description is required').max(200).trim(),
  calories: z.number().int().nonnegative().optional().nullable(),
  proteinG: z.number().nonnegative().optional().nullable(),
  carbsG:   z.number().nonnegative().optional().nullable(),
  fatG:     z.number().nonnegative().optional().nullable(),
  waterMl:  z.number().int().nonnegative().optional().nullable(),
  date:     z.string().optional(),
});

const logWeightSchema = z.object({
  weightKg:  z.number({ invalid_type_error: 'Weight must be a number' }).positive('Weight must be positive'),
  bodyFatPct: z.number().min(0).max(100).optional().nullable(),
  notes:     z.string().max(300).trim().optional().default(''),
  date:      z.string().optional(),
});

const checkinSchema = z.object({
  gymId: z.string().length(24, 'Invalid gym ID'),
  token: z.string().optional(),
});

module.exports = {
  updateProfileSchema,
  logWorkoutSchema,
  logDietSchema,
  logWeightSchema,
  checkinSchema,
};
