const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { loginSchema, changePasswordSchema } = require('../schemas/authSchemas');
const {
  createCustomerSchema,
  updateCustomerSchema,
  resetCustomerPasswordSchema,
  createTrainerSchema,
  createFeeSchema,
  bulkActionSchema,
} = require('../schemas/adminSchemas');

describe('Zod Validation Schemas', () => {
  describe('Auth Schemas', () => {
    it('validates a correct login request', () => {
      const valid = { username: 'john_doe', password: 'password123' };
      const parsed = loginSchema.parse(valid);
      assert.equal(parsed.username, 'john_doe');
    });

    it('rejects login with empty username or password', () => {
      assert.throws(() => loginSchema.parse({ username: '', password: '' }));
    });

    it('validates password change with minimum length', () => {
      const valid = { currentPassword: 'oldPassword123', newPassword: 'newPassword123' };
      const parsed = changePasswordSchema.parse(valid);
      assert.equal(parsed.newPassword, 'newPassword123');
    });

    it('rejects short new password', () => {
      assert.throws(() =>
        changePasswordSchema.parse({ currentPassword: 'oldPassword123', newPassword: 'short' })
      );
    });
  });

  describe('Admin Customer Schemas', () => {
    it('allows optional/omitted password when creating customer', () => {
      const withoutPassword = { username: 'alex_m', name: 'Alex Morgan' };
      const parsed = createCustomerSchema.parse(withoutPassword);
      assert.equal(parsed.name, 'Alex Morgan');
      assert.equal(parsed.username, 'alex_m');
    });

    it('accepts valid 8+ character password if provided', () => {
      const withPassword = { username: 'alex_m', name: 'Alex Morgan', password: 'securePass123' };
      const parsed = createCustomerSchema.parse(withPassword);
      assert.equal(parsed.password, 'securePass123');
    });

    it('rejects customer without name or username', () => {
      assert.throws(() => createCustomerSchema.parse({ name: '' }));
    });

    it('allows blank/omitted password in resetCustomerPasswordSchema', () => {
      const empty = {};
      const parsed = resetCustomerPasswordSchema.parse(empty);
      assert.equal(parsed.newPassword, undefined);
    });
  });

  describe('Admin Trainer Schemas', () => {
    it('allows optional password when creating trainer', () => {
      const trainer = { username: 'coach.mike', name: 'Mike Vance' };
      const parsed = createTrainerSchema.parse(trainer);
      assert.equal(parsed.specialty, 'General Fitness');
    });
  });

  describe('Fee Schemas', () => {
    it('validates positive amount and required due date', () => {
      const fee = {
        customerId: '507f1f77bcf86cd799439011',
        amount: 99.99,
        dueDate: '2026-10-01',
      };
      const parsed = createFeeSchema.parse(fee);
      assert.equal(parsed.amount, 99.99);
    });

    it('rejects non-positive fee amount', () => {
      assert.throws(() =>
        createFeeSchema.parse({
          customerId: '507f1f77bcf86cd799439011',
          amount: -50,
          dueDate: '2026-10-01',
        })
      );
    });
  });

  describe('Bulk Action Schema', () => {
    it('accepts valid customer array and action', () => {
      const bulk = {
        ids: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        action: 'activate',
      };
      const parsed = bulkActionSchema.parse(bulk);
      assert.equal(parsed.ids.length, 2);
    });

    it('requires message when action is send-announcement', () => {
      assert.throws(() =>
        bulkActionSchema.parse({
          ids: ['507f1f77bcf86cd799439011'],
          action: 'send-announcement',
          message: '',
        })
      );
    });
  });
});
