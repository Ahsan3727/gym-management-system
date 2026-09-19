import React from 'react';
import StatCard from '../../components/StatCard.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function MembershipBlock() {
  const { membership } = useMemberDashboard();

  return (
    <StatCard
      icon="card"
      label="Membership"
      value={membership?.plan?.planName || 'No plan'}
      sub={membership?.nextDue ? `Due ${new Date(membership.nextDue.dueDate).toLocaleDateString()}` : 'No fee due'}
    />
  );
}
