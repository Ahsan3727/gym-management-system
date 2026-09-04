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
        <StatCard label="Active customers" value={activeCount} accent="text-iron" />
        <StatCard label="Total customers" value={customers.length} />
        <StatCard label="Unpaid fees" value={unpaidFees.length} accent={unpaidFees.length ? 'text-ember-dark' : 'text-ink'} />
        <StatCard label="Overdue fees" value={overdueFees.length} accent={overdueFees.length ? 'text-ember-dark' : 'text-ink'} />
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
            <div className="mb-3 rounded-sm border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              ✓ {announceSuccess}
            </div>
          )}

          {announceError && (
            <div className="mb-3 rounded-sm border border-ember/30 bg-ember/5 px-3 py-2 text-xs text-ember-dark">
              ✕ {announceError}
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
                {announcing ? 'Broadcasting…' : 'Broadcast to Members 📢'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
