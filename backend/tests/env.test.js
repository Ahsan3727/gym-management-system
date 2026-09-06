const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { validateEnv } = require('../utils/env');

describe('Environment Validator', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_123456789012';
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('passes when required variables are present', () => {
    assert.equal(validateEnv(), true);
  });

  it('warns in non-production when variable is missing', () => {
    delete process.env.JWT_SECRET;
    // Should not throw in development, returns true
    assert.equal(validateEnv(), true);
  });

  it('throws in production when required variable is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    assert.throws(() => validateEnv(), /FATAL: Missing required/);
  });
});
