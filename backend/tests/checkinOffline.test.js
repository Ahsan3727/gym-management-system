const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function validateOfflineScanTimestamp(offlineScannedAt, now = new Date()) {
  if (!offlineScannedAt) {
    return { valid: true, isOffline: false, scanDate: now };
  }

  const scanDate = new Date(offlineScannedAt);
  if (isNaN(scanDate.getTime())) {
    return { valid: false, error: 'Invalid offline check-in timestamp.' };
  }

  if (scanDate > now) {
    return { valid: false, error: 'Offline check-in timestamp cannot be in the future.' };
  }

  const ageHours = (now.getTime() - scanDate.getTime()) / (1000 * 60 * 60);
  if (ageHours > 36) {
    return { valid: false, error: 'Offline check-in has expired (must be synced within 24–36 hours).' };
  }

  return { valid: true, isOffline: true, scanDate };
}

function getMidnightExpiry(date = new Date()) {
  const expiresAt = new Date(date);
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}

describe('Offline Check-In & Midnight Expiry Logic', () => {
  it('accepts valid offline check-in timestamp from earlier today', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = validateOfflineScanTimestamp(twoHoursAgo);
    assert.equal(result.valid, true);
    assert.equal(result.isOffline, true);
  });

  it('rejects future offline check-in timestamp', () => {
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const result = validateOfflineScanTimestamp(future);
    assert.equal(result.valid, false);
    assert.match(result.error, /cannot be in the future/i);
  });

  it('rejects offline check-in older than 36 hours', () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const result = validateOfflineScanTimestamp(old);
    assert.equal(result.valid, false);
    assert.match(result.error, /expired/i);
  });

  it('calculates midnight expiry at 23:59:59.999 for today', () => {
    const now = new Date('2026-09-11T10:30:00.000Z');
    const expiry = getMidnightExpiry(now);
    assert.equal(expiry.getHours(), 23);
    assert.equal(expiry.getMinutes(), 59);
    assert.equal(expiry.getSeconds(), 59);
    assert.equal(expiry.getMilliseconds(), 999);
  });
});
