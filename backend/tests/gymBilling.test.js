/**
 * tests/gymBilling.test.js
 * Unit tests for gym platform fee management and validation schemas.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createGymFeeSchema,
  bulkGenerateGymFeesSchema,
  markFeePaidSchema,
  submitPaymentProofSchema,
  updateGymFeeSchema,
} = require('../schemas/gymBillingSchemas');

// Pure helper function for grace period restriction logic
function isSeverelyOverdue(dueDate, gracePeriodDays = 14, now = new Date()) {
  const due = new Date(dueDate);
  if (due >= now) return false;
  const graceLimit = new Date(due);
  graceLimit.setDate(graceLimit.getDate() + gracePeriodDays);
  return now > graceLimit;
}

// Pure helper for bank instructions formatting
function formatBankInstructions(settings) {
  const parts = [];
  if (settings.bankName) parts.push(`Bank: ${settings.bankName}`);
  if (settings.accountTitle) parts.push(`Account Title: ${settings.accountTitle}`);
  if (settings.accountNumber) parts.push(`Account No: ${settings.accountNumber}`);
  if (settings.iban) parts.push(`IBAN: ${settings.iban}`);
  if (settings.jazzcashNumber) parts.push(`JazzCash: ${settings.jazzcashNumber}`);
  if (settings.easypaisaNumber) parts.push(`EasyPaisa: ${settings.easypaisaNumber}`);
  return parts.join('\n');
}

// Pure helper for platform fee totals
function computePlatformFeeTotals(fees) {
  return fees.reduce(
    (acc, f) => {
      if (f.status === 'paid') acc.totalPaid += f.amount;
      if (f.status === 'unpaid' || f.status === 'overdue') acc.totalOutstanding += f.amount;
      if (f.status === 'overdue') acc.overdueCount++;
      return acc;
    },
    { totalPaid: 0, totalOutstanding: 0, overdueCount: 0 }
  );
}

describe('Gym Platform Billing Logic & Schemas', () => {
  describe('Zod Schema Validation', () => {
    it('validates createGymFeeSchema successfully', () => {
      const validPayload = {
        adminId: '507f1f77bcf86cd799439011',
        title: 'Monthly Platform Subscription — Sep 2026',
        feeType: 'subscription',
        billingCycle: 'Sep 2026',
        amount: 5000,
        dueDate: '2026-09-30',
        paymentInstructions: 'Transfer to Meezan Bank',
      };
      const result = createGymFeeSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('rejects createGymFeeSchema when required fields are missing or invalid', () => {
      const invalidPayload = {
        adminId: '',
        title: '',
        amount: -50,
        dueDate: 'not-a-date',
      };
      const result = createGymFeeSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
    });

    it('validates bulkGenerateGymFeesSchema', () => {
      const validPayload = {
        billingCycle: 'Oct 2026',
        dueDate: '2026-10-15',
        defaultAmount: 6000,
      };
      const result = bulkGenerateGymFeesSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('validates markFeePaidSchema', () => {
      const validPayload = {
        paymentMethod: 'bank_transfer',
        transactionReference: 'TRX-987654321',
        notes: 'Verified in bank account statement',
      };
      const result = markFeePaidSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('validates submitPaymentProofSchema', () => {
      const validPayload = {
        paymentMethod: 'jazzcash',
        reference: 'JC-88771122',
        bankName: 'Mobilink Microfinance',
        note: 'Sent from 03001234567',
      };
      const result = submitPaymentProofSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it('rejects submitPaymentProofSchema when reference is empty', () => {
      const invalidPayload = {
        paymentMethod: 'cash',
        reference: '',
      };
      const result = submitPaymentProofSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
    });

    it('validates updateGymFeeSchema with partial edits', () => {
      const partialPayload = {
        amount: 7500,
        notes: 'Adjusted rate for custom module',
      };
      const result = updateGymFeeSchema.safeParse(partialPayload);
      assert.equal(result.success, true);
    });
  });

  describe('Severe Overdue Grace Period Logic', () => {
    const now = new Date('2026-09-20T12:00:00Z');

    it('future due date is not overdue and not severely overdue', () => {
      const futureDue = new Date('2026-09-25T12:00:00Z');
      assert.equal(isSeverelyOverdue(futureDue, 14, now), false);
    });

    it('due date 5 days ago is overdue but WITHIN grace period (14 days)', () => {
      const pastDue = new Date('2026-09-15T12:00:00Z');
      assert.equal(isSeverelyOverdue(pastDue, 14, now), false);
    });

    it('due date 20 days ago EXCEEDS grace period (14 days) -> severely overdue', () => {
      const longPastDue = new Date('2026-08-31T12:00:00Z');
      assert.equal(isSeverelyOverdue(longPastDue, 14, now), true);
    });
  });

  describe('Bank Instructions & Fee Totals Logic', () => {
    it('formats bank instructions correctly from settings', () => {
      const settings = {
        bankName: 'Meezan Bank',
        accountTitle: 'Ironline Tech',
        accountNumber: '0102030405',
        iban: 'PK36MEZN000102030405',
        jazzcashNumber: '03001234567',
      };
      const instructions = formatBankInstructions(settings);
      assert.match(instructions, /Bank: Meezan Bank/);
      assert.match(instructions, /Account Title: Ironline Tech/);
      assert.match(instructions, /IBAN: PK36MEZN000102030405/);
      assert.match(instructions, /JazzCash: 03001234567/);
    });

    it('correctly aggregates platform fees into paid, outstanding, and overdue', () => {
      const fees = [
        { status: 'paid', amount: 5000 },
        { status: 'paid', amount: 7000 },
        { status: 'unpaid', amount: 5000 },
        { status: 'overdue', amount: 5000 },
        { status: 'waived', amount: 2000 },
      ];
      const totals = computePlatformFeeTotals(fees);
      assert.equal(totals.totalPaid, 12000);
      assert.equal(totals.totalOutstanding, 10000); // 5000 unpaid + 5000 overdue
      assert.equal(totals.overdueCount, 1);
    });
  });
});
