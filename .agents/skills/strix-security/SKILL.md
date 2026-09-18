---
name: strix-security
description: >-
  Strix security review skill — performs an OWASP-style static security audit
  of the codebase (authentication, authorisation, input validation, injection,
  sensitive data exposure, rate-limiting, secrets management). Use this skill
  to identify and fix real vulnerabilities before running Strix CLI scans.
---

# Strix Security Review Skill

Use this skill to perform a thorough security audit of the project before or
alongside running the real Strix CLI scanner (`strix --target ./backend`).

---

## Strix CLI Quick-Reference (run manually)

```bash
# 1. Install (requires Docker)
curl -sSL https://strix.ai/install | bash

# 2. Configure LLM provider
export STRIX_LLM="openai/gpt-4o"   # or anthropic/claude-3-7-sonnet
export LLM_API_KEY="sk-..."

# 3. Scan this project
strix --target ./backend
strix --target ./backend --instruction "Focus on authentication bypass, IDOR, and JWT issues"

# Results land in: ./strix_runs/<run-name>/
```

---

## Agent-Side Static Security Checklist

When this skill is active, audit every route / model change against these
OWASP Top-10-aligned checks:

### A01 — Broken Access Control
- [ ] Every route that touches data has `protect` + `authorize(role)` applied.
- [ ] No endpoint accepts a user-controlled `adminId` / `userId` without
  verifying it matches `req.user`.
- [ ] Tenant isolation: all DB queries for tenant-scoped data include the
  `admin` field scoped to `req.adminId`.

### A02 — Cryptographic Failures
- [ ] No secrets, tokens, or password hashes in API responses.
- [ ] `passwordHash` is excluded from `req.user` (`.select('-passwordHash')`).
- [ ] `JWT_SECRET` is only read from `process.env`, never hardcoded.
- [ ] Refresh tokens are stored hashed, not plaintext.

### A03 — Injection
- [ ] All user input entering a Mongoose query is validated by Zod schema
  **before** it touches the DB layer.
- [ ] No `eval()`, dynamic `$where`, or raw regex constructed from user input.

### A04 — Insecure Design
- [ ] Rate limiters applied to login, password change, and public endpoints.
- [ ] Brute-force mitigations on authentication routes.

### A05 — Security Misconfiguration
- [ ] `helmet()` applied before routes.
- [ ] CORS whitelist does not fall back to `*` in production.
- [ ] No stack traces or internal error messages exposed in production responses.

### A06 — Vulnerable & Outdated Components
- Run `npm audit` in `backend/` and `frontend/` before each release.

### A07 — Identification & Authentication Failures
- [ ] Tokens expire in short windows (JWT 15 min default).
- [ ] Refresh token rotation implemented.
- [ ] Disabled/suspended accounts rejected at DB level, not just token level.

### A08 — Software & Data Integrity Failures
- [ ] Stripe webhook verified with `STRIPE_WEBHOOK_SECRET` before processing.
- [ ] Cron endpoint protected with `CRON_SECRET`.

### A09 — Security Logging & Monitoring
- [ ] Sensitive actions (create admin, suspend, reset password, mark paid) all
  write to `AuditLog`.
- [ ] Failed auth attempts logged.

### A10 — Server-Side Request Forgery (SSRF)
- [ ] No server-side HTTP requests built from raw user-supplied URLs.

---

## Running This Skill

Ask the agent:
- `"Run a Strix security review on the auth routes"` — audits auth surface.
- `"Run a Strix security review on admin routes"` — checks tenant isolation.
- `"Run a full Strix security audit"` — checks every category above.
