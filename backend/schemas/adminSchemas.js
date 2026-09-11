/**
 * Zod schemas for /api/admin/* routes.
 */
const { z } = require('zod');

/* ----------------------------- Customers ---------------------------------- */

const createCustomerSchema = z.object({
  username: z.string().min(1, 'Username is required').max(40).trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name:     z.string().min(1, 'Name is required').max(80).trim(),
  phone:    z.string().max(30).trim().optional().default(''),
  email:    z.string().email('Invalid email format').trim().optional().or(z.literal('')),
  planId:   z.string().length(24, 'Invalid plan ID').optional().nullable(),
});

const updateCustomerSchema = z.object({
  name:     z.string().min(1).max(80).trim().optional(),
  phone:    z.string().max(30).trim().optional(),
  planId:   z.string().length(24).nullable().optional(),
  isActive: z.boolean().optional(),
});

// Admin resets a customer's password. newPassword is optional — if omitted, a
// random one is generated server-side and returned in the response so the
// admin can relay it to the member in person (no email required).
const resetCustomerPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
});

/* ----------------------------- Trainers ----------------------------------- */

const createTrainerSchema = z.object({
  username:         z.string().min(1, 'Username is required').max(40).trim().toLowerCase(),
  password:         z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  name:             z.string().min(1, 'Name is required').max(80).trim(),
  phone:            z.string().max(30).trim().optional().default(''),
  specialty:        z.string().max(80).trim().optional().default('General Fitness'),
  bio:              z.string().max(500).trim().optional().default(''),
  assignedCustomers: z.array(z.string().length(24)).optional().default([]),
});

const updateTrainerSchema = z.object({
  name:             z.string().min(1).max(80).trim().optional(),
  phone:            z.string().max(30).trim().optional(),
  specialty:        z.string().max(80).trim().optional(),
  bio:              z.string().max(500).trim().optional(),
  assignedCustomers: z.array(z.string().length(24)).optional(),
  isActive:         z.boolean().optional(),
});

/* ----------------------------- Plans -------------------------------------- */

const createPlanSchema = z.object({
  planName:       z.string().min(1, 'Plan name is required').max(80).trim(),
  price:          z.number({ invalid_type_error: 'Price must be a number' }).nonnegative('Price cannot be negative'),
  durationMonths: z.number().int().positive('Duration must be a positive integer'),
});

const updatePlanSchema = z.object({
  planName:       z.string().min(1).max(80).trim().optional(),
  price:          z.number().nonnegative().optional(),
  durationMonths: z.number().int().positive().optional(),
  isActive:       z.boolean().optional(),
});

/* ----------------------------- Fees --------------------------------------- */

const createFeeSchema = z.object({
  customerId:  z.string().length(24, 'Invalid customer ID'),
  amount:      z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  dueDate:     z.string().min(1, 'Due date is required'),
  isRecurring: z.boolean().optional().default(false),
});

const updateFeeSchema = z.object({
  status:  z.enum(['unpaid', 'paid', 'overdue']).optional(),
  amount:  z.number().positive().optional(),
  dueDate: z.string().optional(),
});

/* ----------------------------- Announcements ------------------------------ */

const announcementSchema = z.object({
  message:   z.string().min(1, 'Message is required').max(1000),
  sendEmail: z.boolean().optional().default(false),
});

/* ----------------------------- Branches ----------------------------------- */

const createBranchSchema = z.object({
  name:          z.string().min(1, 'Branch name is required').max(80).trim(),
  address:       z.string().max(200).trim().optional().default(''),
  phone:         z.string().max(30).trim().optional().default(''),
  managerName:   z.string().max(80).trim().optional().default(''),
  operatingHours: z.string().max(100).trim().optional().default('6:00 AM - 10:00 PM'),
  capacity:      z.number().int().positive().optional().default(100),
});

const updateBranchSchema = z.object({
  name:          z.string().min(1).max(80).trim().optional(),
  address:       z.string().max(200).trim().optional(),
  phone:         z.string().max(30).trim().optional(),
  managerName:   z.string().max(80).trim().optional(),
  operatingHours: z.string().max(100).trim().optional(),
  capacity:      z.number().int().positive().optional(),
  isActive:      z.boolean().optional(),
});

/* ----------------------------- Bulk Actions ------------------------------- */

const bulkActionSchema = z.object({
  ids:    z.array(z.string().length(24)).min(1, 'At least one customer ID required'),
  action: z.enum(['activate', 'deactivate', 'send-announcement']),
  message: z.string().max(1000).optional(), // required only for send-announcement
}).refine(
  (data) => data.action !== 'send-announcement' || (data.message && data.message.trim().length > 0),
  { message: 'A message is required for send-announcement action', path: ['message'] }
);

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  resetCustomerPasswordSchema,
  createTrainerSchema,
  updateTrainerSchema,
  createPlanSchema,
  updatePlanSchema,
  createFeeSchema,
  updateFeeSchema,
  announcementSchema,
  createBranchSchema,
  updateBranchSchema,
  bulkActionSchema,
};
