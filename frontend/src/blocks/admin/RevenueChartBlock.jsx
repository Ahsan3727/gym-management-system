import React from 'react';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function RevenueChartBlock() {
  const { analytics } = useAdminDashboard();
  const maxMonthlyRevenue = Math.max(...(analytics?.revenueByMonth || []).map((r) => r.revenue), 100);

  return (
    <div className="panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink">Revenue Trend (Last 6 Months)</h3>
          <p className="text-xs text-steel">Monthly membership dues collected</p>
        </div>
        <span className="rounded-lg bg-iron/10 px-2.5 py-1 text-xs font-semibold text-iron">
          Rs. ${(analytics?.totalRevenue || 0).toLocaleString()} Total
        </span>
      </div>

      <div className="flex h-56 items-end gap-3 pt-6 pb-2 border-b border-ink/10">
        {(analytics?.revenueByMonth || []).map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.revenue / maxMonthlyRevenue) * 100), 4);
          return (
            <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg bg-ink px-2 py-1 text-[11px] font-mono text-paper shadow-md z-10 whitespace-nowrap">
                Rs. {item.revenue.toLocaleString()}
              </div>
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-iron to-iron/75 group-hover:brightness-110 transition-all cursor-pointer"
              />
              <span className="mt-2 text-[10px] font-medium text-steel text-center truncate w-full">
                {item.month.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-steel">
        <span>6-Month View</span>
        <span>Hover bars for exact amounts (PKR)</span>
      </div>
    </div>
  );
}
