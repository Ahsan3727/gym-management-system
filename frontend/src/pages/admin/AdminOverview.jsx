import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminOverview() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Announcement state
  const [announcement, setAnnouncement] = useState('');
  const [announcing, setAnnouncing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/profile'),
      api.get('/admin/analytics'),
    ])
      .then(([p, a]) => {
        setProfile(p.data);
        setAnalytics(a.data);
      })
      .catch(() => setError('Could not load your dashboard analytics.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSendAnnouncement(e) {
    e.preventDefault();
    if (!announcement.trim()) return;
    setAnnouncing(true);
    try {
      const res = await api.post('/admin/announcements', { message: announcement.trim() });
      showToast(res.data?.message || 'Announcement broadcast to all members!', 'success');
      setAnnouncement('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to broadcast announcement.', 'error');
    } finally {
      setAnnouncing(false);
    }
  }

  if (loading) return <div className="text-sm text-steel">Loading gym analytics…</div>;
  if (error) return <div className="text-sm text-ember-dark">{error}</div>;

  const totalMembers = (analytics?.activeVsInactive?.active || 0) + (analytics?.activeVsInactive?.inactive || 0);
  const activeRate = totalMembers > 0 ? Math.round(((analytics?.activeVsInactive?.active || 0) / totalMembers) * 100) : 100;
  const collectionRate = Math.round((analytics?.feeCollectionRate || 0) * 100);

  // Determine max revenue for scaling bar chart
  const maxMonthlyRevenue = Math.max(...(analytics?.revenueByMonth || []).map((r) => r.revenue), 100);
  const maxMemberGrowth = Math.max(...(analytics?.memberGrowthByMonth || []).map((m) => m.count), 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{profile?.gymName || 'Gym Operations'}</h1>
          <p className="mt-1 text-sm text-steel">Real-time performance analytics, revenue collection, and member growth.</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon="user"
          hi
          label="Active Members"
          value={analytics?.activeVsInactive?.active ?? 0}
          accent="text-iron"
          sub={`${activeRate}% of total roster`}
        />
        <StatCard
          icon="briefcase"
          label="Total Members"
          value={totalMembers}
          sub={`${analytics?.activeVsInactive?.inactive ?? 0} inactive`}
        />
        <StatCard
          icon="card"
          label="Collected Revenue"
          value={`$${(analytics?.totalRevenue || 0).toLocaleString()}`}
          accent="text-iron"
          sub={`${collectionRate}% fee collection`}
        />
        <StatCard
          icon="bell"
          label="Pending / Overdue"
          value={`$${(analytics?.pendingRevenue || 0).toLocaleString()}`}
          accent={(analytics?.pendingRevenue || 0) > 0 ? 'text-ember-dark' : 'text-ink'}
          sub={(analytics?.pendingRevenue || 0) > 0 ? 'Action required' : 'All fees settled'}
        />
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Month Chart */}
        <div className="panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">Revenue Trend (Last 6 Months)</h3>
              <p className="text-xs text-steel">Monthly membership dues collected</p>
            </div>
            <span className="rounded-lg bg-iron/10 px-2.5 py-1 text-xs font-semibold text-iron">
              ${(analytics?.totalRevenue || 0).toLocaleString()} Total
            </span>
          </div>

          <div className="flex h-56 items-end gap-3 pt-6 pb-2 border-b border-ink/10">
            {(analytics?.revenueByMonth || []).map((item, idx) => {
              const heightPercent = Math.max(Math.round((item.revenue / maxMonthlyRevenue) * 100), 4);
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg bg-ink px-2 py-1 text-[11px] font-mono text-paper shadow-md z-10 whitespace-nowrap">
                    ${item.revenue.toLocaleString()}
                  </div>
                  {/* Bar */}
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
            <span>Hover bars for exact dollar totals</span>
          </div>
        </div>

        {/* Member Growth Chart */}
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
      </div>

      {/* Plans & Announcement Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <div className="panel p-6 lg:col-span-1">
          <h3 className="font-semibold text-ink mb-1">Plan Distribution</h3>
          <p className="text-xs text-steel mb-4">Members across pricing packages</p>

          <div className="space-y-3">
            {(analytics?.planDistribution || []).map((p, idx) => {
              const pct = totalMembers > 0 ? Math.round((p.count / totalMembers) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-ink truncate">{p.name}</span>
                    <span className="text-steel font-mono">{p.count} ({pct}%)</span>
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

        {/* Announcement Broadcast Panel */}
        <div className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Broadcast Gym Announcement</h3>
            <span className="text-xs text-steel">Instant in-app alert to all active members</span>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-3">
            <textarea
              rows={4}
              className="field-input resize-none"
              placeholder="e.g. Schedule update: Gym opens at 6:00 AM this bank holiday. New spin class starting Tuesday!"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              required
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-steel">Members receive this on their dashboard alerts immediately.</span>
              <button
                type="submit"
                disabled={announcing || !announcement.trim()}
                className="btn-primary text-xs"
              >
                <svg className="icon !h-4 !w-4"><use href="#i-bell" /></svg>
                {announcing ? 'Broadcasting…' : 'Broadcast to Members'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
