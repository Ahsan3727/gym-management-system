import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';

export default function AdminOverview() {
  const [customers, setCustomers] = useState([]);
  const [fees, setFees] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/customers'), api.get('/admin/fees'), api.get('/admin/profile')])
      .then(([c, f, p]) => {
        setCustomers(c.data);
        setFees(f.data);
        setProfile(p.data);
      })
      .catch(() => setError('Could not load your dashboard.'));
  }, []);

  const activeCount = customers.filter((c) => c.isActive).length;
  const overdueFees = fees.filter((f) => f.status === 'overdue');
  const unpaidFees = fees.filter((f) => f.status !== 'paid');
  const revenue = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  if (error) return <div className="text-sm text-ember-dark">{error}</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">{profile?.gymName || 'Overview'}</h1>
      <p className="mb-8 text-sm text-steel">A snapshot of your gym today.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active customers" value={activeCount} accent="text-iron" />
        <StatCard label="Total customers" value={customers.length} />
        <StatCard label="Unpaid fees" value={unpaidFees.length} accent={unpaidFees.length ? 'text-ember-dark' : 'text-ink'} />
        <StatCard label="Overdue fees" value={overdueFees.length} accent={overdueFees.length ? 'text-ember-dark' : 'text-ink'} />
      </div>

      <div className="panel px-6 py-5">
        <div className="text-xs font-medium uppercase tracking-wide text-steel">Revenue collected</div>
        <div className="stat-number mt-1 text-iron">${revenue.toLocaleString()}</div>
      </div>
    </div>
  );
}
