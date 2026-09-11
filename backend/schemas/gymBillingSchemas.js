const { z } = require('zod');

const createGymFeeSchema = z.object({
  adminId: z.string().min(1, 'Gym selection is required'),
  title: z.string().min(1, 'Fee title is required').max(200).trim(),
  feeType: z.enum(['subscription', 'setup', 'maintenance', 'custom', 'hardware']).default('subscription'),
  billingCycle: z.string().max(100).trim().optional().default(''),
  amount: z.number().min(0, 'Amount must be at least 0'),
  dueDate: z.string().or(z.date()).refine((d) => !isNaN(new Date(d).getTime()), 'Invalid due date'),
  paymentInstructions: z.string().max(1000).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
  status: z.enum(['unpaid', 'paid']).optional().default('unpaid'),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'jazzcash', 'easypaisa', 'cheque', 'online', 'other']).optional(),
  transactionReference: z.string().max(100).optional().default(''),
});

const bulkGenerateGymFeesSchema = z.object({
  billingCycle: z.string().min(1, 'Billing cycle/period is required (e.g. Sep 2026)').max(100).trim(),
  dueDate: z.string().or(z.date()).refine((d) => !isNaN(new Date(d).getTime()), 'Invalid due date'),
  title: z.string().max(200).trim().optional(),
  defaultAmount: z.number().min(0).optional(),
});

const markFeePaidSchema = z.object({
  paymentMethod: z.enum(['bank_transfer', 'cash', 'jazzcash', 'easypaisa', 'cheque', 'online', 'other']),
  paidOn: z.string().or(z.date()).optional(),
  transactionReference: z.string().max(100).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
});

const submitPaymentProofSchema = z.object({
  paymentMethod: z.enum(['bank_transfer', 'cash', 'jazzcash', 'easypaisa', 'cheque', 'online', 'other']),
  reference: z.string().min(1, 'Transaction ID or Reference number is required').max(100).trim(),
  bankName: z.string().max(100).trim().optional().default(''),
  note: z.string().max(500).trim().optional().default(''),
});

const updateGymFeeSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  feeType: z.enum(['subscription', 'setup', 'maintenance', 'custom', 'hardware']).optional(),
  billingCycle: z.string().max(100).trim().optional(),
  amount: z.number().min(0).optional(),
  dueDate: z.string().or(z.date()).refine((d) => !isNaN(new Date(d).getTime()), 'Invalid due date').optional(),
  paymentInstructions: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

module.exports = {
  createGymFeeSchema,
  bulkGenerateGymFeesSchema,
  markFeePaidSchema,
  submitPaymentProofSchema,
  updateGymFeeSchema,
};
