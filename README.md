# Ironline — Gym Management System

A multi-tenant gym management platform with three roles:

- **Customer** — logs workouts, diet & water, weight/body measurements, keeps a
  daily check-in streak, views their fee status and membership.
- **Admin** (gym owner) — manages their own customers, fees, membership plans,
  gym profile, and can send announcements. Every admin only ever sees their
  own gym's data — this is enforced on the server, not just hidden in the UI.
- **Super Admin** — creates and manages gym (admin) accounts, suspends/enables
  gyms, resets passwords, views platform-wide stats and an audit log.

Stack: **React (Vite) + Tailwind** on the frontend, **Node/Express + MongoDB
(Mongoose) + JWT** on the backend.

---

## 1. Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either:
  - a local MongoDB install (`mongod` running on `localhost:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended if you don't want to install MongoDB locally)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set:

- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` — credentials for the first
  platform admin account (change the password after first login)

Create the first Super Admin account:

```bash
npm run seed
```

Start the API:

```bash
npm run dev      # with auto-restart (nodemon)
# or
npm start
```

The API runs at `http://localhost:5000` by default. Check it's up:

```bash
curl http://localhost:5000/api/health
```

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. It talks to the API at
`http://localhost:5000/api` by default — to change this, create
`frontend/.env` with:

```
VITE_API_URL=http://your-api-host/api
```

## 4. First login

Go to `http://localhost:5173/login` and log in with the Super Admin
credentials you set in `.env`. From there:

1. Go to **Gym accounts → Add gym** to create your first gym (admin) account.
2. Log out, log in with that gym's admin credentials.
3. Go to **Customers → Add customer** to create member accounts.
4. Log out, log in as a customer to see the member-side dashboard.

Every account (customer, admin, or super admin) uses the same login screen —
the backend routes them to the right dashboard based on their role.

---

## How multi-tenancy is enforced

Each customer belongs to exactly one gym (`Customer.admin`), and every fee,
workout log, diet log, etc. is scoped to that customer. On every admin
request, the server resolves the calling admin's own gym from their login
token (`middleware/tenant.js`) and filters *every* query by it — the gym ID
is never taken from the request body, query string, or URL, so one gym
admin cannot read or modify another gym's data no matter what they send.

## Project structure

```
backend/
  config/db.js            MongoDB connection (connection-caching, serverless-safe)
  models/                 Mongoose schemas (User, Admin, Customer, Fee, ...)
  middleware/              auth (JWT), tenant scoping, error handling
  routes/                  authRoutes, adminRoutes, customerRoutes, superAdminRoutes
  seed.js                  creates the first Super Admin
  app.js                   Express app (routes, middleware) — no listen()
  server.js                LOCAL DEV entrypoint only (calls app.listen)
  api/index.js             VERCEL entrypoint (serverless function)
  vercel.json              routes all requests to api/index.js

frontend/
  src/
    api/axios.js            API client (attaches JWT automatically)
    context/AuthContext.jsx login/logout state
    components/              shared UI (dashboard shell, modal, stat card)
    pages/customer/          member dashboard pages
    pages/admin/              gym owner dashboard pages
    pages/superadmin/         platform admin dashboard pages
  vercel.json                SPA rewrite so React Router routes don't 404
```

## Notes & next steps

- Passwords are hashed with bcrypt; JWTs expire after 7 days by default
  (`JWT_EXPIRES_IN` in `.env`).
- The login endpoint is rate-limited (20 attempts / 15 min per IP) to slow
  down brute-force attempts.
- Fee status (`unpaid` → `overdue`) is currently set manually from the admin
  Fees page. A production deployment would want a scheduled job that flips
  unpaid fees past their due date to `overdue` automatically and emails/SMS's
  reminders — the `Notification` model and `notificationPrefs` on `Customer`
  are already in place for that.
- This is a starting platform, not a finished commercial product: before
  handling real customer payments or personal data, add HTTPS, a real email
  provider, environment-specific secrets management, and payment processing
  (e.g. Stripe) rather than manual fee status toggling.

## Deploying to Vercel

This is a MERN app (Express + MongoDB backend, Vite/React frontend), so it
deploys as **two separate Vercel projects** pointing at the same GitHub repo
— one with its Root Directory set to `backend`, one set to `frontend`. This
is the standard, most reliable way to run a Node/Express API + a Vite SPA
on Vercel (a single Express `app.listen()` process can't run on Vercel as-is,
since Vercel functions are serverless — `backend/api/index.js` and
`backend/vercel.json` already handle that conversion for you).

**0. Push this project to a GitHub repo first** (Vercel deploys from git).

**1. Database** — create a free [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster if you don't have a reachable MongoDB already (a `localhost` URI
won't work from Vercel's servers). Get its connection string.

**2. Deploy the backend**
- New Project on [vercel.com](https://vercel.com) → import the repo →
  set **Root Directory** to `backend`.
- Framework preset: "Other" (no build step needed).
- Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `CLIENT_ORIGIN` (fill this in after step 3, once you know the frontend
  URL — you can redeploy to update it).
- Deploy. Note the resulting URL, e.g. `https://gym-backend.vercel.app`.
- Run `npm run seed` **locally** (pointed at the same `MONGO_URI` via your
  local `.env`) to create the first Super Admin — Vercel functions are
  request-driven and aren't meant for one-off scripts like this.

**3. Deploy the frontend**
- New Project → same repo → set **Root Directory** to `frontend`.
- Framework preset: Vite (auto-detected). Build command `npm run build`,
  output directory `dist` (Vercel fills these in automatically).
- Add Environment Variable `VITE_API_URL` = `https://gym-backend.vercel.app/api`
  (your backend URL from step 2, with `/api` appended).
- Deploy. Note this URL, e.g. `https://gym-app.vercel.app`.

**4. Close the loop** — go back to the backend project's Environment
Variables and set `CLIENT_ORIGIN` to the frontend URL from step 3, then
redeploy the backend (Vercel → Deployments → ⋯ → Redeploy) so CORS allows it.

**Caveats worth knowing:**
- The login rate limiter (`express-rate-limit`) keeps its counts in memory
  per function instance, so limits are approximate on serverless (fine for
  this app's purposes, just not as exact as on a single long-running server).
- Cold starts add some latency to the first request after idle; subsequent
  requests reuse the cached DB connection (`config/db.js`) and are fast.
