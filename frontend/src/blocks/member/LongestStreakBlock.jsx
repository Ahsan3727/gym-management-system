import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function LongestStreakBlock() {
  const { streak } = useMemberDashboard();
  return (
    <StatCard
      icon="trend"
      label="Longest streak"
      value={streak ? `${streak.longestStreak}d` : '—'}
    />
  );
}
