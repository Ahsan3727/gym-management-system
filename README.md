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

## Deploying to Vercel (Unified Single Deployment)

This project is configured for **a single Vercel deployment** where both the Vite/React frontend and the Express serverless backend run under **one single domain and one Vercel project** — eliminating CORS issues, double URLs, and dual project management.

### Deployment Steps:

1. **Push your code to GitHub** (if not already done).
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) → **Add New...** → **Project**.
   - Select your `gym-management-system` repository.
   - Leave **Root Directory** as `./` (default root).
   - Vercel will automatically read `vercel.json`, use `npm run build` for the frontend, and deploy `/api` as serverless functions.
3. **Set Environment Variables in Vercel**:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random secret string.
   - `JWT_EXPIRES_IN`: `7d`
4. **Click Deploy**!
   - Your frontend will be available at `https://your-project.vercel.app/`.
   - Your API will be available on the same domain at `https://your-project.vercel.app/api/`.
   - No CORS configuration or dual-project linking needed!

**Caveats worth knowing:**
- The login rate limiter (`express-rate-limit`) keeps its counts in memory
  per function instance, so limits are approximate on serverless (fine for
  this app's purposes, just not as exact as on a single long-running server).
- Cold starts add some latency to the first request after idle; subsequent
  requests reuse the cached DB connection (`config/db.js`) and are fast.
