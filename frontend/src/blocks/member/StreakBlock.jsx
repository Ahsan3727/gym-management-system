import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function StreakBlock() {
  const { streak } = useMemberDashboard();
  return (
    <StatCard
      icon="flame"
      hi
      label="Current streak"
      value={streak ? `${streak.currentStreak}d` : '—'}
      accent="text-ember"
    />
  );
}
