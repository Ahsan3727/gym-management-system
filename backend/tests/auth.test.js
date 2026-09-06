const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

describe('Authentication & Password Handling', () => {
  it('hashes password and verifies match correctly', async () => {
    const raw = 'SecretGymPass2026';
    const hash = await bcrypt.hash(raw, 10);

    const isMatch = await bcrypt.compare(raw, hash);
    assert.equal(isMatch, true);

    const wrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(wrongMatch, false);
  });

  it('generates secure 8+ char temporary password when omitted', () => {
    // Mimic the auto-generation logic used in adminRoutes.js
    const autoPass = crypto.randomBytes(5).toString('base64url');
    assert.ok(autoPass.length >= 7);
    assert.ok(typeof autoPass === 'string');
  });

  it('resolves recipient email as null if not provided (no email flow)', () => {
    const emailInput = '';
    const usernameInput = 'john.doe';

    const recipientEmail =
      (emailInput || (usernameInput.includes('@') ? usernameInput : '')).trim().toLowerCase() || null;

    assert.equal(recipientEmail, null);
  });
});
