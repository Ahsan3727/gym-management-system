import React from 'react';

/**
 * `accent`, `label`, `value`, `sub` are unchanged from Phase 0 — every
 * existing call site (CustomerOverview, AdminOverview, TrainerOverview,
 * SuperAdminOverview) keeps working with zero edits.
 *
 * New, optional:
 *   - `icon`: IconSprite id shown above the label
 *   - `hi`: true adds Apex's radial-glow "highlight" treatment, for the one
 *     stat on a page that should draw the eye (e.g. current streak)
 */
export default function StatCard({ label, value, sub, accent = 'text-ink', icon, hi = false }) {
  return (
    <div className={`stat-card ${hi ? 'stat-card--hi' : ''}`}>
      {icon && (
        <svg className="icon relative mb-2.5 !h-5 !w-5 text-steel">
          <use href={`#i-${icon}`} />
        </svg>
      )}
      <div className="relative text-xs font-semibold uppercase tracking-wide text-steel">{label}</div>
      <div className={`stat-number relative mt-1.5 ${accent}`}>{value}</div>
      {sub && <div className="relative mt-1 text-xs text-steel">{sub}</div>}
    </div>
  );
}
