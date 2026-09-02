# 🗺️ Ironline SaaS — Master Product & Engineering Roadmap

```
  Current Version: v1.0.0 (Production Ready)  │  Architecture: Monorepo Fullstack (Vercel Unified)
  Target Release:  v2.0.0 (Q4 2026)           │  Scope: Commercialization, Operations & Scale
```

---

## 📑 Table of Contents

1. [Roadmap Overview & Release Timeline](#1-roadmap-overview--release-timeline)
2. [Feature Prioritization Matrix (MoSCoW)](#2-feature-prioritization-matrix-moscow)
3. [Phase 1: Automated Payments & Invoicing (v1.1)](#-phase-1-automated-payments--invoicing-v11)
4. [Phase 2: Attendance & Front-Desk Operations (v1.2)](#-phase-2-attendance--front-desk-operations-v12)
5. [Phase 3: Staff Hierarchy & Class Booking (v1.3)](#-phase-3-staff-hierarchy--class-booking-v13)
6. [Phase 4: Executive BI Analytics & Cloud Media (v1.4)](#-phase-4-executive-bi-analytics--cloud-media-v14)
7. [Phase 5: Mobile App (PWA) & AI Coaching (v2.0)](#-phase-5-mobile-app-pwa--ai-coaching-v20)
8. [Technical & Security Architecture Standards](#-technical--security-architecture-standards)

---

## 1. Roadmap Overview & Release Timeline

```
  2026 Q3 (Weeks 1 - 3)        2026 Q4 (Weeks 4 - 7)        2026 Q4 (Weeks 8 - 10)       2027 Q1 (Weeks 11 - 12+)
  ┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
  │      VERSION 1.1      │    │      VERSION 1.2      │    │      VERSION 1.3      │    │      VERSION 2.0      │
  │ • Stripe / Razorpay   │───>│ • QR Attendance       │───>│ • Staff/Trainer Tier  │───>│ • Mobile PWA App      │
  │ • PDF Invoices        │    │ • Auto-Overdue Cron   │    │ • Group Class Booking │    │ • AI Fitness Coach    │
  │ • Email/SMS Alerts    │    │ • Live Gym Occupancy  │    │ • Executive BI Dash   │    │ • Multi-Branch Chains │
  └───────────────────────┘    └───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

---

## 2. Feature Prioritization Matrix (MoSCoW)

| Priority Tier | Feature Module | Target Release | Effort | Business Value |
| :--- | :--- | :---: | :---: | :---: |
| **Must Have (P0)** | Online Payment Gateway (Stripe) | v1.1 | 🟢 Medium | 🔴 Critical (Revenue) |
| **Must Have (P0)** | Downloadable PDF Invoices & Receipts | v1.1 | 🟢 Low | 🔴 Critical (Compliance) |
| **Must Have (P0)** | Automated Fee Cron (Auto-Overdue) | v1.1 | 🟢 Low | 🟡 High (Automation) |
| **Should Have (P1)** | QR Code Member Attendance Check-In | v1.2 | 🟡 Medium | 🟡 High (Daily Utility) |
| **Should Have (P1)** | Email & SMS Notifications (Resend/Twilio) | v1.2 | 🟢 Low | 🟡 High (Retention) |
| **Should Have (P1)** | Trainer / Staff Role (`trainer`) | v1.3 | 🟡 Medium | 🟡 High (Delegation) |
| **Could Have (P2)** | Group Class Scheduling & Seat Booking | v1.3 | 🔴 High | 🟢 Medium (Upsell) |
| **Could Have (P2)** | Executive BI & MRR Financial Dashboard | v1.4 | 🟡 Medium | 🟡 High (Insights) |
| **Could Have (P2)** | Cloudinary / S3 Progress Photo Gallery | v1.4 | 🟢 Low | 🟢 Medium (Engagement) |
| **Future (P3)** | Progressive Web App (PWA) Installable | v2.0 | 🟡 Medium | 🟡 High (Mobile UX) |
| **Future (P3)** | AI Workout & Diet Generation | v2.0 | 🔴 High | 🟢 Medium (Innovation) |
| **Future (P3)** | Multi-Branch Gym Franchise System | v2.1 | 🔴 High | 🔴 Critical (Enterprise) |

---

## 💳 Phase 1: Automated Payments & Invoicing (v1.1)
> **Goal:** Enable hands-free online membership payments and legal receipt generation.  
> **Timeline:** Weeks 1 – 3  
> **Target Release:** `v1.1.0`

### 1.1 Stripe & Razorpay Checkout Integration
* **User Story:** As a member, I want to pay my gym fees online using my credit card, Apple Pay, or Google Pay so that I don't have to carry cash to the front desk.
* **Architecture & Deliverables:**
  * [ ] **New Route:** `POST /api/customer/fees/:id/checkout-session` (Generates a hosted payment link).
  * [ ] **Webhook Handler:** `POST /api/payments/webhook` (Listens to `checkout.session.completed`).
  * [ ] **Data Model Updates:** Add `stripeSessionId`, `paymentGateway`, and `paymentMethod` to `Fee.js`.
  * [ ] **Frontend:** "Pay Now" button on `Customer/Account.jsx` and `Customer/Fees.jsx`.
* **Dependencies:** `stripe` npm package, Stripe Webhook Secret.

### 1.2 PDF Receipt & Tax Invoice Generator
* **User Story:** As a member, I want to download an official invoice receipt as a PDF for tax and employer fitness allowance reimbursement.
* **Architecture & Deliverables:**
  * [ ] **New Route:** `GET /api/customer/fees/:id/receipt` (Streams a generated PDF).
  * [ ] **PDF Layout:** Includes Gym Name, Logo, Address, Tax/GST Number, Receipt Number, Customer Name, and "PAID" badge.
  * [ ] **Frontend:** "Download Receipt" icon button in Fee History tables.
* **Dependencies:** `pdfkit` or `@react-pdf/renderer`.

### 1.3 Automated Overdue Cron Scheduler
* **User Story:** As a gym owner, I want unpaid fees to automatically flag as overdue the day after they expire without manual review.
* **Architecture & Deliverables:**
  * [ ] **Worker Script:** `backend/jobs/feeCheckCron.js` running daily at 00:00 UTC.
  * [ ] **Vercel Cron:** Configured in `vercel.json` under `"crons"`.
  * [ ] **Action:** Queries `Fee.find({ status: 'unpaid', dueDate: { $lt: new Date() } })` and flips status to `overdue`.

---

## 📲 Phase 2: Attendance & Front-Desk Operations (v1.2)
> **Goal:** Streamline the daily check-in process and eliminate front-desk bottlenecks.  
> **Timeline:** Weeks 4 – 5  
> **Target Release:** `v1.2.0`

### 2.1 Dynamic Member QR Code
* **User Story:** As a member, I want a digital membership card on my phone so I can enter the gym quickly.
* **Architecture & Deliverables:**
  * [ ] **Member UI:** Dynamic QR card on `CustomerOverview.jsx` embedding a signed token: `{ customerId, gymId, timestamp }`.
  * [ ] **Security:** QR codes regenerate every 60 seconds to prevent members from sharing screenshots.
* **Dependencies:** `qrcode.react`.

### 2.2 Front-Desk High-Speed Scanner
* **User Story:** As a gym receptionist, I want to scan member QR codes via a webcam or USB barcode reader to verify entry in under 1 second.
* **Architecture & Deliverables:**
  * [ ] **New Route:** `POST /api/admin/check-in` (Validates member status).
  * [ ] **Validation Rules:**
    * 🟢 Active plan + no overdue fees ➔ **Approved** (Logs attendance, bumps daily streak).
    * 🔴 Overdue fee or inactive plan ➔ **Alert** (Prompts desk to collect payment).
  * [ ] **Frontend Scanner:** Dedicated page at `/admin/check-in` utilizing HTML5 camera feeds.
* **Dependencies:** `html5-qrcode`.

### 2.3 Live Gym Occupancy Counter
* **User Story:** As a member or owner, I want to see how crowded the gym is in real-time.
* **Architecture & Deliverables:**
  * [ ] **New Model:** `Attendance.js` (`customer`, `admin`, `checkInTime`, `checkOutTime`).
  * [ ] **Widget:** Live badge: *"Currently in Gym: 28 Members"* with 2-hour automatic checkout timeout.

---

## 👥 Phase 3: Staff Hierarchy & Class Booking (v1.3)
> **Goal:** Support trainers, staff delegation, and group fitness classes.  
> **Timeline:** Weeks 6 – 7  
> **Target Release:** `v1.3.0`

### 3.1 Trainer Role & Delegated Client Management
* **User Story:** As a gym owner, I want personal trainers to manage their own clients' workout plans without seeing gym financials.
* **Architecture & Deliverables:**
  * [ ] **Role Expansion:** Add `'trainer'` to `User.js` role enum.
  * [ ] **Permissions:** Trainers can read/write workouts and diets for assigned members; zero access to fee reports or platform settings.
  * [ ] **Owner Controls:** Owner can assign/reassign members to trainers from `Admin/Customers.jsx`.

### 3.2 Group Class Scheduling & Reservation System
* **User Story:** As a member, I want to reserve a spot in tomorrow's 7:00 PM HIIT class before it fills up.
* **Architecture & Deliverables:**
  * [ ] **New Model:** `ClassSession.js` (`title`, `trainer`, `capacity`, `startTime`, `durationMinutes`, `bookedMembers`).
  * [ ] **Admin UI:** `/admin/classes` to publish weekly class schedules.
  * [ ] **Member UI:** `/customer/classes` with 1-click "Book Spot" button and instant capacity counter (e.g. *12/15 Spots Left*).
  * [ ] **Waitlist Logic:** Automatic queue promotion if an attendee cancels.

---

## 📊 Phase 4: Executive BI Analytics & Cloud Media (v1.4)
> **Goal:** Give gym owners enterprise-grade business insights and provide cloud media storage.  
> **Timeline:** Weeks 8 – 10  
> **Target Release:** `v1.4.0`

### 4.1 Gym Financial Health & Retention Analytics
* **User Story:** As a gym owner, I need to know my Monthly Recurring Revenue (MRR) and which members are at risk of quitting.
* **Architecture & Deliverables:**
  * [ ] **MRR & Cashflow Projections:** Real-time calculation of active recurring memberships vs. one-time fees.
  * [ ] **Churn Warning System:** Automatic flag for members with zero attendance in the last 14 days.
  * [ ] **Export Engine:** Download full member rosters, payment history, and attendance records as `.csv` or `.xlsx`.
* **Dependencies:** `exceljs` or `json2csv`.

### 4.2 Secure Cloud Storage for Progress Photos
* **User Story:** As a member, I want to upload private progress photos so I can visually see my fitness transformation over time.
* **Architecture & Deliverables:**
  * [ ] **Storage Provider:** Direct signed upload to Cloudinary or AWS S3 (no heavy binaries stored in MongoDB).
  * [ ] **Security:** Photos are private and scoped strictly to the authenticated user.
  * [ ] **Comparison Tool:** Interactive slider widget comparing "Before" vs. "After" photos on `Customer/Weight.jsx`.

---

## 📱 Phase 5: Mobile App (PWA) & AI Coaching (v2.0)
> **Goal:** Provide native mobile app convenience and cutting-edge AI workout intelligence.  
> **Timeline:** Weeks 11 – 12+  
> **Target Release:** `v2.0.0`

### 5.1 Progressive Web App (PWA) Native Mobile Installation
* **User Story:** As a member, I want to install Ironline on my iPhone or Android home screen with an app icon.
* **Architecture & Deliverables:**
  * [ ] **Web Manifest:** Custom app icons, splash screens, and theme color `#14171A`.
  * [ ] **Service Worker:** Offline asset caching for instant dashboard load times on poor gym WiFi.
  * [ ] **Push Notifications:** Web Push API for workout reminders and payment confirmations.

### 5.2 AI-Powered Workout & Nutrition Assistant
* **User Story:** As a member, I want AI to generate a personalized workout split and meal plan based on my logged weight trends.
* **Architecture & Deliverables:**
  * [ ] **AI Integration:** Google Gemini 1.5 Flash API endpoint at `/api/customer/ai/generate-plan`.
  * [ ] **Context Injection:** Feeds the member's current weight, goals, and recent workout logs into the prompt.
  * [ ] **Output:** Structured JSON routine directly importable into the member's workout calendar.

---

## 🛡️ Technical & Security Architecture Standards

To maintain system integrity as new modules are developed, all pull requests must conform to these architectural standards:

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           SECURITY MANDATES                             │
  ├───────────────────────────────────┬─────────────────────────────────────┤
  │ 1. Zero Cross-Tenant Leakage      │ Every database query touching gym   │
  │                                   │ data MUST filter by req.adminId.    │
  ├───────────────────────────────────┼─────────────────────────────────────┤
  │ 2. PCI DSS Compliance             │ No payment credentials may touch    │
  │                                   │ our database or server logs.        │
  ├───────────────────────────────────┼─────────────────────────────────────┤
  │ 3. Strict Mass-Assignment Guards  │ Never use Object.assign(doc, body). │
  │                                   │ Always whitelist explicit fields.   │
  ├───────────────────────────────────┼─────────────────────────────────────┤
  │ 4. Unified Vercel Footprint       │ Keep frontend and API under one     │
  │                                   │ Vercel domain to eliminate CORS.    │
  └───────────────────────────────────┴─────────────────────────────────────┘
```

---

## 🚀 Getting Started on Phase 1

The recommended immediate development sequence:
1. **Module 1.1:** Setup Stripe account & build `/api/payments/checkout-session`.
2. **Module 1.2:** Implement `pdfkit` receipt generator at `/api/customer/fees/:id/receipt`.
3. **Module 1.3:** Configure Resend email templates for welcome and payment emails.
