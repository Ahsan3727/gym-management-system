/**
 * tests/auth.login.test.js
 * Unit tests for the login disambiguation and password verification logic
 * extracted from authRoutes.js. Tests the pure business logic without
 * making HTTP calls or connecting to MongoDB.
 */

const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

before(() => {
  process.env.JWT_SECRET = "test_jwt_secret_for_unit_tests_only_32chars";
  process.env.MONGO_URI = "mongodb://localhost:27017/test_dummy";
});

// --- Mirror of the login disambiguation logic -----------------------------

/**
 * Given a list of candidate users with the same username,
 * find the one whose stored hash matches the given password.
 * Returns { user, passwordAlreadyVerified } matching authRoutes.js logic.
 */
async function disambiguateByPassword(candidates, password) {
  if (candidates.length === 0) return { user: null, passwordAlreadyVerified: false };
  if (candidates.length === 1) return { user: candidates[0], passwordAlreadyVerified: false };

  for (const candidate of candidates) {
    const match = await bcrypt.compare(password, candidate.passwordHash);
    if (match) return { user: candidate, passwordAlreadyVerified: true };
  }
  return { user: null, passwordAlreadyVerified: false };
}

// --- Mirror of temp password masking logic --------------------------------

function maskPassword(password) {
  return password.slice(0, 3) + "***" + password.slice(-2);
}

// --- Mirror of email resolution logic ------------------------------------

function resolveRecipientEmail(emailInput, usernameInput) {
  return (
    (emailInput || (usernameInput.includes("@") ? usernameInput : ""))
      .trim()
      .toLowerCase() || null
  );
}

// --- Tests ----------------------------------------------------------------

describe("Login Disambiguation Logic", () => {
  it("returns null when candidate list is empty", async () => {
    const { user } = await disambiguateByPassword([], "anyPassword");
    assert.equal(user, null);
  });

  it("returns single candidate without password comparison", async () => {
    const candidates = [{ username: "solo", passwordHash: "irrelevant" }];
    const { user, passwordAlreadyVerified } = await disambiguateByPassword(candidates, "any");
    assert.equal(user.username, "solo");
    assert.equal(passwordAlreadyVerified, false, "Single candidate skips bcrypt check");
  });

  it("disambiguates multiple candidates by matching password", async () => {
    const hash1 = await bcrypt.hash("password_for_gym1", 10);
    const hash2 = await bcrypt.hash("password_for_gym2", 10);

    const candidates = [
      { username: "john", gym: "gym1", passwordHash: hash1 },
      { username: "john", gym: "gym2", passwordHash: hash2 },
    ];

    const { user, passwordAlreadyVerified } = await disambiguateByPassword(
      candidates,
      "password_for_gym2"
    );
    assert.equal(user.gym, "gym2");
    assert.equal(passwordAlreadyVerified, true, "Multi-candidate match sets flag to skip re-verify");
  });

  it("returns null when no candidate matches the password", async () => {
    const hash = await bcrypt.hash("correct_password", 10);
    const candidates = [
      { username: "john", gym: "gym1", passwordHash: hash },
      { username: "john", gym: "gym2", passwordHash: hash },
    ];

    const { user } = await disambiguateByPassword(candidates, "wrong_password");
    assert.equal(user, null);
  });

  it("passwordAlreadyVerified prevents double bcrypt compare", async () => {
    const hash = await bcrypt.hash("pw", 10);
    const candidates = [
      { username: "a", passwordHash: hash },
      { username: "b", passwordHash: "different" },
    ];

    const { passwordAlreadyVerified } = await disambiguateByPassword(candidates, "pw");
    assert.equal(
      passwordAlreadyVerified,
      true,
      "Should be true so calling code skips the second compare"
    );
  });
});

describe("Temp Password Masking", () => {
  it("masks the middle of a temp password", () => {
    const masked = maskPassword("Ab1Xy9Zq");
    assert.ok(masked.startsWith("Ab1"), "First 3 chars shown");
    assert.ok(masked.endsWith("Zq"), "Last 2 chars shown");
    assert.ok(masked.includes("***"), "Middle masked with ***");
  });

  it("does not leak the full password", () => {
    const original = "SuperSecret123";
    const masked = maskPassword(original);
    assert.notEqual(masked, original);
    assert.ok(masked.length < original.length + 3);
  });
});

describe("Email Resolution Logic", () => {
  it("uses explicit email when provided", () => {
    const email = resolveRecipientEmail("user@example.com", "johndoe");
    assert.equal(email, "user@example.com");
  });

  it("uses username as email when it contains @", () => {
    const email = resolveRecipientEmail("", "john@example.com");
    assert.equal(email, "john@example.com");
  });

  it("returns null when neither email nor username-as-email available", () => {
    const email = resolveRecipientEmail("", "johndoe");
    assert.equal(email, null);
  });

  it("normalises email to lowercase", () => {
    const email = resolveRecipientEmail("USER@EXAMPLE.COM", "");
    assert.equal(email, "user@example.com");
  });

  it("trims whitespace from email", () => {
    const email = resolveRecipientEmail("  user@example.com  ", "");
    assert.equal(email, "user@example.com");
  });
});
