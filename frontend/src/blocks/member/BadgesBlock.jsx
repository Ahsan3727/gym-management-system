import React from 'react';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function BadgesBlock() {
  const { streak } = useMemberDashboard();

  if (!streak?.badges || streak.badges.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-2 text-sm font-medium text-steel">Badges</div>
      <div className="flex flex-wrap gap-2">
        {streak.badges.map((b) => (
          <span key={b} className="chip border-chalk/20 bg-chalk/10 text-chalk-dark">
            <svg className="icon !h-3.5 !w-3.5">
              <use href="#i-check-circle" />
            </svg>
            {b.replace('-', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
