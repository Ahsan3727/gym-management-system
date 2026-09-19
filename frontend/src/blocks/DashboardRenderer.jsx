import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { resolveBranding } from '../theme/branding.js';
import { MEMBER_BLOCKS, ADMIN_BLOCKS } from './registry.js';
import { resolveDashboardBlocks } from './dashboards.js';

export default function DashboardRenderer({ app = 'member' }) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { settings } = resolveBranding(user?.role, tenant, user);

  const blockIds = resolveDashboardBlocks(app, settings?.dashboard);
  const blockRegistry = app === 'member' ? MEMBER_BLOCKS : ADMIN_BLOCKS;

  const isStatBlock = (id) =>
    ['streak', 'longestStreak', 'latestWeight', 'membership', 'activeMembers', 'totalMembers', 'revenue', 'pendingRevenue'].includes(id);

  const isChartBlock = (id) =>
    ['revenueChart', 'memberGrowth'].includes(id);

  const elements = [];
  let i = 0;

  while (i < blockIds.length) {
    const id = blockIds[i];

    // Check for grouping 2 to 4 consecutive stat blocks
    if (isStatBlock(id)) {
      const statGroup = [];
      while (i < blockIds.length && isStatBlock(blockIds[i]) && statGroup.length < 4) {
        statGroup.push(blockIds[i]);
        i++;
      }
      elements.push(
        <div key={`stat-group-${statGroup.join('-')}`} className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statGroup.map((statId) => {
            const Comp = blockRegistry[statId];
            return Comp ? <Comp key={statId} /> : null;
          })}
        </div>
      );
      continue;
    }

    // Check for grouping 2 consecutive chart blocks
    if (isChartBlock(id)) {
      const chartGroup = [];
      while (i < blockIds.length && isChartBlock(blockIds[i]) && chartGroup.length < 2) {
        chartGroup.push(blockIds[i]);
        i++;
      }
      elements.push(
        <div key={`chart-group-${chartGroup.join('-')}`} className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {chartGroup.map((chartId) => {
            const Comp = blockRegistry[chartId];
            return Comp ? <Comp key={chartId} /> : null;
          })}
        </div>
      );
      continue;
    }

    // Individual block
    const Component = blockRegistry[id];
    if (Component) {
      elements.push(
        <div key={id} className="mb-8">
          <Component />
        </div>
      );
    }
    i++;
  }

  return <div className="dashboard-container">{elements}</div>;
}
