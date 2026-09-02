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
        <StatCard label="Gyms on platform" value={stats.totalGyms} accent="text-chalk-dark" />
        <StatCard label="Total customers" value={stats.totalCustomers} />
        <StatCard label="Revenue collected" value={`$${stats.totalRevenueCollected.toLocaleString()}`} />
      </div>
    </div>
  );
}
