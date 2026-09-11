/**
 * tests/memberMonthlyFee.test.js
 * Unit tests for gym member monthly subscription & fee schemas.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  createCustomerSchema,
  createFeeSchema,
  updateFeeSchema,
  bulkMemberBillingSchema,
} = require('../schemas/adminSchemas');

// Pure helper function for member fee status computation
function computeMemberFeeStatus(latestFee, membershipExpiresAt, now = new Date()) {
  if (!latestFee) return 'none';

  if (latestFee.status === 'paid') {
    const expDate = membershipExpiresAt ? new Date(membershipExpiresAt) : new Date(latestFee.dueDate);
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 5) return 'due_soon';
    return 'paid';
  }

  if (latestFee.status === 'overdue') return 'overdue';

  if (latestFee.status === 'unpaid') {
    if (new Date(latestFee.dueDate) < now) return 'overdue';
    return 'unpaid';
  }

  return latestFee.status;
}

describe('Gym Member Monthly Fee & Subscription Logic', () => {
  describe('Zod Schemas', () => {
    it('validates createCustomerSchema with monthlyFee and initialFee', () => {
      const payload = {
        username: 'hamza.ali',
        name: 'Hamza Ali',
        phone: '03001234567',
        monthlyFee: 3500,
        admissionFee: 1500,
        initialFee: {
          collectNow: true,
          amount: 3500,
          admissionFee: 1500,
          discount: 500,
          billingMonth: 'Oct 2026',
          status: 'paid',
          paymentMethod: 'cash',
          notes: 'Paid at front desk',
        },
      };
      const result = createCustomerSchema.safeParse(payload);
      assert.equal(result.success, true);
      assert.equal(result.data.monthlyFee, 3500);
      assert.equal(result.data.initialFee.amount, 3500);
    });

    it('validates createFeeSchema for manual fee creation', () => {
      const payload = {
        customerId: '507f1f77bcf86cd799439011',
        title: 'Monthly Subscription — Oct 2026',
        feeType: 'subscription',
        billingMonth: 'Oct 2026',
        amount: 3000,
        dueDate: '2026-10-10',
        status: 'unpaid',
      };
      const result = createFeeSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('validates bulkMemberBillingSchema', () => {
      const payload = {
        billingMonth: 'Nov 2026',
        dueDate: '2026-11-10',
        defaultAmount: 3000,
      };
      const result = bulkMemberBillingSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('validates updateFeeSchema with paymentMethod and status', () => {
      const payload = {
        status: 'paid',
        paymentMethod: 'jazzcash',
        notes: 'Transferred from JazzCash 03001234567',
      };
      const result = updateFeeSchema.safeParse(payload);
      assert.equal(result.success, true);
    });
  });

  describe('Fee Status Computation Logic', () => {
    const now = new Date('2026-10-10T12:00:00Z');

    it('returns "none" when member has no fee records', () => {
      assert.equal(computeMemberFeeStatus(null, null, now), 'none');
    });

    it('returns "paid" when paid fee has expiration far in future', () => {
      const latestFee = { status: 'paid', dueDate: '2026-10-31' };
      const expiresAt = new Date('2026-10-31T12:00:00Z');
      assert.equal(computeMemberFeeStatus(latestFee, expiresAt, now), 'paid');
    });

    it('returns "due_soon" when paid fee expires within 5 days', () => {
      const latestFee = { status: 'paid', dueDate: '2026-10-13' };
      const expiresAt = new Date('2026-10-13T12:00:00Z');
      assert.equal(computeMemberFeeStatus(latestFee, expiresAt, now), 'due_soon');
    });

    it('returns "overdue" when paid fee expired in the past', () => {
      const latestFee = { status: 'paid', dueDate: '2026-10-05' };
      const expiresAt = new Date('2026-10-05T12:00:00Z');
      assert.equal(computeMemberFeeStatus(latestFee, expiresAt, now), 'overdue');
    });

    it('returns "overdue" when fee status is unpaid and past due date', () => {
      const latestFee = { status: 'unpaid', dueDate: '2026-10-05' };
      assert.equal(computeMemberFeeStatus(latestFee, null, now), 'overdue');
    });

    it('returns "unpaid" when fee status is unpaid but due date is in the future', () => {
      const latestFee = { status: 'unpaid', dueDate: '2026-10-25' };
      assert.equal(computeMemberFeeStatus(latestFee, null, now), 'unpaid');
    });
  });
});
