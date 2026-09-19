import React from 'react';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function MemberGrowthBlock() {
  const { analytics } = useAdminDashboard();
  const totalMembers = (analytics?.activeVsInactive?.active || 0) + (analytics?.activeVsInactive?.inactive || 0);
  const maxMemberGrowth = Math.max(...(analytics?.memberGrowthByMonth || []).map((m) => m.count), 5);

  return (
    <div className="panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink">New Member Acquisitions</h3>
          <p className="text-xs text-steel">Monthly member onboarding velocity</p>
        </div>
        <span className="rounded-lg bg-chalk/15 px-2.5 py-1 text-xs font-semibold text-chalk-dark">
          {totalMembers} Total Roster
        </span>
      </div>

      <div className="flex h-56 items-end gap-3 pt-6 pb-2 border-b border-ink/10">
        {(analytics?.memberGrowthByMonth || []).map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.count / maxMemberGrowth) * 100), 6);
          return (
            <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg bg-ink px-2 py-1 text-[11px] font-mono text-paper shadow-md z-10 whitespace-nowrap">
                {item.count} new member{item.count === 1 ? '' : 's'}
              </div>
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-ember to-ember-dark group-hover:brightness-110 transition-all cursor-pointer"
              />
              <span className="mt-2 text-[10px] font-medium text-steel text-center truncate w-full">
                {item.month.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-steel">
        <span>Monthly Onboarding</span>
        <span>New members registered</span>
      </div>
    </div>
  );
}
