import React from 'react';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function PlanDistributionBlock() {
  const { analytics } = useAdminDashboard();
  const totalMembers = (analytics?.activeVsInactive?.active || 0) + (analytics?.activeVsInactive?.inactive || 0);

  return (
    <div className="panel p-6">
      <h3 className="font-semibold text-ink mb-1">Plan Distribution</h3>
      <p className="text-xs text-steel mb-4">Members across pricing packages</p>

      <div className="space-y-3">
        {(analytics?.planDistribution || []).map((p, idx) => {
          const pct = totalMembers > 0 ? Math.round((p.count / totalMembers) * 100) : 0;
          return (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-ink truncate">{p.name}</span>
                <span className="text-steel font-mono">
                  {p.count} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-iron"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {(!analytics?.planDistribution || analytics.planDistribution.length === 0) && (
          <div className="text-xs text-steel py-4 text-center">No plan data yet.</div>
        )}
      </div>
    </div>
  );
}
