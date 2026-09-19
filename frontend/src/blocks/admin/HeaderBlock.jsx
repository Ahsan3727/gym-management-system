import React from 'react';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function HeaderBlock() {
  const { profile } = useAdminDashboard();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink page-header">
          {profile?.gymName || 'Gym Operations'}
        </h1>
        <p className="mt-1 text-sm text-steel">
          Real-time performance analytics, revenue collection, and member growth.
        </p>
      </div>
    </div>
  );
}
