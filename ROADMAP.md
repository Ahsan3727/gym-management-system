# Ironline — Development Roadmap

This document defines the phased delivery plan for the Ironline Gym Management System.
Each phase builds directly on the previous one. Features are ordered by business impact
and technical dependency — the things that block production go first.

---

## How to Read This File

- **Status badges**: `[DONE]` `[NEXT]` `[PLANNED]` `[DEFERRED]`
- **Priority**: P1 (must-have) → P2 (important) → P3 (nice-to-have)
- **Source**: Where in the code the gap was identified

---

## Phase 1 — Core MVP (Current Baseline)

**Goal**: A working, deployable multi-tenant gym platform that gym owners can actually
use to manage their members and track their own revenue manually.

| Feature | Status | Notes |
| :--- | :---: | :--- |
| JWT authentication + bcrypt hashing | DONE | `backend/routes/authRoutes.js` |
| Role-based access: customer / trainer / admin / super_admin | DONE | `backend/middleware/auth.js` |
| Server-side tenant isolation via JWT-derived `req.adminId` | DONE | `backend/middleware/tenant.js` |
| Super Admin: create / suspend / enable gym accounts | DONE | `backend/routes/superAdminRoutes.js` |
| Super Admin: password reset (Nodemailer email delivery) | DONE | Nodemailer SMTP pipeline delivers reset credentials |
| Super Admin: audit log + platform stats | DONE | `backend/routes/superAdminRoutes.js` |
| Super Admin: platform settings singleton | DONE | `backend/models/Settings.js` |
| Admin: gym profile CRUD | DONE | `backend/routes/adminRoutes.js` |
| Admin: membership plan CRUD + deactivation | DONE | `backend/routes/adminRoutes.js` |
| Admin: member directory (create / edit / flag inactive / delete) | DONE | `backend/routes/adminRoutes.js` |
| Admin: cascading member deletion (user + all logs) | DONE | BUG #6 fixed — all child docs removed |
| Admin: fee record creation + manual status toggle | DONE | `backend/routes/adminRoutes.js` |
| Admin: auto-generated receipt number on payment | DONE | `crypto.randomBytes` in adminRoutes |
| Admin: revenue report by date range | DONE | `/api/admin/fees-report` |
| Admin: broadcast announcements → stored notifications | DONE | `backend/routes/adminRoutes.js` |
| Customer: workout logging (CRUD) | DONE | `backend/routes/customerRoutes.js` |
| Customer: diet / water logging (CRUD) | DONE | `backend/routes/customerRoutes.js` |
| Customer: weight / body measurement logging | DONE | `backend/routes/customerRoutes.js` |
| Customer: daily streak check-in + milestone badges | DONE | BUG #16 fixed — UTC-consistent |
| Customer: 30-day analytics endpoint | DONE | `/api/customer/analytics` |
| Customer: fee status view (read-only) | DONE | `backend/routes/customerRoutes.js` |
| Customer: notification inbox | DONE | `backend/routes/customerRoutes.js` |
| Unified Vercel deployment (SPA + serverless API, single domain) | DONE | `vercel.json` at root |
| Login brute-force rate limiting | DONE | express-rate-limit, 20 req/15 min/IP |
| Field whitelisting to prevent mass-assignment | DONE | BUG #3 fixed across all routes |

---

## Phase 2 — Automation & Production Hardening (Completed)

**Status**: Completed. All 6 features implemented across backend and frontend.

---

### 2.1 — Automated Overdue Fee Detection (P1)

**Why first**: Admins currently have to manually find and flip fees to `overdue`.
This is the most painful daily admin task and the most common source of lost revenue.

**What to build**:
- A scheduled job (Vercel Cron, or a standalone worker on Railway/Render) that runs
  once per day at midnight.
- Query: `Fee.find({ status: 'unpaid', dueDate: { $lt: new Date() } })`
- Bulk-update all matching documents to `status: 'overdue'`.
- Optionally trigger a notification for each affected customer.

**Files to create/modify**:
- `backend/jobs/markOverdueFees.js` — the job logic
- `vercel.json` — add a cron function entry (Vercel Cron syntax)
- `api/cron/overdue.js` — the Vercel cron handler

**Code already in place**:
- `Fee` model has `status`, `dueDate`, and compound index `{ admin, status, dueDate }`.
- `Notification` model and `Customer.notificationPrefs` fields are already defined
  and waiting for this use case (see `backend/models/Notification.js`).

---

### 2.2 — Transactional Email via Resend / SendGrid (P1)

**Why second**: The current password reset flow logs the temp password to `console.log`
server-side (see `backend/routes/superAdminRoutes.js` line ~127). This is a
**security and usability gap** — gym owners have no way to receive their reset password
without server access.

**What to build**:
- Install an email SDK: `npm install resend` (or `@sendgrid/mail`)
- Create `backend/utils/mailer.js` — thin wrapper with `sendEmail({ to, subject, html })`
- Patch `superAdminRoutes.js`: replace `console.log(tempPassword)` with a mailer call
- Add welcome email on new customer account creation
- Add overdue fee reminder email (triggered by the Phase 2.1 cron)

**Environment variables to add**:
```
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@ironlinegym.com
```

---

### 2.3 — Asset Upload Pipeline (P2)

**Why**: `Customer.progressPhotoUrl` and `Admin.gymLogoUrl` currently accept any
raw URL string. There is no upload UI or secure storage.

**What to build**:
- Backend: `POST /api/upload/signed-url` — generates a pre-signed S3 or Cloudinary
  upload URL. The client uploads directly to cloud storage; the URL is stored in DB.
- Frontend: Replace the `gymLogoUrl` text input in `GymProfile.jsx` with a file picker
  that calls the signed-URL endpoint first, then uploads.

**Options (pick one)**:
- **Cloudinary** — easiest, generous free tier, Node SDK: `npm install cloudinary`
- **AWS S3** — most standard, requires IAM, `npm install @aws-sdk/client-s3`
- **Supabase Storage** — if you later want to consider Supabase as a DB alternative

---

### 2.4 — JWT Refresh Token & Logout Invalidation (P2)

**Why**: Current access tokens live 7 days with no server-side invalidation. If an
admin's device is stolen, there is no way to log them out remotely.

**What to build**:
- On login: issue a short-lived access token (15 min) + a long-lived refresh token
  (30 days) stored in an `httpOnly` cookie.
- Add `POST /api/auth/refresh` — validates the refresh token cookie, returns a new
  access token.
- Add `POST /api/auth/logout` — adds the refresh token to a short-lived Redis blocklist
  (or just deletes it from a `RefreshToken` collection in MongoDB).
- Frontend: Axios interceptor retries the original request after refreshing the token
  on a 401 response.

---

### 2.5 — QR-Code Gym Check-In (P2)

**Why**: The current streak check-in is completely self-reported. A member could
maintain a streak without ever entering the gym. For gyms that care about physical
attendance, a physical check-in mechanism is needed.

**What to build**:
- Admin generates a dynamic QR code (rotates every 24 hours) displayed on a tablet/screen
  at gym reception. The QR code encodes a time-limited token.
- Customer scans QR with their phone — the frontend sends the token to
  `POST /api/customer/streak/checkin` which validates it before incrementing the streak.
- Add `qrToken` and `qrTokenExpiry` fields to `Admin` model.
- Add `POST /api/admin/checkin-qr` — rotates and returns the current QR token.

---

### 2.6 — CSV / PDF Export of Reports (P2)

**Why**: Gym owners need to export fee records and member lists for accounting.

**What to build**:
- `GET /api/admin/fees/export?format=csv&from=...&to=...` — streams a CSV using
  `csv-writer` or a simple manual string builder.
- `GET /api/admin/fees/export?format=pdf` — generate PDF using `pdfkit` (lightweight,
  no headless browser needed).
- Add export buttons to `frontend/src/pages/admin/Fees.jsx`.

---

## Phase 3 — Commercial Monetization & Scale (Completed)

**Status**: Completed. All 4 features implemented across backend and frontend.

---

### 3.1 — Stripe Payment Integration (P1)

**What**: Replace manual fee toggling with real money movement.

- Member self-service: `POST /api/customer/fees/:id/pay` creates a Stripe Checkout
  session. Member pays with card. Stripe webhook calls
  `POST /api/webhooks/stripe` which marks the fee as `paid` automatically.
- Admin view: Stripe Dashboard for payout and dispute management.
- Super Admin billing: Stripe Billing for per-gym SaaS subscription (e.g. $29/month
  per gym). Controlled via `Settings.platformBillingEnabled` already in the model.

**Environment variables to add**:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 3.2 — Trainer / Staff Role (P2)

**Why**: Most gyms have personal trainers who need to assign workout plans and
track client progress — but should not have full admin access to billing or member creation.

**What to build**:
- New role: `trainer` — sits between `customer` and `admin` in the role hierarchy.
- `Trainer` model: links to a `User`, belongs to an `Admin` (gym), has an assigned list
  of customer IDs.
- New routes: `trainerRoutes.js` — can read/write `WorkoutLog` and `DietLog` for
  assigned customers only.
- New frontend pages: `pages/trainer/` — client list, workout plan builder.

---

### 3.3 — Multi-Branch / Franchise Hierarchy (P3)

**Why**: A gym chain with multiple locations needs one owner account that governs
multiple branch admins.

**What to build**:
- New model: `GymChain` — one document per franchise owner.
- `Admin.gymChain` reference field.
- New role: `chain_owner` — sits above `admin`, sees aggregated stats across all branches.
- Super Admin still governs all chains at the platform level.

---

### 3.4 — Progressive Web App (PWA) (P3)

**Why**: Members should be able to install Ironline to their phone home screen and
check in / log workouts offline (syncing when they regain connectivity).

**What to build**:
- `vite-plugin-pwa` — generates a service worker and `manifest.json`.
- Cache-first strategy for the dashboard shell and static assets.
- IndexedDB-backed offline queue for workout log submissions.

---

## Dependency Graph

```
Phase 1 (DONE)
    |
    +---> Phase 2.1 (Overdue Cron)    <-- enables Phase 2.2 email triggers
    +---> Phase 2.2 (Email)           <-- enables Phase 3.1 Stripe receipts
    +---> Phase 2.3 (Asset Upload)    <-- independent
    +---> Phase 2.4 (JWT Refresh)     <-- independent, enables Phase 3.1 security
    +---> Phase 2.5 (QR Check-in)     <-- independent
    +---> Phase 2.6 (CSV/PDF Export)  <-- independent
    |
    +---> Phase 3.1 (Stripe)          <-- requires 2.1 (overdue) + 2.2 (email receipts)
    +---> Phase 3.2 (Trainer Role)    <-- requires Phase 2.4 (auth hardening)
    +---> Phase 3.3 (Multi-Branch)    <-- requires Phase 3.2 (role hierarchy)
    +---> Phase 3.4 (PWA)             <-- independent of all others
```

---

## Phase 2 & Phase 3 Delivery Status

All delivery mechanisms scoped across Phase 2 and Phase 3 have been implemented and verified:

| Feature Area | Delivery Mechanism | Status |
| :--- | :--- | :---: |
| Overdue fee automation | Vercel Cron (`/api/cron/overdue.js`) + scanner (`markOverdueFees.js`) | ✅ Completed |
| Email notifications | Nodemailer SMTP pipeline with HTML templates (`mailer.js`) | ✅ Completed |
| Trainer / Staff Role | Dedicated Trainer role, assigned client studio & prescriptions (`/trainer`) | ✅ Completed |
| Receipt & Revenue Export | PDFKit + CSV generator (`adminRoutes.js` `/reports/export`) | ✅ Completed |
| Photo & Logo Upload | Cloudinary API + Multer memory storage (`uploadRoutes.js`) | ✅ Completed |
| Stripe Payments | Stripe checkout sessions, webhooks & simulated test mode | ✅ Completed |
| Multi-Branch Hierarchy | Branch management console & facility capacities (`Branches.jsx`) | ✅ Completed |
| Progressive Web App | `manifest.json`, `sw.js` service worker, and responsive mobile drawer | ✅ Completed |

---

## Changelog of Known Bug Fixes

These bugs were identified and fixed across development cycles:

| Bug | What Was Wrong | Fix Applied |
| :--- | :--- | :--- |
| BUG #2 | Temp password returned in HTTP response body | Now logged server-side only & sent via Nodemailer |
| BUG #3 | Mass-assignment: `Object.assign(log, req.body)` allowed overwriting `customer._id` | Explicit field whitelisting on all PUT routes |
| BUG #5 | Two separate `if` blocks for fee status — both ran even when only one should | Replaced with `if/else` |
| BUG #6 | Deleting a customer left orphaned `Notification` documents in the DB | Added `Notification.deleteMany` to the cascading delete |
| BUG #8 | Filter used `status: 'expired'` but UI displayed `'inactive'` | Standardised to `isActive: false` |
| BUG #13 | Inactive plans appeared in customer-facing dropdown | Added `/api/admin/plans/active` endpoint that filters `isActive: true` |
| BUG #16 | Streak check-in used local server time (`setHours`) — caused double check-ins near midnight | Replaced with `setUTCHours(0,0,0,0)` for consistent UTC day boundaries |
| BUG #17 | Trainer login redirected to `/login` loop due to missing role in `roleHome` | Added `trainer: '/trainer'` to `roleHome` in `Login.jsx` |
| BUG #18 | Customer had no in-app notification inbox to read alerts | Created `Notifications.jsx` and wired into navigation |

---

*Last updated: September 2026 — reflects codebase state at Phase 3 completion.*
