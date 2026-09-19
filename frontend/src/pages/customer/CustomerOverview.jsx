import React from 'react';
import { MemberDashboardProvider, useMemberDashboard } from '../../blocks/useMemberDashboardData.jsx';
import DashboardRenderer from '../../blocks/DashboardRenderer.jsx';

function CustomerOverviewContent() {
  const { loading, error } = useMemberDashboard();

  if (loading) return <div className="text-sm text-steel">Loading your dashboard…</div>;
  if (error) return <div className="mb-6 text-sm text-danger">{error}</div>;

  return <DashboardRenderer app="member" />;
}

export default function CustomerOverview() {
  return (
    <MemberDashboardProvider>
      <CustomerOverviewContent />
    </MemberDashboardProvider>
  );
}
