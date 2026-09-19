import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function ActiveMembersBlock() {
  const { analytics } = useAdminDashboard();
  const total = (analytics?.activeVsInactive?.active || 0) + (analytics?.activeVsInactive?.inactive || 0);
  const activeRate = total > 0 ? Math.round(((analytics?.activeVsInactive?.active || 0) / total) * 100) : 100;

  return (
    <StatCard
      icon="user"
      hi
      label="Active Members"
      value={analytics?.activeVsInactive?.active ?? 0}
      accent="text-iron"
      sub={`${activeRate}% of total roster`}
    />
  );
}
