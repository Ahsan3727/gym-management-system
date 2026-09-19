import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function TotalMembersBlock() {
  const { analytics } = useAdminDashboard();
  const total = (analytics?.activeVsInactive?.active || 0) + (analytics?.activeVsInactive?.inactive || 0);

  return (
    <StatCard
      icon="briefcase"
      label="Total Members"
      value={total}
      sub={`${analytics?.activeVsInactive?.inactive ?? 0} inactive`}
    />
  );
}
