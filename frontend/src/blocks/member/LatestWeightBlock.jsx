import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function LatestWeightBlock() {
  const { weightLogs } = useMemberDashboard();
  const latestWeight = weightLogs[0];
  return (
    <StatCard
      icon="drop"
      label="Latest weight"
      value={latestWeight ? `${latestWeight.weightKg} kg` : '—'}
    />
  );
}
