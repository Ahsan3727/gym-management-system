import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';

export default function SuperAdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/stats').then((res) => setStats(res.data)).catch(() => setError('Could not load platform stats.'));
  }, []);

  if (error) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!stats) return <div className="text-sm text-steel">Loading…</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Platform overview</h1>
      <p className="mb-8 text-sm text-steel">Totals across every gym on Ironline.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon="building" hi label="Gyms on platform" value={stats.totalGyms} accent="text-chalk-dark" />
        <StatCard icon="user" label="Total customers" value={stats.totalCustomers} />
        <StatCard icon="card" label="Revenue collected" value={`$${stats.totalRevenueCollected.toLocaleString()}`} />
      </div>

      <div className="mt-8 panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember text-white shadow-soft">
            <svg className="icon !h-6 !w-6"><use href="#i-briefcase" /></svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Staff & Operations App</h2>
            <p className="text-xs text-steel">
              Distribute the installable management portal to Gym Owners, Admins, and Personal Trainers.
            </p>
          </div>
        </div>
        <a href="/superadmin/admins" className="btn-secondary text-xs shrink-0">
          Manage Gyms & Staff QR
        </a>
      </div>
    </div>
  );
}

