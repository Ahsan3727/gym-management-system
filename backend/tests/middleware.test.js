/**
 * tests/middleware.test.js
 * Unit tests for the validate() middleware and slugify utility.
 * No DB or HTTP server required.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validate } = require("../middleware/validate");
const { loginSchema } = require("../schemas/authSchemas");
const { createFeeSchema, createCustomerSchema } = require("../schemas/adminSchemas");
const { slugify } = require("../utils/slugify");

// --- Minimal mock req/res/next --------------------------------------------

function makeReqRes(body) {
  const req = { body };
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  return { req, res, next, isNext: () => nextCalled };
}

describe("validate() Middleware", () => {
  it("calls next() and mutates req.body on valid input", () => {
    const { req, res, next, isNext } = makeReqRes({
      username: "john_doe",
      password: "password123",
    });
    validate(loginSchema)(req, res, next);
    assert.equal(isNext(), true, "next() must be called on valid input");
    assert.ok(req.body.username, "req.body should have username after parse");
  });

  it("returns 400 and never calls next() on invalid input", () => {
    const { req, res, next, isNext } = makeReqRes({ username: "", password: "" });
    validate(loginSchema)(req, res, next);
    assert.equal(isNext(), false, "next() must NOT be called on invalid input");
    assert.equal(res._status, 400);
    assert.ok(res._json.message, "Error response should have a message");
    assert.ok(res._json.errors, "Error response should have an errors field");
  });

  it("returns field-level errors on schema failure", () => {
    const { req, res, next } = makeReqRes({
      customerId: "not-a-mongo-id",
      amount: -50,
      dueDate: "2026-10-01",
    });
    validate(createFeeSchema)(req, res, next);
    assert.equal(res._status, 400);
    assert.ok(typeof res._json.errors === "object");
  });

  it("coerces and replaces req.body with parsed schema output (lowercases username)", () => {
    const { req, res, next, isNext } = makeReqRes({
      username: "JOHN_DOE",
      name: "John Doe",
    });
    validate(createCustomerSchema)(req, res, next);
    assert.equal(isNext(), true);
    // schema lowercases the username field
    assert.equal(req.body.username, "john_doe");
  });
});

describe("slugify() Utility", () => {
  it("converts gym name to a lowercase hyphenated slug", () => {
    const slug = slugify("Iron Fitness Club");
    assert.equal(slug, "iron-fitness-club");
  });

  it("strips special characters", () => {
    const slug = slugify("Apex & Elite! Gym 2024");
    assert.ok(/^[a-z0-9-]+$/.test(slug));
  });

  it("collapses multiple spaces/special chars to single hyphen", () => {
    const slug = slugify("My   Gym   Name");
    assert.ok(!slug.includes("--"), "No double hyphens");
  });

  it("strips leading and trailing hyphens", () => {
    const slug = slugify("!!GymName!!");
    assert.ok(!slug.startsWith("-"));
    assert.ok(!slug.endsWith("-"));
  });

  it("strips accent diacritics (NFKD normalisation)", () => {
    const slug = slugify("Café Fit");
    assert.ok(!slug.includes("é"), "Accented chars must be stripped");
    assert.ok(/^[a-z0-9-]+$/.test(slug));
  });

  it("handles empty input without throwing", () => {
    const slug = slugify("");
    assert.equal(slug, "");
  });

  it("handles null input without throwing", () => {
    const slug = slugify(null);
    assert.equal(slug, "");
  });

  it("lowercases uppercase input", () => {
    const slug = slugify("APEX GYM");
    assert.equal(slug, "apex-gym");
  });
});
