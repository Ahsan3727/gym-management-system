import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function PendingRevenueBlock() {
  const { analytics } = useAdminDashboard();
  const pending = analytics?.pendingRevenue || 0;

  return (
    <StatCard
      icon="bell"
      label="Pending / Overdue"
      value={`Rs. ${pending.toLocaleString()}`}
      accent={pending > 0 ? 'text-danger' : 'text-ink'}
      sub={pending > 0 ? 'Action required' : 'All fees settled'}
    />
  );
}
