import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function BillingBannerBlock() {
  const { billingSummary } = useAdminDashboard();

  if (!billingSummary || billingSummary.totalOutstanding <= 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl p-4 border mb-6 ${
        billingSummary.isSeverelyOverdue
          ? 'bg-danger/10 border-danger/30 text-danger'
          : billingSummary.overdueCount > 0
          ? 'bg-danger/5 border-danger/20 text-danger'
          : 'bg-iron/5 border-iron/20 text-iron'
      }`}
    >
      <div className="flex items-center gap-3">
        <svg className="icon !h-5 !w-5 shrink-0">
          <use href="#i-card" />
        </svg>
        <div>
          <div className="text-sm font-bold">
            {billingSummary.isSeverelyOverdue
              ? '⚠️ Critical: Platform Subscription Severely Overdue'
              : billingSummary.overdueCount > 0
              ? '⚠️ Platform Subscription Overdue'
              : 'Platform Subscription Dues Pending'}
          </div>
          <div className="text-xs text-steel mt-0.5">
            Outstanding balance: <strong className="text-ink">Rs. {billingSummary.totalOutstanding.toLocaleString()}</strong>.
            {billingSummary.isSeverelyOverdue
              ? ' Your account is past the grace period. Please clear this to maintain full service.'
              : ' Please review payment details and submit your reference.'}
          </div>
        </div>
      </div>
      <Link
        to="/admin/billing"
        className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-paper hover:bg-ink/90 transition-colors"
      >
        View & Pay Dues →
      </Link>
    </div>
  );
}
