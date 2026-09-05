import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';

export default function AdminOverview() {
  const [customers, setCustomers] = useState([]);
  const [fees, setFees] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // Announcement state
  const [announcement, setAnnouncement] = useState('');
  const [announcing, setAnnouncing] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState('');
  const [announceError, setAnnounceError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/customers'), api.get('/admin/fees'), api.get('/admin/profile')])
      .then(([c, f, p]) => {
        setCustomers(c.data);
        setFees(f.data);
        setProfile(p.data);
      })
      .catch(() => setError('Could not load your dashboard.'));
  }, []);

  async function handleSendAnnouncement(e) {
    e.preventDefault();
    if (!announcement.trim()) return;
    setAnnouncing(true);
    setAnnounceSuccess('');
    setAnnounceError('');
    try {
      const res = await api.post('/admin/announcements', { message: announcement.trim() });
      setAnnounceSuccess(res.data?.message || 'Announcement broadcast successfully!');
      setAnnouncement('');
    } catch (err) {
      setAnnounceError(err.response?.data?.message || 'Failed to broadcast announcement.');
    } finally {
      setAnnouncing(false);
    }
  }

  const activeCount = customers.filter((c) => c.isActive).length;
  const overdueFees = fees.filter((f) => f.status === 'overdue');
  const unpaidFees = fees.filter((f) => f.status !== 'paid');
  const revenue = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  if (error) return <div className="text-sm text-ember-dark">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{profile?.gymName || 'Overview'}</h1>
        <p className="mt-1 text-sm text-steel">A snapshot of your gym and member communications today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="user" hi label="Active customers" value={activeCount} accent="text-iron" />
        <StatCard icon="briefcase" label="Total customers" value={customers.length} />
        <StatCard icon="card" label="Unpaid fees" value={unpaidFees.length} accent={unpaidFees.length ? 'text-ember-dark' : 'text-ink'} />
        <StatCard icon="bell" label="Overdue fees" value={overdueFees.length} accent={overdueFees.length ? 'text-ember-dark' : 'text-ink'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="panel p-6 lg:col-span-1">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Revenue collected</div>
          <div className="stat-number mt-2 text-iron">${revenue.toLocaleString()}</div>
          <p className="mt-2 text-xs text-steel">
            Across {fees.filter((f) => f.status === 'paid').length} settled membership dues.
          </p>
        </div>

        {/* Announcement Broadcast Panel */}
        <div className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Broadcast Gym Announcement</h3>
            <span className="text-xs text-steel">Sends instant alert to all active members</span>
          </div>

          {announceSuccess && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-chalk/30 bg-chalk/10 px-3 py-2 text-xs font-medium text-chalk-dark">
              <svg className="icon !h-4 !w-4 shrink-0"><use href="#i-check-circle" /></svg>
              {announceSuccess}
            </div>
          )}

          {announceError && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-ember/30 bg-ember/5 px-3 py-2 text-xs font-medium text-ember-dark">
              <svg className="icon !h-4 !w-4 shrink-0"><use href="#i-close" /></svg>
              {announceError}
            </div>
          )}

          <form onSubmit={handleSendAnnouncement} className="space-y-3">
            <textarea
              rows={3}
              className="field-input resize-none"
              placeholder="e.g. Schedule update: Gym opens at 6:00 AM this bank holiday. New spin class starting Tuesday!"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              required
            />
            <div className="flex justify-end">
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
