import React from 'react';
import { AdminDashboardProvider, useAdminDashboard } from '../../blocks/useAdminDashboardData.jsx';
import DashboardRenderer from '../../blocks/DashboardRenderer.jsx';

function AdminOverviewContent() {
  const { loading, error } = useAdminDashboard();

  if (loading) return <div className="text-sm text-steel">Loading gym analytics…</div>;
  if (error) return <div className="mb-6 text-sm text-danger">{error}</div>;

  return <DashboardRenderer app="admin" />;
}

export default function AdminOverview() {
  return (
    <AdminDashboardProvider>
      <AdminOverviewContent />
    </AdminDashboardProvider>
  );
}
