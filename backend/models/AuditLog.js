const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "admin.suspend", "fee.mark_paid"
    targetType: { type: String, default: '' },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// PERF FIX: the super-admin audit log view always queries
// `.sort({ created_at: -1 }).limit(200)` with no other filter. Without an
// index on created_at, Mongo has to scan and sort the WHOLE collection in
// memory on every single page load, and that only gets worse as the log
// grows — exactly the kind of query that feels fine in testing and then
// gets slow in production. Descending because that matches the query's
// sort order.
auditLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);      if (!origin) return callback(null, true);
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

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
