import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { resolveBranding } from '../theme/branding.js';
import { MEMBER_BLOCKS, ADMIN_BLOCKS } from './registry.js';
import { resolveDashboardBlocks } from './dashboards.js';
import BlockBoundary from '../components/BlockBoundary.jsx';

export default function DashboardRenderer({ app = 'member' }) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { settings } = resolveBranding(user?.role, tenant, user);

  const preset = settings?.dashboard || 'classic';
  const blockIds = resolveDashboardBlocks(app, preset);
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
        <div
          key={`stat-group-${statGroup.join('-')}`}
          className={`mb-6 grid gap-4 ${statGroup.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}
        >
          {statGroup.map((statId) => {
            const Comp = blockRegistry[statId];
            return Comp ? (
              <BlockBoundary key={statId} name={statId}>
                <Comp />
              </BlockBoundary>
            ) : null;
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
        <div key={`chart-group-${chartGroup.join('-')}`} className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {chartGroup.map((chartId) => {
            const Comp = blockRegistry[chartId];
            return Comp ? (
              <BlockBoundary key={chartId} name={chartId}>
                <Comp />
              </BlockBoundary>
            ) : null;
          })}
        </div>
      );
      continue;
    }

    // Individual block
    const Component = blockRegistry[id];
    if (Component) {
      elements.push(
        <div key={id} className={preset === 'compact' ? 'mb-4' : 'mb-8'}>
          <BlockBoundary name={id}>
            <Component />
          </BlockBoundary>
        </div>
      );
    }
    i++;
  }

  return <div className={`dashboard-container dashboard--${preset} page-enter`}>{elements}</div>;
}
