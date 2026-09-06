const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Session = require('../models/Session');

describe('Session Model & Scheduling Constraints', () => {
  it('validates allowed session statuses', () => {
    const validStatuses = ['scheduled', 'completed', 'cancelled'];
    validStatuses.forEach((status) => {
      const session = new Session({
        trainer: '507f1f77bcf86cd799439011',
        customer: '507f1f77bcf86cd799439012',
        admin: '507f1f77bcf86cd799439013',
        scheduledAt: new Date(),
        status,
      });
      const err = session.validateSync();
      assert.equal(err, undefined);
    });
  });

  it('rejects invalid session status', () => {
    const session = new Session({
      trainer: '507f1f77bcf86cd799439011',
      customer: '507f1f77bcf86cd799439012',
      admin: '507f1f77bcf86cd799439013',
      scheduledAt: new Date(),
      status: 'invalid_status',
    });
    const err = session.validateSync();
    assert.ok(err.errors.status);
  });

  it('defaults durationMinutes to 60', () => {
    const session = new Session({
      trainer: '507f1f77bcf86cd799439011',
      customer: '507f1f77bcf86cd799439012',
      admin: '507f1f77bcf86cd799439013',
      scheduledAt: new Date(),
    });
    assert.equal(session.durationMinutes, 60);
    assert.equal(session.status, 'scheduled');
  });
});
