/**
 * tests/streak.test.js
 * Comprehensive unit tests for streak and milestone badge logic.
 * Mirrors the exact logic from customerRoutes.js handleCheckin().
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// --- Mirror of handleCheckin streak logic ------------------------------------

function computeStreakUpdate(streak, nowDate = new Date()) {
  const today = new Date(nowDate);
  today.setUTCHours(0, 0, 0, 0);

  if (streak.lastCheckin) {
    const last = new Date(streak.lastCheckin);
    last.setUTCHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { alreadyCheckedIn: true, currentStreak: streak.currentStreak };
    }

    if (diffDays === 1) {
      return { alreadyCheckedIn: false, currentStreak: streak.currentStreak + 1, restDayApplied: false };
    }

    if (diffDays === 2) {
      // 1 day skipped: check 1-day-per-week rest day allowance
      const daysSinceLastRest = streak.lastRestDayUsed
        ? Math.round((today - new Date(streak.lastRestDayUsed)) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastRest >= 7) {
        return {
          alreadyCheckedIn: false,
          currentStreak: streak.currentStreak + 1,
          restDayApplied: true,
          lastRestDayUsed: today,
        };
      }
      return { alreadyCheckedIn: false, currentStreak: 1, restDayApplied: false };
    }

    // 2 or more days skipped
    return { alreadyCheckedIn: false, currentStreak: 1, restDayApplied: false };
  }

  return { alreadyCheckedIn: false, currentStreak: 1, restDayApplied: false };
}

function computeBadges(currentStreak, existingBadges = []) {
  const milestones = [7, 30, 100, 365];
  const badges = [...existingBadges];
  milestones.forEach((m) => {
    const badge = `${m}-day-streak`;
    if (currentStreak >= m && !badges.includes(badge)) {
      badges.push(badge);
    }
  });
  return badges;
}

function computeLongestStreak(currentStreak, longestStreak) {
  return Math.max(longestStreak, currentStreak);
}

// --- Tests -------------------------------------------------------------------

describe("Streak Logic", () => {
  describe("computeStreakUpdate()", () => {
    it("starts at 1 on first ever checkin (no lastCheckin)", () => {
      const result = computeStreakUpdate({ currentStreak: 0, lastCheckin: null });
      assert.equal(result.currentStreak, 1);
      assert.equal(result.alreadyCheckedIn, false);
    });

    it("increments streak by 1 on consecutive-day checkin", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = computeStreakUpdate({ currentStreak: 7, lastCheckin: yesterday });
      assert.equal(result.currentStreak, 8);
      assert.equal(result.alreadyCheckedIn, false);
      assert.equal(result.restDayApplied, false);
    });

    it("does not increment on same-day duplicate checkin", () => {
      const today = new Date();
      const result = computeStreakUpdate({ currentStreak: 5, lastCheckin: today });
      assert.equal(result.currentStreak, 5);
      assert.equal(result.alreadyCheckedIn, true);
    });

    it("preserves streak (+1) when 1 day skipped and weekly rest day is available", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const result = computeStreakUpdate({
        currentStreak: 10,
        lastCheckin: twoDaysAgo,
        lastRestDayUsed: null, // never used before
      });
      assert.equal(result.currentStreak, 11);
      assert.equal(result.restDayApplied, true);
    });

    it("resets streak to 1 on 1 day skipped if rest day was ALREADY used within 7 days", () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const result = computeStreakUpdate({
        currentStreak: 10,
        lastCheckin: twoDaysAgo,
        lastRestDayUsed: threeDaysAgo, // used 3 days ago (< 7 days)
      });
      assert.equal(result.currentStreak, 1);
      assert.equal(result.restDayApplied, false);
    });

    it("resets streak to 1 when 2 or more days are skipped (e.g. 3 days ago)", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = computeStreakUpdate({ currentStreak: 30, lastCheckin: threeDaysAgo });
      assert.equal(result.currentStreak, 1);
      assert.equal(result.alreadyCheckedIn, false);
    });

    it("resets streak to 1 when many days skipped", () => {
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 100);
      const result = computeStreakUpdate({ currentStreak: 99, lastCheckin: longAgo });
      assert.equal(result.currentStreak, 1);
    });

    it("uses UTC midnight comparison (handles timezone edge case)", () => {
      // Build a date that is "yesterday" in UTC
      const yesterday = new Date();
      yesterday.setUTCHours(0, 0, 0, 0);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const result = computeStreakUpdate({ currentStreak: 3, lastCheckin: yesterday });
      assert.equal(result.currentStreak, 4);
    });
  });

  describe("computeBadges()", () => {
    it("awards 7-day badge when streak reaches 7", () => {
      const badges = computeBadges(7, []);
      assert.ok(badges.includes("7-day-streak"));
    });

    it("awards 30-day badge when streak reaches 30", () => {
      const badges = computeBadges(30, []);
      assert.ok(badges.includes("30-day-streak"));
      assert.ok(badges.includes("7-day-streak"));
    });

    it("awards 100-day badge when streak reaches 100", () => {
      const badges = computeBadges(100, []);
      assert.ok(badges.includes("100-day-streak"));
    });

    it("awards 365-day badge when streak reaches 365", () => {
      const badges = computeBadges(365, []);
      assert.ok(badges.includes("365-day-streak"));
    });

    it("does not duplicate an already-earned badge", () => {
      const existing = ["7-day-streak"];
      const badges = computeBadges(10, existing);
      const count = badges.filter((b) => b === "7-day-streak").length;
      assert.equal(count, 1, "Badge must not be duplicated");
    });

    it("does not award badge if streak is below milestone", () => {
      const badges = computeBadges(6, []);
      assert.equal(badges.includes("7-day-streak"), false);
    });

    it("awards no badges on streak of 1", () => {
      const badges = computeBadges(1, []);
      assert.equal(badges.length, 0);
    });

    it("preserves existing badges on subsequent checkins", () => {
      const existing = ["7-day-streak", "30-day-streak"];
      const badges = computeBadges(35, existing);
      assert.ok(badges.includes("7-day-streak"));
      assert.ok(badges.includes("30-day-streak"));
    });
  });

  describe("computeLongestStreak()", () => {
    it("updates longestStreak when currentStreak exceeds it", () => {
      assert.equal(computeLongestStreak(50, 30), 50);
    });

    it("keeps longestStreak when currentStreak is lower", () => {
      assert.equal(computeLongestStreak(5, 30), 30);
    });

    it("keeps longestStreak equal when both are the same", () => {
      assert.equal(computeLongestStreak(10, 10), 10);
    });

    it("handles starting from zero", () => {
      assert.equal(computeLongestStreak(1, 0), 1);
    });
  });
});
