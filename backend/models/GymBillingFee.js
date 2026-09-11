const mongoose = require('mongoose');

const gymBillingFeeSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    feeType: {
      type: String,
      enum: ['subscription', 'setup', 'maintenance', 'custom', 'hardware'],
      default: 'subscription',
    },
    billingCycle: { type: String, default: '', trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'overdue', 'waived'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'jazzcash', 'easypaisa', 'cheque', 'online', 'other', null],
      default: null,
    },
    paidOn: { type: Date, default: null },
    transactionReference: { type: String, default: '', trim: true },
    paymentProof: {
      reference: { type: String, default: '' },
      bankName: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      note: { type: String, default: '' },
    },
    paymentInstructions: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

gymBillingFeeSchema.index({ admin: 1, status: 1, dueDate: 1 });
gymBillingFeeSchema.index({ created_at: -1 });

// Helper to generate a unique invoice number: INV-GYM-YYYYMM-XXXX
gymBillingFeeSchema.statics.generateInvoiceNumber = async function () {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `INV-GYM-${yearMonth}-`;

  // Count existing invoices for this month
  const count = await this.countDocuments({
    invoiceNumber: { $regex: `^${prefix}` },
  });

  const seq = String(count + 1).padStart(4, '0');
  const candidate = `${prefix}${seq}`;

  const exists = await this.findOne({ invoiceNumber: candidate });
  if (!exists) return candidate;

  // If collision due to concurrency, append random 2 digits
  const rand = Math.floor(10 + Math.random() * 90);
  return `${prefix}${seq}-${rand}`;
};

module.exports = mongoose.model('GymBillingFee', gymBillingFeeSchema);
