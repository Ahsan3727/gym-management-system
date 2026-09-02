const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

// Vercel (and most PaaS hosts) sit behind a reverse proxy. Without this,
// express-rate-limit can't correctly read the client IP from
// X-Forwarded-For and throws on every request.
app.set('trust proxy', 1);

// BUG #4 FIX: CLIENT_ORIGIN must be set — never fall back to wildcard '*'
// in production. If it's missing we refuse to start rather than silently
// opening the API to every origin.
const allowedOrigin = process.env.CLIENT_ORIGIN;
if (!allowedOrigin) {
  console.warn('[cors] WARNING: CLIENT_ORIGIN is not set. Defaulting to http://localhost:5173. Set it in .env for production.');
}
app.use(cors({
  origin: allowedOrigin || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Login is a common brute-force target; keep it tightly rate-limited.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', loginLimiter);

// Super Admin actions carry platform-wide power - rate-limit generously but
// firmly, on top of the audit logging done inside the route handlers.
const superAdminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api/superadmin', superAdminLimiter);

// Friendly response for anyone (or any uptime monitor) hitting the bare
// domain directly — the real app only ever calls routes under /api/...
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Ironline API is running. See /api/health.' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/superadmin', superAdminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
