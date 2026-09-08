import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import ListCard from '../../components/ListCard.jsx';

export default function SuperAdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/superadmin/analytics')
      .then((res) => setAnalytics(res.data))
      .catch(() => setError('Could not load platform analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-steel">Loading platform analytics…</div>;
  if (error) return <div className="text-sm text-ember-dark">{error}</div>;

  const maxRevenue = Math.max(...(analytics?.monthlyRevenue || []).map((r) => r.revenue), 100);
  const maxGymGrowth = Math.max(...(analytics?.monthlyGymGrowth || []).map((g) => g.count), 2);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Platform Executive Overview</h1>
        <p className="mt-1 text-sm text-steel">Aggregated operations, SaaS subscriptions, and gym revenue metrics.</p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon="building"
          hi
          label="Gyms Onboarded"
          value={analytics?.totalGyms || 0}
          accent="text-chalk-dark"
          sub={`${analytics?.activeGyms || 0} active operations`}
        />
        <StatCard
          icon="user"
          label="Platform Members"
          value={(analytics?.totalCustomers || 0).toLocaleString()}
          sub="Across all gyms"
        />
        <StatCard
          icon="card"
          label="Gross Revenue"
          value={`Rs. ${(analytics?.totalRevenue || 0).toLocaleString()}`}
          accent="text-iron"
          sub="Total payments processed"
        />
        <StatCard
          icon="shield"
          label="Platform Status"
          value="Healthy"
          accent="text-chalk-dark"
          sub="All multi-tenant nodes active"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Revenue Trend */}
        <div className="panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">Platform Revenue Velocity</h3>
              <p className="text-xs text-steel">Aggregated payments across all tenant gyms</p>
            </div>
            <span className="rounded-lg bg-chalk/15 px-2.5 py-1 text-xs font-semibold text-chalk-dark">
              Last 6 Months
            </span>
          </div>

          <div className="flex h-56 items-end gap-3 pt-6 pb-2 border-b border-ink/10">
            {(analytics?.monthlyRevenue || []).map((item, idx) => {
              const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg bg-ink px-2 py-1 text-[11px] font-mono text-paper shadow-md z-10 whitespace-nowrap">
                    Rs. {item.revenue.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-chalk-dark to-chalk group-hover:brightness-110 transition-all cursor-pointer"
                  />
                  <span className="mt-2 text-[10px] font-medium text-steel text-center truncate w-full">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-steel">
            <span>Monthly Processed Volume</span>
            <span>Hover bars for exact amounts (PKR)</span>
          </div>
        </div>

        {/* Gym Onboarding Growth */}
        <div className="panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">New Gym Registrations</h3>
              <p className="text-xs text-steel">Tenant acquisition by month</p>
            </div>
            <span className="rounded-lg bg-iron/10 px-2.5 py-1 text-xs font-semibold text-iron">
              {analytics?.totalGyms || 0} Total Gyms
            </span>
          </div>

          <div className="flex h-56 items-end gap-3 pt-6 pb-2 border-b border-ink/10">
            {(analytics?.monthlyGymGrowth || []).map((item, idx) => {
              const heightPercent = Math.max(Math.round((item.count / maxGymGrowth) * 100), 8);
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg bg-ink px-2 py-1 text-[11px] font-mono text-paper shadow-md z-10 whitespace-nowrap">
                    {item.count} gym{item.count === 1 ? '' : 's'} registered
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-iron to-iron/70 group-hover:brightness-110 transition-all cursor-pointer"
                  />
                  <span className="mt-2 text-[10px] font-medium text-steel text-center truncate w-full">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-steel">
            <span>SaaS Growth</span>
            <span>Gym facilities registered</span>
          </div>
        </div>
      </div>

      {/* Top Gyms Table */}
      <div className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">Top Performing Gym Facilities</h3>
            <p className="text-xs text-steel">Ranked by settled revenue and member count</p>
          </div>
          <Link to="/superadmin/admins" className="text-xs font-medium text-iron hover:underline">
            View all gyms & staff QR →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 text-steel">
                <th className="py-2.5 px-3 font-semibold">Gym Name</th>
                <th className="py-2.5 px-3 font-semibold">Slug / URL</th>
                <th className="py-2.5 px-3 font-semibold text-right">Active Members</th>
                <th className="py-2.5 px-3 font-semibold text-right">Revenue Collected</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.topGyms || []).map((g) => (
                <tr key={g._id} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                  <td className="py-3 px-3 font-medium text-ink">{g.gymName}</td>
                  <td className="py-3 px-3 font-mono text-steel">/g/{g.slug}</td>
                  <td className="py-3 px-3 text-right font-medium text-ink">{g.memberCount}</td>
                  <td className="py-3 px-3 text-right font-bold text-iron">Rs. {g.revenue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        g.isSuspended ? 'bg-ember/15 text-ember-dark' : 'bg-chalk/15 text-chalk-dark'
                      }`}
                    >
                      {g.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!analytics?.topGyms || analytics.topGyms.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-steel">
                    No gym facilities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff App Quick Banner */}
      <div className="panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember text-white shadow-soft">
            <svg className="icon !h-6 !w-6"><use href="#i-briefcase" /></svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Staff & Operations App Management</h2>
            <p className="text-xs text-steel">
              Distribute the installable management portal QR code to Gym Owners, Admins, and Personal Trainers.
            </p>
          </div>
        </div>
        <Link to="/superadmin/admins" className="btn-secondary text-xs shrink-0">
          Manage Gyms & Staff QR
        </Link>
      </div>
    </div>
  );
}
