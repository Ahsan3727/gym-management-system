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

module.exports = mongoose.model('AuditLog', auditLogSchema);
