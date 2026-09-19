import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function RevenueBlock() {
  const { analytics } = useAdminDashboard();
  const collectionRate = Math.round((analytics?.feeCollectionRate || 0) * 100);

  return (
    <StatCard
      icon="card"
      label="Collected Revenue"
      value={`Rs. ${(analytics?.totalRevenue || 0).toLocaleString()}`}
      accent="text-iron"
      sub={`${collectionRate}% fee collection`}
    />
  );
}
