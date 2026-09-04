# Ironline — Multi-Tenant Gym Management System

> A multi-tenant SaaS platform for gyms, fitness clubs, and health studios.
> Ironline gives gym owners a full operational dashboard, members a self-service
> fitness portal, and a super administrator complete platform governance — all
> served from a **single Vercel deployment** with zero CORS friction.

---

## Table of Contents

1. [Project Scope & Boundaries](#1-project-scope--boundaries)
2. [Role & Permissions Matrix](#2-role--permissions-matrix)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Prerequisites](#5-prerequisites)
6. [Backend Setup](#6-backend-setup)
7. [Frontend Setup](#7-frontend-setup)
8. [First Login Walkthrough](#8-first-login-walkthrough)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Project File Structure](#10-project-file-structure)
11. [Multi-Tenancy — How it is Enforced](#11-multi-tenancy--how-it-is-enforced)
12. [Security Posture](#12-security-posture)
13. [Deploying to Vercel](#13-deploying-to-vercel)
14. [Known Limitations & Production Gaps](#14-known-limitations--production-gaps)
15. [Development Roadmap](#15-development-roadmap)

---

## 1. Project Scope & Boundaries

### In-Scope — Phase 1 (Current Baseline)

| Area | What is Delivered |
| :--- | :--- |
| **Platform Governance** | Super Admin can create, suspend, enable, and reset passwords for gym (admin) accounts. Audit log and global platform stats included. |
| **Tenant Data Isolation** | Server-side multi-tenancy: every query is scoped to the authenticated tenant's ID derived from their JWT. Client cannot override this. |
| **Gym Profile Management** | Admin can edit their gym name, logo URL, address, contact info, and working hours. |
| **Membership Plans** | Admin creates and manages unlimited membership plans (name, price, duration). Plans can be deactivated without deleting them. |
| **Member Management** | Admin creates member accounts (username + password provisioned at the admin's desk), edits profiles, assigns plans, flags inactive members, and deletes members with cascading data removal. |
| **Fee Tracking** | Admin manually creates fee records per member (amount, due date, recurring flag). Admin can mark fees as `unpaid`, `paid`, or `overdue`. A receipt number is auto-generated on payment. Basic revenue report by date range. |
| **Announcements** | Admin broadcasts a notification message to all their gym's members in one click. |
| **Member Fitness Logging** | Customer logs workouts (exercise, sets, reps, weight, duration, rest days), diet entries (meal, calories, macros, water), and body measurements / weight with optional photo URL. |
| **Streak & Daily Check-In** | Customer gets a one-click daily check-in that maintains a running streak with milestone badges (7, 30, 100, 365 days). |
| **Analytics Dashboard** | Customer views chart data: weight over time, workout frequency, calorie trend — over the last 30 days. |
| **Unified Deployment** | Monorepo configured for a single Vercel project: Vite/React SPA + Express serverless API on the same domain. |

### Delivered in Phase 2 & Phase 3

All features originally deferred from Phase 1 have been implemented:

| Feature | Phase | Implementation |
| :--- | :---: | :--- |
| Automated overdue fee detection | 2 | Vercel Cron (`api/cron/overdue.js`) + scanner (`markOverdueFees.js`) |
| Email delivery (Nodemailer) | 2 | SMTP pipeline with HTML templates for welcome, overdue & password reset |
| Asset upload (Cloudinary) | 2 | Multer memory storage + Cloudinary API for logos & progress photos |
| JWT refresh token rotation | 2 | 15m access tokens + 30-day rotating `RefreshToken` with MongoDB TTL |
| Physical QR check-in | 2 | Admin generates 24h rotating reception QR; customer validates passcode |
| CSV / PDF export | 2 | PDFKit revenue reports + CSV fee exports with date/status filtering |
| Stripe payment processing | 3 | Checkout sessions + webhooks (`checkout.session.completed`) + test mode |
| Personal Trainer role | 3 | Trainer dashboard, assigned client studio, workout & nutrition prescriptions |
| Multi-branch hierarchy | 3 | Branch management console with facility capacities and manager assignments |
| Progressive Web App | 3 | `manifest.json`, `sw.js` service worker, responsive mobile drawer |

---

## 2. Role & Permissions Matrix

| Feature | Customer (Member) | Personal Trainer | Admin (Gym Owner) | Super Admin (Platform) |
| :--- | :---: | :---: | :---: | :---: |
| Create / manage gym accounts | — | — | — | Full |
| Suspend / enable gym logins | — | — | — | Full |
| Reset gym admin passwords | — | — | — | Full |
| View audit log | — | — | — | View |
| View global platform stats | — | — | — | View |
| Platform settings (currency, billing note) | — | — | — | Full |
| Multi-branch facility management | — | — | Full CRUD | View |
| Gym profile (name, logo, hours) | — | — | Full | — |
| Membership plans | View Own Only | — | Full CRUD | Aggregate Count |
| Member directory | — | Assigned Only | Full CRUD | Aggregate Count |
| Trainer management & roster | — | Own Profile | Full CRUD | — |
| Workout & Diet prescriptions | View Own Prescriptions | Create for Clients | Read-Only Monitor | — |
| Member fitness logging (workouts/diet/weight) | Full CRUD | Read-Only Client Progress | Read-Only Monitor | — |
| Streak & daily check-in (reception QR code) | Own Only (with QR verify) | — | Generate QR Checkin | — |
| Fee records & Stripe checkout | Pay Online / View Own | — | Full CRUD + Export CSV/PDF | Aggregate Revenue |
| Broadcast announcements | Receive Only | — | Create (all members) | — |
| Notifications inbox | View / Mark Read | Receive Alerts | — | — |

---

## 3. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios, Lucide Icons, Code-Splitting (`React.lazy`) |
| **PWA** | Web App Manifest (`manifest.json`), Service Worker (`sw.js`), Offline caching, Installable |
| **Backend** | Node.js 18+, Express 4 (REST API), Morgan (HTTP logging) |
| **Database** | MongoDB Atlas (cloud) or local `mongod`, Mongoose 8 ODM |
| **Auth & Security** | Access Tokens (15m) + Rotating Refresh Tokens (30d TTL), bcryptjs, express-rate-limit, server-side tenant scoping |
| **Payments** | Stripe Checkout Sessions & Webhooks (`stripe`), with simulated fallback testing |
| **File Storage** | Cloudinary API + Multer (memory storage) for member progress photos & gym logos |
| **Email Delivery** | Nodemailer SMTP pipeline with HTML email templates (welcome, overdue reminders, password reset) |
| **Reporting & Utilities** | PDFKit (PDF receipts & revenue reports), QRCode (reception check-in tokens) |
| **Deployment** | Vercel (Serverless Functions for API + Vercel Cron + Static Vite build) |

---

## 4. Architecture Overview

```
Browser (React SPA — code-split via React.lazy)
       |
       |  HTTPS
       v
  Vercel Edge
  +----------------------------------------------+
  |  /api/*      -> serverless Express (api/index) |
  |  /api/cron/* -> scheduled cron (overdue fees)  |
  |  /*          -> static Vite build (frontend)   |
  +----------------------------------------------+
       |                     |                  |
       | Mongoose/TLS        | HTTPS             | HTTPS
       v                     v                  v
  MongoDB Atlas         Stripe API        Cloudinary CDN
  +-----------------+   (Checkout +       (Photo & logo
  | Users           |    Webhooks)         uploads)
  | RefreshTokens   |
  | Admins, Branches|         |
  | Trainers        |         v
  | Customers       |   SMTP Provider
  | Fees            |   (Nodemailer —
  | MembershipPlans |    transactional
  | WorkoutLogs     |    email delivery)
  | DietLogs        |
  | WeightLogs      |
  | Streaks         |
  | Notifications   |
  | AuditLogs       |
  | Settings        |
  +-----------------+
```

**Request lifecycle (Admin route example):**

```
Request
  -> auth middleware (JWT verify)
  -> authorize('admin')         [role check]
  -> attachAdminTenant          [sets req.adminId from TOKEN — never from body/URL]
  -> route handler              [all DB queries filter by { admin: req.adminId }]
  -> Response
```

---

## 5. Prerequisites

- **Node.js 18+** and `npm` — check with `node -v`
- A **MongoDB** database:
  - **Local**: `mongod` running on `localhost:27017`, or
  - **Atlas (recommended)**: free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- _(For deployment)_ A free [Vercel](https://vercel.com) account linked to your GitHub repo

---

## 6. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in every variable (see §9 for full reference):

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=some-long-random-secret-here
JWT_EXPIRES_IN=7d
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=ChangeMe123!
```

Seed the first Super Admin account (run **once only**):

```bash
npm run seed
```

Start the API server (local dev — auto-restart on file change):

```bash
npm run dev
```

Verify it is running:

```bash
curl http://localhost:5000/api/health
# Expected: { "status": "ok" }
```

---

## 7. Frontend Setup

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

It automatically points to `http://localhost:5000/api`. To override, create `frontend/.env`:

```env
VITE_API_URL=http://your-api-host/api
```

---

## 8. First Login Walkthrough

1. Run the database seed:
   ```bash
   npm run seed:demo   # Seeds Super Admin, Demo Gym Admin, Demo Trainer, and Demo Member
   ```
2. Open `http://localhost:5173/login`
3. Test any of the four roles using unified login:
   - **Super Admin**: `superadmin` / `ChangeMe123!` -> `/superadmin` (Platform Governance)
   - **Gym Admin**: `demoadmin` / `Demo1234!` -> `/admin` (Gym Management & Branches)
   - **Personal Trainer**: `demotrainer` / `Demo1234!` -> `/trainer` (Client Studio & Prescriptions)
   - **Member**: `demomember` / `Demo1234!` -> `/customer` (Fitness Tracking & Notifications)

> All four roles share the single `/login` screen. The backend inspects the JWT role
> and the frontend redirects each role to its dedicated dashboard automatically.

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster/db` |
| `JWT_SECRET` | Yes | Signing secret for all tokens (min 32 chars, keep private) | `s3cr3t-l0ng-str1ng` |
| `JWT_EXPIRES_IN` | No | Short-lived access token lifetime (defaults to 15m) | `15m` |
| `PORT` | No | Local API port (defaults to `5000`) | `5000` |
| `SUPER_ADMIN_USERNAME` | Seed only | Initial super admin login username | `superadmin` |
| `SUPER_ADMIN_PASSWORD` | Seed only | Initial password — **change after first login!** | `ChangeMe123!` |
| `SMTP_HOST` | Optional | SMTP server for transactional emails | `smtp.gmail.com` or `smtp.resend.com` |
| `SMTP_PORT` | Optional | SMTP port | `587` or `465` |
| `SMTP_USER` | Optional | SMTP username / API key | `user@example.com` |
| `SMTP_PASS` | Optional | SMTP password / app key | `app-password-here` |
| `EMAIL_FROM` | Optional | Outgoing from header | `Ironline <notifications@ironline.fit>` |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary storage bucket | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary secret | `secret-key-here` |
| `STRIPE_SECRET_KEY` | Optional | Stripe API secret (enables live checkout) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET`| Optional | Stripe webhook signing secret | `whsec_...` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | No | API base URL. Omit on unified Vercel deployment. | `http://localhost:5000/api` |

---

## 10. Project File Structure

```
gym-management-system/            <- monorepo root
├── api/
│   ├── index.js                 <- Vercel serverless entrypoint (wraps Express app)
│   └── cron/
│       └── overdue.js           <- Daily Vercel cron handler for overdue fees
├── vercel.json                   <- Routes /api/* to function, /* to SPA + cron triggers
├── package.json                  <- Root scripts: build, dev:backend, dev:frontend, seed
│
├── backend/
│   ├── app.js                   <- Express app: routes + middleware (no listen)
│   ├── server.js                <- Local dev only — calls app.listen()
│   ├── seed.js                  <- Seeds initial Super Admin + optional --demo data
│   ├── config/
│   │   └── db.js                <- Mongoose connection (cached, serverless-safe)
│   ├── jobs/
│   │   └── markOverdueFees.js   <- Automated overdue fee scanner & reminder dispatcher
│   ├── middleware/
│   │   ├── auth.js              <- JWT verify (protect) + role check (authorize)
│   │   ├── tenant.js            <- attachAdminTenant / attachCustomerTenant
│   │   └── errorHandler.js      <- Global Express error handler
│   ├── models/
│   │   ├── User.js              <- Shared identity (username, email, passwordHash, role)
│   │   ├── RefreshToken.js      <- 30-day rotating tokens with MongoDB TTL expiry
│   │   ├── Admin.js             <- Gym profile & reception check-in token state
│   │   ├── Branch.js            <- Multi-branch facility locations & capacities
│   │   ├── Trainer.js           <- Personal trainer profile & assigned clients
│   │   ├── Customer.js          <- Member profile + tenant scoping (admin ref + index)
│   │   ├── MembershipPlan.js    <- Plan name, price, duration
│   │   ├── Fee.js               <- Invoice record (status: unpaid/paid/overdue)
│   │   ├── WorkoutLog.js        <- Exercise session & trainer prescriptions
│   │   ├── DietLog.js           <- Meal / macro / water log & nutrition prescriptions
│   │   ├── WeightLog.js         <- Body measurement snapshot & photo URL
│   │   ├── Streak.js            <- Daily check-in streak + milestone badges
│   │   ├── Notification.js      <- In-app notification inbox records
│   │   ├── AuditLog.js          <- Super admin action log
│   │   └── Settings.js          <- Singleton platform config document
│   ├── routes/
│   │   ├── authRoutes.js        <- POST /login, POST /refresh, POST /logout, GET /me
│   │   ├── adminRoutes.js       <- All /api/admin/* endpoints (trainers, branches, fees, etc.)
│   │   ├── customerRoutes.js    <- All /api/customer/* endpoints (fitness, notifications, payments)
│   │   ├── trainerRoutes.js     <- All /api/trainer/* endpoints (clients, prescriptions)
│   │   ├── superAdminRoutes.js  <- All /api/superadmin/* endpoints
│   │   ├── uploadRoutes.js      <- Cloudinary multi-part photo & logo upload
│   │   └── webhookRoutes.js     <- Stripe webhook handler & test simulation
│   └── utils/
│       ├── asyncHandler.js      <- Wraps async route handlers
│       ├── mailer.js            <- Nodemailer SMTP pipeline with HTML templates
│       ├── cloudinary.js        <- Cloudinary asset upload helper
│       └── stripe.js            <- Stripe checkout session builder
│
└── frontend/
    ├── index.html               <- PWA meta tags, favicon & manifest links
    ├── vite.config.js           <- Vite build configuration
    ├── tailwind.config.js       <- Custom color palette & typography tokens
    ├── public/
    │   ├── favicon.svg          <- Vector brand mark
    │   ├── manifest.json        <- PWA Web App Manifest
    │   └── sw.js                <- Offline cache service worker
    └── src/
        ├── main.jsx             <- React + BrowserRouter + Service Worker registration
        ├── App.jsx              <- Code-split route tree (React.lazy) across 4 role suites
        ├── index.css            <- Global design system & component utility classes
        ├── api/
        │   └── axios.js         <- Axios instance with auto-refresh token interceptor
        ├── context/
        │   └── AuthContext.jsx  <- Auth state, login/logout, role session management
        ├── components/
        │   ├── DashboardShell.jsx   <- Responsive sidebar nav with mobile hamburger drawer
        │   ├── ProtectedRoute.jsx   <- Role-gated route guard
        │   ├── StatCard.jsx         <- Metric card component
        │   └── Modal.jsx            <- Accessible dialog overlay
        └── pages/
            ├── Login.jsx        <- Unified 4-role authentication portal
            ├── customer/        <- Overview, Workouts, Diet, Weight, Analytics, Notifications, Account
            ├── trainer/         <- TrainerOverview, TrainerClients (Studio & Prescriptions)
            ├── admin/           <- Overview, Customers, Trainers, Branches, Fees, Plans, GymProfile
            └── superadmin/      <- Overview, Admins, AuditLog, Settings
```

---

## 11. Multi-Tenancy — How it is Enforced

Each `Customer` belongs to exactly one `Admin` (gym). Every `Fee`, `WorkoutLog`,
`DietLog`, and `WeightLog` is scoped to that customer. On every admin API request:

1. JWT is verified by `auth` middleware.
2. `attachAdminTenant` resolves `req.adminId` from `req.user` (the token) — **never**
   from the request body, query string, or URL parameter.
3. Every Mongoose query inside the route handler filters by `{ admin: req.adminId }`.

**Result:** An admin cannot read, write, or delete data belonging to a different gym
regardless of what payload they craft. Isolation is enforced at the DB query level,
not hidden at the UI level.

Compound indexes enforce performance at scale:

```js
// Customer.js
customerSchema.index({ admin: 1, name: 1 });

// Fee.js
feeSchema.index({ admin: 1, status: 1, dueDate: 1 });
```

---

## 12. Security Posture

| Concern | Current Mitigation | Production Status |
| :--- | :--- | :--- |
| Brute-force login | express-rate-limit — 20 attempts / 15 min / IP | In-memory instance rate limiter (swap to Redis at high scale) |
| Password storage | bcryptjs (cost factor 12) | Production ready |
| Token security | Short-lived Access Token (15m) + Rotating Refresh Token | Fully implemented via MongoDB TTL rotation (`RefreshToken.js`) |
| Mass-assignment | All routes whitelist specific fields from `req.body` | Enforced across all routes |
| Tenant leakage | Tenant ID sourced exclusively from JWT payload | Server-enforced via `tenant.js` |
| Password reset | Nodemailer transactional email delivery with dev console fallback | Production ready with SMTP credentials |
| Asset safety | Multer in-memory storage buffer sent directly to Cloudinary TLS | No local disk writes on serverless |
| Webhook integrity | Stripe signature validation (`stripe.webhooks.constructEvent`) | Production ready |
| HTTPS | Provided by Vercel edge automatically | Enabled on Vercel |
| Secrets management | `.env` files excluded from git via `.gitignore` | Configured via Vercel Environment Variables |

---

## 13. Deploying to Vercel

This project deploys as a **single Vercel project** — no separate frontend/backend projects required.

### Deployment Steps

1. **Push to GitHub** (repo must be in GitHub / GitLab / Bitbucket).
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) → **Add New → Project**.
   - Select your `gym-management-system` repository.
   - Leave **Root Directory** as `./` (default).
   - Vercel auto-reads `vercel.json`, runs `npm run build` to produce `frontend/dist/`.
3. **Set Environment Variables** in Vercel → Settings → Environment Variables:
   - **Required**: `MONGO_URI`, `JWT_SECRET`
   - **Optional** (for full feature operation): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
4. **Click Deploy**.
   - Frontend: `https://your-project.vercel.app/`
   - API: `https://your-project.vercel.app/api/`

### Caveats

- The login rate limiter keeps counts **in-memory per function instance**. On serverless
  this is approximate — fine for a starting product, but swap to Redis (`@upstash/ratelimit`)
  for strict enforcement at scale.
- Cold starts add ~200–500 ms after idle. The `config/db.js` connection-caching pattern
  means subsequent requests within a warm instance reuse the existing DB connection and are fast.

---

## 14. Production Readiness & Completed Roadmap Capabilities

| Capability | Status | Implementation Details |
| :--- | :---: | :--- |
| **Automated Overdue Detection** | <span style="color:green">Completed</span> | Daily Vercel Cron (`api/cron/overdue.js`) + notification pipeline (`markOverdueFees.js`). |
| **Transactional Email Delivery** | <span style="color:green">Completed</span> | Nodemailer SMTP pipeline with HTML templates for welcome, overdue reminders & password resets. |
| **Asset / Photo Upload** | <span style="color:green">Completed</span> | Cloudinary + Multer memory upload for gym logos and member progress photos. |
| **JWT Rotation & Refresh** | <span style="color:green">Completed</span> | 15m short-lived access tokens + 30-day MongoDB TTL RefreshToken rotation + server-side logout. |
| **Physical Reception QR Check-In** | <span style="color:green">Completed</span> | Admin generates 24h rotating reception QR; customer validates passcode on check-in. |
| **Fee Accounting Export** | <span style="color:green">Completed</span> | One-click CSV and PDF report export with date & status filtering. |
| **Self-Service Stripe Payments** | <span style="color:green">Completed</span> | Stripe Checkout sessions + webhooks (`checkout.session.completed`) + simulated test mode fallback. |
| **Personal Trainer / Staff Role** | <span style="color:green">Completed</span> | Dedicated Trainer role, assigned client studio, workout & nutrition prescription pipeline. |
| **Multi-Branch Facility Hierarchy** | <span style="color:green">Completed</span> | Branch management console, multi-location manager assignments, and facility capacities. |
| **Progressive Web App (PWA)** | <span style="color:green">Completed</span> | Web app manifest (`manifest.json`), service worker shell caching (`sw.js`), and mobile installability. |

---

## 15. Development Roadmap

See the full phased roadmap, feature breakdown, and sprint priorities in **[ROADMAP.md](./ROADMAP.md)**.

---

*Ironline — Built with Node.js, Express, React, MongoDB.*
