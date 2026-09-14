# 🧠 BRAIN.md — Master Architectural Specification & File-by-File Index

> **Project Name:** Ironline Gym Management System  
> **Repository:** `Ahsan3727/gym-management-system`  
> **Architecture:** Multi-Tenant SaaS, White-Labeled PWA, Offline-First Check-In, Role-Based Access Control (RBAC)  
> **Tech Stack:** Node.js, Express, MongoDB (Mongoose), React (Vite), TailwindCSS, Chart.js, Service Worker  

---

## 📑 Table of Contents
1. [System Overview & High-Level Architecture](#1-system-overview--high-level-architecture)
2. [Role-Based Access Control (4 Tiers)](#2-role-based-access-control-4-tiers)
3. [Multi-Tenant Data Isolation & White-Labeling](#3-multi-tenant-data-isolation--white-labeling)
4. [Smart Check-In & Streak Retention Engine](#4-smart-check-in--streak-retention-engine)
5. [Database Models & Schemas Reference](#5-database-models--schemas-reference)
6. [Backend File-by-File Directory Guide](#6-backend-file-by-file-directory-guide)
7. [Frontend File-by-File Directory Guide](#7-frontend-file-by-file-directory-guide)
8. [Root & Documentation Files](#8-root--documentation-files)
9. [API Endpoints Catalog](#9-api-endpoints-catalog)
10. [Automated Testing Suite](#10-automated-testing-suite)
11. [Environment Variables & Deployment Configuration](#11-environment-variables--deployment-configuration)

---

## 1. System Overview & High-Level Architecture

Ironline is a commercial-grade Gym Management System built for multi-tenant deployment. It operates simultaneously on three distinct levels:

1. **Platform Owner (SuperAdmin)**: Manages gym tenant accounts, monitors platform subscription billing, tracks audit logs, and configures global settings.
2. **Gym Owners (Admin) & Staff (Trainers)**: Operates the individual gym: member onboarding with photo IDs, monthly fee collection in PKR, trainer delegations, workout/diet plan creation, and front-desk attendance monitoring.
3. **Gym Members (Customers)**: Uses an installable mobile Progressive Web App (PWA) branded with their gym's name and logo to check in, track daily diet and calories, record weight loss, follow workout splits, and maintain daily workout streaks.

```
                      ┌──────────────────────────────────────┐
                      │        SuperAdmin (Platform)         │
                      └──────────────────┬───────────────────┘
                                         │ Platform Fees & Audit
                      ┌──────────────────▼───────────────────┐
                      │    Gym Owner / Admin (Tenant Level)  │
                      └─────────┬──────────────────┬─────────┘
                                │                  │
         Trainer Assignment     │                  │ Member Fee Invoices
                                │                  │ & Reception QR
                      ┌─────────▼────────┐  ┌──────▼─────────┐
                      │  Personal Coach  │  │   Gym Member   │
                      │ (Trainer Studio) │  │  (Branded PWA) │
                      └──────────────────┘  └────────────────┘
```

---

## 2. Role-Based Access Control (4 Tiers)

Every user in the system belongs to the `User` collection and is assigned exactly one role:

| Role String | Description | Default Landing Route | Access Scope |
| :--- | :--- | :--- | :--- |
| `super_admin` | Platform owner | `/superadmin` | Global platform access, all gym accounts, billing, settings. |
| `admin` | Gym Owner / Manager | `/admin` | Scoped strictly to their own gym (`adminDoc._id`). |
| `trainer` | Floor Coach / PT | `/trainer` | Scoped to assigned clients within their employer's gym. |
| `customer` | Gym Lifter / Member | `/customer` | Scoped to personal profile, workouts, diet, weight, fees. |

---

## 3. Multi-Tenant Data Isolation & White-Labeling

### Data Isolation
- Gyms are partitioned by the `admin` ObjectId.
- Every member (`Customer`), trainer (`Trainer`), fee invoice (`Fee`), and check-in record (`Attendance`) carries an `admin` foreign key referencing the `Admin` model.
- Backend middleware (`attachAdminTenant`, `attachCustomerTenant`) guarantees that queries cannot leak data across different gyms.

### White-Labeling & Branded PWA
- Each gym receives a unique URL slug (e.g. `/g/titan-fitness`).
- Dynamic manifest generator (`GET /api/public/manifest/:slug`) injects the gym's name, theme color, and logo into the PWA manifest.
- Topbar and desktop sidebar dynamically show the gym's emblem and uppercase title (`DashboardShell.jsx`).
- Universal login page automatically recognizes tenant branding if visiting via a gym link.

---

## 4. Smart Check-In & Streak Retention Engine

### Offline-First Architecture
1. **Camera Scan**: Members point native camera or in-app camera at the Reception Desk QR code (`/customer/checkin?token=...&gym=:slug`).
2. **Instant 0-Click Verification**: If logged in, attendance is instantly recorded with no forms or pin entry.
3. **Basement Dead-Zone Queueing**: If cellular service is unavailable, `offlineCheckin.js` queues the scan in `localStorage` and optimistically grants entry.
4. **Auto-Sync on Reconnect**: Listens for the browser `online` event; dispatches the visit to `POST /api/customer/checkin` the millisecond signal returns.

### Midnight Calendar Rollover
- Reception QR tokens expire at `23:59:59.999` (midnight) of each calendar day.
- `GET /checkin-qr` automatically generates the next day's token when date changes.

### 1-Day-Per-Week Rest Day Allowance
- Consecutive daily visits increment `currentStreak += 1`.
- If a member skips 1 day (`diffDays === 2`), the system checks `lastRestDayUsed`:
  - If $\ge 7$ days since last rest day: **streak continues unharmed** and `lastRestDayUsed` is updated.
  - If rest day was already exhausted or member skips 2+ consecutive days: streak resets to 1.
- Milestone Badges: **7-Day Bronze**, **30-Day Silver**, **100-Day Gold**, **365-Day Diamond Legend**.

---

## 5. Database Models & Schemas Reference

All models are located in `backend/models/`:

| Model File | Primary Fields | Purpose |
| :--- | :--- | :--- |
| `User.js` | `username`, `passwordHash`, `role`, `admin`, `isActive`, `refreshToken` | Authentication credentials for all 4 roles. |
| `Admin.js` | `user`, `gymName`, `slug`, `gymLogoUrl`, `contactEmail`, `phone`, `address`, `operatingHours`, `themeColor`, `isSuspended` | Official gym profile and tenant branding configuration. |
| `Customer.js` | `user`, `admin`, `name`, `phone`, `emergencyContact`, `monthlyFee`, `initialFee`, `fitnessGoals`, `assignedTrainer` | Detailed member profile, contact info, and coaching link. |
| `Trainer.js` | `user`, `admin`, `name`, `phone`, `specialization`, `assignedCustomers` | Personal trainer profile and client roster. |
| `Attendance.js` | `customer`, `admin`, `date`, `timestamp`, `method` (`qr_scan`, `qr_offline_sync`, `manual`, `backup_code`) | Daily check-in log entries. |
| `Streak.js` | `customer`, `currentStreak`, `longestStreak`, `lastCheckin`, `badges`, `lastRestDayUsed`, `restDaysUsed` | Gamification streak calculation and rest-day history. |
| `Fee.js` | `customer`, `admin`, `amount`, `dueDate`, `paymentDate`, `paymentMethod` (`cash`, `bank_transfer`, `card`, `mobile_wallet`), `status` (`paid`, `unpaid`, `overdue`), `notes` | Member subscription fee invoices and payment records. |
| `GymBillingFee.js` | `admin`, `invoiceNumber`, `amount`, `dueDate`, `status`, `proofOfPaymentUrl`, `paymentReference` | Platform subscription billing fees charged to gym owners. |
| `WorkoutLog.js` | `customer`, `admin`, `title`, `exercises` (name, sets, reps, weight), `date`, `notes` | Workout routines and completed exercise logs. |
| `DietLog.js` | `customer`, `admin`, `date`, `meals` (type, items, calories, protein, carbs, fats), `waterLiters` | Daily nutrition, macronutrient, and hydration records. |
| `WeightLog.js` | `customer`, `admin`, `date`, `weightKg`, `bodyFatPercentage`, `measurements` (chest, waist, arms), `photoUrl` | Transformation tracking and weigh-in records. |
| `Session.js` | `trainer`, `customer`, `admin`, `title`, `scheduledAt`, `durationMinutes`, `status` (`scheduled`, `completed`, `cancelled`) | 1-on-1 personal training appointments. |
| `Branch.js` | `admin`, `name`, `address`, `phone`, `managerName` | Multi-branch gym facility locations. |
| `MembershipPlan.js` | `admin`, `name`, `price`, `durationMonths`, `features` | Legacy / custom plan definitions. |
| `Notification.js` | `user`, `type`, `title`, `message`, `isRead`, `createdAt` | In-app notification messages. |
| `AuditLog.js` | `actor` (User), `action`, `targetType`, `targetId`, `ipAddress`, `details` | SuperAdmin audit trail of sensitive system actions. |
| `Settings.js` | `bankInstructions`, `severeOverdueDays`, `updatedBy` | Platform-wide billing and bank transfer instructions. |
| `RefreshToken.js` | `user`, `tokenHash`, `expiresAt` | Hashed refresh tokens for secure JWT session rotation. |

---

## 6. Backend File-by-File Directory Guide

### Core Server Configuration
- `backend/server.js`: Development entry point. Loads `.env`, validates variables via `validateEnv()`, connects to MongoDB, and binds HTTP port (default: 5000).
- `backend/app.js`: Master Express configuration. Mounts security headers (`helmet`), `cors` with origin validation, `compression` (gzip/brotli), `cookie-parser`, `morgan` logger, route-level rate limiters (`loginLimiter`, `publicLimiter`, `superAdminLimiter`), API route mounting, and central error handlers.
- `backend/config/db.js`: Mongoose connection manager with reconnection logic.
- `backend/seed.js`: Database seeder creating SuperAdmin, Demo Gym Admin, customers, trainers, fee records, attendance logs, and streaks for local development.

### Serverless & Cron Jobs
- `backend/api/index.js`: Vercel serverless function wrapper exporting Express `app`.
- `backend/api/cron/overdue.js`: Midnight cron endpoint protected by `CRON_SECRET`. Invokes `markOverdueFees()`.
- `backend/jobs/markOverdueFees.js`: Scans unpaid member fees and platform fees past due date. Flips status to `overdue`, creates in-app notifications, and dispatches reminder emails via Nodemailer.

### Middleware (`backend/middleware/`)
- `auth.js`: 
  - `protect`: Extracts JWT from `Authorization: Bearer <token>` or HTTP-only cookie, verifies signature, and populates `req.user`.
  - `authorize(...roles)`: RBAC guard checking if `req.user.role` is permitted.
- `tenant.js`:
  - `attachAdminTenant`: Resolves `req.adminDoc` from `Admin` collection for admin users.
  - `attachCustomerTenant`: Resolves `req.customerDoc` and validates that the member's gym is not suspended.
  - `attachTrainerTenant`: Resolves `req.trainerDoc` and gym context for trainers.
- `validate.js`: Generic Zod schema validation middleware. Mutates `req.body` with parsed output and returns 400 on schema violation.
- `errorHandler.js`:
  - `notFound`: 404 handler for unmatched routes.
  - `errorHandler`: Global catch-all returning structured JSON error payloads.

### Route Handlers (`backend/routes/`)
- `authRoutes.js`: Authentication controller.
  - `POST /login`: Authenticates username/password. Universal candidate fallback resolves members, trainers, gym owners, or superadmin seamlessly.
  - `POST /refresh`: Rotates JWT refresh tokens.
  - `POST /logout`: Invalidates refresh token.
  - `GET /me`: Returns active session profile with `gymName`, `gymLogoUrl`, and `gymSlug`.
  - `PUT /change-password`: Self-service password change.
- `adminRoutes.js`: Complete gym owner suite.
  - Customers CRUD, manual password resets, bulk member actions.
  - Fee invoice generation, manual payment recording, 1-click bulk invoicing.
  - Reception QR code generation (`GET/POST /checkin-qr`), manual attendance recording.
  - Trainer management, branch locations, gym profile updates.
- `customerRoutes.js`: Member portal controller.
  - `GET /overview`: Dashboard summary (streak, fee status, assigned workouts).
  - `POST /checkin`: 0-click and offline-synced check-in processing.
  - Workouts, diet/water logging, body weight tracking, notification feeds.
- `trainerRoutes.js`: Personal trainer studio.
  - Assigned client rosters, client workout and diet plan creation, 1-on-1 session scheduling.
- `superAdminRoutes.js`: Platform administrator suite.
  - Gym account suspension/activation, platform fee management, audit log inspection, platform settings.
- `gymBillingRoutes.js`: Gym owner platform billing management.
  - View platform invoices, bank deposit instructions, upload payment proof slips.
- `publicRoutes.js`: Public pre-authentication endpoints.
  - `GET /manifest/:slug`: Dynamic PWA manifest.
  - `GET /branding/:slug`: Dynamic header styling & logo lookup.
  - `GET /manifest/staff`: Staff portal PWA manifest.
- `uploadRoutes.js`: Image upload handler using Multer memory storage and Cloudinary integration.
- `webhookRoutes.js`: Webhook listener for external payment processors.

### Utilities (`backend/utils/`)
- `asyncHandler.js`: Higher-order wrapper catching async errors and forwarding to Express `next()`.
- `generateToken.js`: Signs JWT access tokens (15m expiry) and refresh tokens (7d expiry).
- `slugify.js`: Generates clean, URL-safe lowercase slugs with diacritic stripping.
- `env.js`: Startup environment validator asserting existence of critical keys (`JWT_SECRET`, `MONGO_URI`).
- `cloudinary.js`: Cloudinary image upload utility with automatic base64 data-URI fallback for local dev.
- `cloudinaryTransform.js`: On-the-fly image thumbnail transformation URLs.
- `mailer.js`: Nodemailer email dispatcher with graceful failure logging.
- `emailTemplates.js`: Pre-formatted HTML templates for password resets and overdue fee notices.
- `installQr.js`: Generates SVG/PNG QR codes for gym install links and desk check-ins.
- `stripe.js`: Stripe SDK initialization.

---

## 7. Frontend File-by-File Directory Guide

### Bootstrapping & Routing
- `frontend/src/main.jsx`: Application bootstrap. Intercepts URL paths (`/g/:slug`, `?gym=:slug`) to resolve tenant branding *before* initial React render. Registers Service Worker (`sw.js`).
- `frontend/src/App.jsx`: Master routing table. Wraps routes in `Suspense` and `ProtectedRoute`. Defines lazy-loaded page chunks via `lazyWithReload`. Maps `/` to `RoleHome`.
- `frontend/src/index.css`: Design system stylesheet. Custom CSS variables (ember, obsidian, slate), glassmorphic utilities, custom scrollbars, and dark/light mode overrides.
- `frontend/vite.config.js`: Vite build configuration with React plugin and dev proxy (`/api` $\rightarrow$ `http://localhost:5000`).

### State & Context Providers (`frontend/src/context/`)
- `AuthContext.jsx`: Manages `user` state, `gym_token`, `gym_user`, `login()`, `logout()`, and `refreshMe()`.
- `TenantContext.jsx`: Exposes currently active gym branding (`tenant` object with `gymName`, `gymLogoUrl`, `slug`). Persists to `localStorage.ironline_tenant`.
- `ThemeContext.jsx`: Dark/light mode theme toggle persisting to `localStorage.theme`.
- `ToastContext.jsx`: Toast dispatching system for success/error alerts.

### Shared UI Components (`frontend/src/components/`)
- `DashboardShell.jsx`: Master dashboard layout. Renders collapsible desktop sidebar and sticky mobile topbar. Displays dynamic Gym Name and emblem.
- `ProtectedRoute.jsx`: Authentication and role guard. Redirects unauthorized visitors to `/login` while preserving destination query parameters.
- `ThemeToggle.jsx`: Sun/moon theme toggle switch.
- `Modal.jsx`: Accessible modal dialog with backdrop blur and escape-to-close.
- `StatCard.jsx`: Metric display card with trend badges.
- `ListCard.jsx` & `ListRow.jsx`: Standardized table/list presentation cards.
- `SegmentedControl.jsx`: Tactile pill tab switcher.
- `IconSprite.jsx`: Central SVG icon symbol definition sheet.
- `ErrorBoundary.jsx`: React error boundary preventing white-screen crashes.
- `Timeline.jsx`: Chronological event and audit log list.

### Page Components (`frontend/src/pages/`)
- `Login.jsx`: Universal single sign-in page. No bottom mode-switching links. Supports all 4 roles with automatic redirection.
- **Admin Suite (`admin/`)**:
  - `AdminOverview.jsx`: Revenue metrics, attendance counts, active member KPIs.
  - `Attendance.jsx`: Real-time reception attendance register with search and manual check-in.
  - `Customers.jsx`: Member directory, photo IDs, add/edit member drawers, password reset.
  - `Fees.jsx`: Monthly fee management, cash/bank/card logging, 1-click bulk invoice generator.
  - `GymProfile.jsx`: Gym branding settings, logo uploader, printable reception sign generator.
  - `Trainers.jsx`: Coach roster, client assignments, contact details.
  - `Branches.jsx`: Multi-branch gym locations.
  - `Plans.jsx`: Membership plan definitions.
  - `AdminPlatformBilling.jsx`: Gym owner platform fee invoice review and payment proof slip upload.
- **Member Suite (`customer/`)**:
  - `CustomerOverview.jsx`: Member home hub: streak flame, assigned workouts, fee status, quick stats.
  - `Checkin.jsx`: Front-desk check-in handler (0-click URL check-in, in-app camera scanner, offline queue badge, rest-day celebration alert).
  - `Workouts.jsx`: Daily workout routines, sets, reps, weight history.
  - `Diet.jsx`: Meal logging, caloric target progress, macronutrient bars, water tracker.
  - `Weight.jsx`: Weigh-in logs, BMI calculator, body fat tracking, progress photo archive.
  - `Analytics.jsx`: Attendance frequency and personal workout stats.
  - `Notifications.jsx`: In-app notification feed.
  - `Account.jsx`: Member profile settings, emergency contact review, password change.
- **Trainer Suite (`trainer/`)**:
  - `TrainerOverview.jsx`: Coach dashboard, today's client sessions.
  - `TrainerClients.jsx`: Client roster with direct workout and diet plan editing drawers.
  - `TrainerSchedule.jsx`: 1-on-1 personal training appointment calendar.
- **SuperAdmin Suite (`superadmin/`)**:
  - `SuperAdminOverview.jsx`: Platform-wide revenue, active gym count, MRR.
  - `Admins.jsx`: Master list of gym accounts with suspension/activation toggles.
  - `SuperAdminBilling.jsx`: Platform invoice generator and payment proof review.
  - `AuditLog.jsx`: Security audit log viewer.
  - `Settings.jsx`: Bank account deposit instructions and grace period configuration.

### Frontend Utilities (`frontend/src/utils/`)
- `offlineCheckin.js`: Offline check-in queue in `localStorage`, background auto-sync via `window.addEventListener('online')`, optimistic streak updates.
- `lazyWithReload.js`: React lazy wrapper that auto-refreshes the page if a chunk fails to load after a new deployment.
- `chartTheme.js`: Chart.js global color configurations adapting to dark/light theme.

---

## 8. Root & Documentation Files

- `vercel.json`: Vercel production deployment manifest. Configures frontend static build (`frontend/dist`), serverless backend (`api/index.js`), and midnight cron (`api/cron/overdue.js`).
- `docs/GYM_OWNER_MANUAL.md`: Complete operating handbook for gym owners in GitHub markdown.
- `docs/Ironline_Gym_Owners_Guide.html`: Interactive, executive HTML documentation site with 1-click print-to-PDF styles.
- `docs/Ironline_Presentation_Demo.html`: Interactive marketing demo showcasing the member mobile app, streak retention engine, and gym management previews.
- `scripts/backfill-slugs.js`: Migration script ensuring all existing gym accounts have unique URL slugs.
- `scripts/generate-icons.js`: PWA icon generation script creating 192px and 512px assets.
- `scripts/reset-password.js`: Command-line utility to reset any user's password directly in MongoDB.

---

## 9. API Endpoints Catalog

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Universal login (all 4 roles).
- `POST /api/auth/refresh` — Refresh access token.
- `POST /api/auth/logout` — Invalidate refresh token.
- `GET /api/auth/me` — Get authenticated user & tenant profile.
- `PUT /api/auth/change-password` — Change current user's password.

### Admin Suite (`/api/admin`)
- `GET /api/admin/overview` — Dashboard summary metrics.
- `GET/POST /api/admin/customers` — List / Create gym members.
- `PUT/DELETE /api/admin/customers/:id` — Update / Delete member.
- `POST /api/admin/customers/:id/reset-password` — Reset member password.
- `GET/POST /api/admin/fees` — List / Record member fee payments.
- `POST /api/admin/fees/bulk-generate` — 1-Click monthly invoice generator.
- `GET/POST /api/admin/attendance` — View attendance register / Manual check-in.
- `GET/POST /api/admin/checkin-qr` — Fetch / Rotate daily reception QR sign token.
- `GET/PUT /api/admin/profile` — View / Update gym profile & operating hours.
- `GET/POST /api/admin/trainers` — List / Register personal trainers.
- `GET/POST /api/admin/branches` — List / Create gym branches.

### Customer Suite (`/api/customer`)
- `GET /api/customer/overview` — Member dashboard hub.
- `POST /api/customer/checkin` — Check-in verification (online & offline-synced).
- `GET/POST /api/customer/workouts` — View routines / Log workout sets.
- `GET/POST /api/customer/diet` — View meal blueprint / Log daily nutrition.
- `GET/POST /api/customer/weight` — View charts / Log body weigh-in.
- `GET /api/customer/notifications` — In-app notification messages.
- `GET/PUT /api/customer/account` — Profile details & password update.

### Trainer Suite (`/api/trainer`)
- `GET /api/trainer/overview` — Coach dashboard.
- `GET /api/trainer/clients` — Assigned client roster.
- `PUT /api/trainer/clients/:id/workout` — Assign workout plan to client.
- `PUT /api/trainer/clients/:id/diet` — Assign diet plan to client.
- `GET/POST /api/trainer/sessions` — View / Schedule 1-on-1 PT sessions.

### SuperAdmin Suite (`/api/superadmin`)
- `GET /api/superadmin/overview` — Platform KPI overview.
- `GET /api/superadmin/admins` — Master gym accounts list.
- `PATCH /api/superadmin/admins/:id/suspend` — Suspend / Activate gym account.
- `GET/POST /api/superadmin/billing` — Platform invoices & payment approval.
- `GET /api/superadmin/audit-log` — Security audit trail.
- `GET/PUT /api/superadmin/settings` — Platform bank instructions & settings.

### Public & Uploads
- `GET /api/public/manifest/:slug` — Dynamic PWA manifest.
- `GET /api/public/branding/:slug` — Gym branding lookup.
- `POST /api/upload/gym-logo` — Admin gym emblem upload.
- `POST /api/upload/progress-photo` — Member progress photo upload.

---

## 10. Automated Testing Suite

The project includes **126 automated unit tests** across 35 test suites in `backend/tests/`:

```bash
# Run complete test suite
npx cross-env NODE_ENV=test node --test tests/**/*.test.js
```

### Test Coverage Highlights:
- `auth.login.test.js`: Disambiguation across same-username accounts, temp password masking, email resolution, universal login fallback.
- `jwt.test.js`: JWT signing, role encoding, token tamper detection, secret validation.
- `streak.test.js`: Streak increment, duplicate same-day scan prevention, 1-day/week rest day protection, 7-day cooldown reset, milestone badge awards.
- `checkinOffline.test.js`: Offline timestamp validation, historical attendance recording.
- `fee.test.js` & `memberMonthlyFee.test.js`: Fee status computation (`paid`, `due_soon`, `overdue`), Zod schema validation, PKR currency math.
- `gymBilling.test.js`: Platform subscription fee calculations, severe overdue grace periods.
- `middleware.test.js`: Zod schema coercion, field-level error formats.
- `validation.test.js`: Schema validation for customers, trainers, passwords, bulk actions.

---

## 11. Environment Variables & Deployment Configuration

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/ironline_gym
JWT_SECRET=super_secret_jwt_key_must_be_32_characters_long
CLIENT_ORIGIN=http://localhost:5173

# Optional: Cloud Storage for Logos & Progress Photos
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Email Notifications for Overdue Notices
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass

# Production Cron Trigger Protection
CRON_SECRET=production_cron_secret_key
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=/api
```

---

*BRAIN.md — Maintained for complete architectural understanding and developer reference.*
