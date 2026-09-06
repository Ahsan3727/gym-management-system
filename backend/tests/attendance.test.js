const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Attendance & Streak Logic', () => {
  function calculateStreak(lastCheckinDate, currentStreak = 0, today = new Date()) {
    const todayUTC = new Date(today);
    todayUTC.setUTCHours(0, 0, 0, 0);

    if (!lastCheckinDate) {
      return { currentStreak: 1, isNewCheckin: true };
    }

    const last = new Date(lastCheckinDate);
    last.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.round((todayUTC - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { currentStreak, isNewCheckin: false }; // already checked in today
    } else if (diffDays === 1) {
      return { currentStreak: currentStreak + 1, isNewCheckin: true };
    } else {
      return { currentStreak: 1, isNewCheckin: true }; // streak broken
    }
  }

  it('starts streak at 1 on first ever checkin', () => {
    const res = calculateStreak(null, 0);
    assert.equal(res.currentStreak, 1);
    assert.equal(res.isNewCheckin, true);
  });

  it('increments streak when checkin is on the consecutive day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const res = calculateStreak(yesterday, 5);
    assert.equal(res.currentStreak, 6);
    assert.equal(res.isNewCheckin, true);
  });

  it('does not increment streak on duplicate same-day checkin', () => {
    const today = new Date();
    const res = calculateStreak(today, 5);
    assert.equal(res.currentStreak, 5);
    assert.equal(res.isNewCheckin, false);
  });

  it('resets streak to 1 when a day is skipped', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const res = calculateStreak(threeDaysAgo, 14);
    assert.equal(res.currentStreak, 1);
    assert.equal(res.isNewCheckin, true);
  });
});
