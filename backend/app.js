const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

// ── Startup environment validation ─────────────────────────────────────────
// Fail fast with a clear message rather than silently starting with broken
// auth, missing Stripe keys, etc. that only blow up on the first real request.
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[startup] Server cannot start safely. Set these in your .env file.');
  process.exit(1);
}

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const publicRoutes = require('./routes/publicRoutes');
const gymBillingRoutes = require('./routes/gymBillingRoutes');

const app = express();

// Vercel (and most PaaS hosts) sit behind a reverse proxy. Without this,
// express-rate-limit can't correctly read the client IP from
// X-Forwarded-For and throws on every request.
app.set('trust proxy', 1);

// BUG #4 FIX: CLIENT_ORIGIN must be set — never fall back to wildcard '*'
// in production. If it's missing we refuse to start rather than silently
// opening the API to every origin.
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

// Security headers: must be applied before CORS and routes.
// Sets X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, etc.
// contentSecurityPolicy is disabled here because the frontend is served
// separately (Vite dev server / Vercel) — it manages its own CSP.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, uptime monitors, same-domain requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        (process.env.VERCEL && origin.endsWith('.vercel.app'))
      ) {
        return callback(null, true);
      }
      return callback(null, allowedOrigins[0] || true);
    },
    credentials: true,
  })
);

app.use(cookieParser());

// PERF FIX: gzip/brotli-compress every JSON response. This was missing
// entirely — every API response (the full customers list, fee history,
// audit logs, etc.) was going out uncompressed. Response bodies text-heavy
// like JSON typically shrink 70-80% with compression, which directly
// cuts page load time on slower connections. Safe to place before the
// webhook route: this only compresses OUTGOING responses, it has no
// effect on the raw request body Stripe's signature check needs.
app.use(compression());

// Webhooks must be mounted before global express.json() to preserve raw body for Stripe signature verification
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Login is a common brute-force target; keep it tightly rate-limited.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', loginLimiter);

// Change-password is also sensitive — limit to 10 attempts per 15 min.
const changePasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/change-password', changePasswordLimiter);

// Super Admin actions carry platform-wide power - rate-limit generously but
// firmly, on top of the audit logging done inside the route handlers.
const superAdminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/superadmin', superAdminLimiter);

// /api/public is unauthenticated by design (install-time branding lookups
// happen before anyone logs in) and slugs are shareable, guessable-by-design
// links — not a vulnerability, but worth a light limiter since it's the one
// open door in this API.
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
app.use('/api/public', publicLimiter);

// Friendly response for anyone (or any uptime monitor) hitting the bare
// domain directly — the real app only ever calls routes under /api/...
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Ironline API is running. See /api/health.' }));

app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[dbState] || 'unknown';
  res.json({ status: 'ok', time: new Date().toISOString(), db: dbStatus });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', gymBillingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
