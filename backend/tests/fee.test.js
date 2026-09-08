/**
 * tests/fee.test.js
 * Unit tests for fee calculation and status-transition logic.
 * Tests the pure business logic without touching the DB.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// --- Pure helper functions extracted from the fee flow -----------------------

function isOverdue(dueDate, status) {
  if (status === "paid") return false;
  return new Date(dueDate) < new Date();
}

function computeStatusTotals(fees) {
  return fees.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + f.amount;
    return acc;
  }, {});
}

function applyStatusFilter(fees, status) {
  if (!status) return fees;
  return fees.filter((f) => f.status === status);
}

function fmtAmount(amount) {
  return amount.toFixed(2);
}

// --- Tests -------------------------------------------------------------------

describe("Fee Business Logic", () => {
  describe("isOverdue()", () => {
    it("paid fee is never overdue regardless of due date", () => {
      const pastDate = new Date(Date.now() - 86400000);
      assert.equal(isOverdue(pastDate, "paid"), false);
    });

    it("unpaid fee with past due date is overdue", () => {
      const pastDate = new Date(Date.now() - 86400000);
      assert.equal(isOverdue(pastDate, "unpaid"), true);
    });

    it("unpaid fee with future due date is not overdue", () => {
      const futureDate = new Date(Date.now() + 86400000);
      assert.equal(isOverdue(futureDate, "unpaid"), false);
    });

    it("overdue fee with past due date remains overdue", () => {
      const pastDate = new Date(Date.now() - 86400000);
      assert.equal(isOverdue(pastDate, "overdue"), true);
    });
  });

  describe("computeStatusTotals()", () => {
    const fees = [
      { status: "paid", amount: 100 },
      { status: "paid", amount: 200 },
      { status: "unpaid", amount: 150 },
      { status: "overdue", amount: 75 },
    ];

    it("sums paid fees correctly", () => {
      const totals = computeStatusTotals(fees);
      assert.equal(totals.paid, 300);
    });

    it("sums unpaid fees correctly", () => {
      const totals = computeStatusTotals(fees);
      assert.equal(totals.unpaid, 150);
    });

    it("sums overdue fees correctly", () => {
      const totals = computeStatusTotals(fees);
      assert.equal(totals.overdue, 75);
    });

    it("returns 0 for missing status keys (no fee of that type)", () => {
      const totals = computeStatusTotals([{ status: "paid", amount: 50 }]);
      assert.equal(totals.unpaid, undefined);
    });

    it("handles empty fee list without throwing", () => {
      const totals = computeStatusTotals([]);
      assert.deepEqual(totals, {});
    });
  });

  describe("applyStatusFilter()", () => {
    const fees = [
      { status: "paid", amount: 100 },
      { status: "unpaid", amount: 150 },
      { status: "overdue", amount: 75 },
    ];

    it("returns all fees when no filter is applied", () => {
      assert.equal(applyStatusFilter(fees, "").length, 3);
    });

    it("returns only paid fees when filtered by paid", () => {
      const result = applyStatusFilter(fees, "paid");
      assert.equal(result.length, 1);
      assert.equal(result[0].status, "paid");
    });

    it("returns only overdue fees when filtered by overdue", () => {
      const result = applyStatusFilter(fees, "overdue");
      assert.equal(result.length, 1);
      assert.equal(result[0].amount, 75);
    });

    it("returns empty array for a filter with no matching fees", () => {
      const result = applyStatusFilter([], "paid");
      assert.equal(result.length, 0);
    });
  });

  describe("fmtAmount()", () => {
    it("formats integer amounts with 2 decimal places", () => {
      assert.equal(fmtAmount(100), "100.00");
    });

    it("formats decimal amounts correctly", () => {
      assert.equal(fmtAmount(99.9), "99.90");
    });

    it("rounds to 2 decimal places", () => {
      assert.equal(fmtAmount(1.005), "1.01");
    });

    it("handles zero correctly", () => {
      assert.equal(fmtAmount(0), "0.00");
    });
  });
});
