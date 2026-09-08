/**
 * tests/jwt.test.js
 * Unit tests for JWT token generation and verification.
 * No DB or HTTP server required - pure logic tests.
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

before(() => {
  process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_32chars';
  process.env.JWT_EXPIRES_IN = '15m';
});

const generateToken = require('../utils/generateToken');

function makeUser(overrides = {}) {
  return {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    username: 'testuser',
    role: 'customer',
    isActive: true,
    ...overrides,
  };
}

describe('JWT Token Generation', () => {
  it('produces a signed JWT string', () => {
    const token = generateToken(makeUser());
    assert.equal(typeof token, 'string');
    assert.ok(token.split('.').length === 3, 'JWT must have 3 parts');
  });

  it('encodes user id and role in the payload', () => {
    const user = makeUser({ role: 'admin' });
    const token = generateToken(user);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(payload.id, '507f1f77bcf86cd799439011');
    assert.equal(payload.role, 'admin');
  });

  it('encodes all four valid roles correctly', () => {
    const roles = ['customer', 'trainer', 'admin', 'super_admin'];
    for (const role of roles) {
      const token = generateToken(makeUser({ role }));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      assert.equal(payload.role, role);
    }
  });

  it('token has expiry later than issue time', () => {
    const token = generateToken(makeUser());
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.ok(payload.exp > payload.iat, 'exp must be after iat');
    assert.ok(payload.exp - payload.iat <= 900, 'expiry window should be <= 15 minutes');
  });

  it('fails verification with wrong secret', () => {
    const token = generateToken(makeUser());
    assert.throws(() => jwt.verify(token, 'WRONG_SECRET'));
  });

  it('fails verification if token is tampered', () => {
    const token = generateToken(makeUser());
    const parts = token.split('.');
    const tampered = [parts[0], parts[1].slice(0, -2) + 'ZZ', parts[2]].join('.');
    assert.throws(() => jwt.verify(tampered, process.env.JWT_SECRET));
  });

  it('does not include passwordHash in the token payload', () => {
    const user = makeUser({ passwordHash: 'super_secret_hash' });
    const token = generateToken(user);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(payload.passwordHash, undefined);
  });
});
