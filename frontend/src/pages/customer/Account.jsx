import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function Account() {
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  async function load() {
    const [profileRes, feesRes] = await Promise.all([api.get('/customer/profile'), api.get('/customer/fees')]);
    setProfile(profileRes.data);
    setFees(feesRes.data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your account.'));
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.put('/customer/profile', {
        phone: profile.phone,
        goals: profile.goals,
        notificationPrefs: profile.notificationPrefs,
      });
      setProfile(data);
      setMessage('Saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage('');
    setPwError('');
    try {
      await api.put('/auth/change-password', pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      setPwMessage('Password updated.');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  }

  if (error && !profile) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!profile) return <div className="text-sm text-steel">Loading…</div>;

  const statusColor = { paid: 'text-chalk-dark', unpaid: 'text-steel', overdue: 'text-ember-dark' };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Account</h1>
      <p className="mb-8 text-sm text-steel">Your profile, membership and fee status.</p>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <form onSubmit={handleSaveProfile} className="panel p-6">
          <div className="mb-4 text-sm font-medium text-steel">Profile</div>
          <div className="mb-4">
            <label className="field-label">Name</label>
            <input className="field-input bg-ink/[0.03]" value={profile.name} disabled />
          </div>
          <div className="mb-4">
            <label className="field-label">Phone</label>
            <input className="field-input" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div className="mb-4">
            <label className="field-label">Goals</label>
            <textarea className="field-input" rows={3} value={profile.goals || ''} onChange={(e) => setProfile({ ...profile, goals: e.target.value })} />
          </div>
          <div className="mb-4 space-y-2">
            <div className="field-label mb-0">Notifications</div>
            {['email', 'sms', 'push'].map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={!!profile.notificationPrefs?.[k]}
                  onChange={(e) =>
                    setProfile({ ...profile, notificationPrefs: { ...profile.notificationPrefs, [k]: e.target.checked } })
                  }
                />
                {k.toUpperCase()}
              </label>
            ))}
          </div>
          {message && <div className="mb-3 text-sm text-chalk-dark">{message}</div>}
          {error && <div className="mb-3 text-sm text-ember-dark">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="panel p-6">
          <div className="mb-4 text-sm font-medium text-steel">Change password</div>
          <div className="mb-4">
            <label className="field-label">Current password</label>
            <input type="password" className="field-input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div className="mb-4">
            <label className="field-label">New password</label>
            <input type="password" className="field-input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} />
          </div>
          {pwMessage && <div className="mb-3 text-sm text-chalk-dark">{pwMessage}</div>}
          {pwError && <div className="mb-3 text-sm text-ember-dark">{pwError}</div>}
          <button type="submit" disabled={pwSaving} className="btn-secondary">
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-ink/10 px-6 py-4 text-sm font-medium text-steel">Fee history</div>
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid on</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(fee.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-ink">${fee.amount}</td>
                <td className={`px-4 py-3 font-medium capitalize ${statusColor[fee.status]}`}>{fee.status}</td>
                <td className="px-4 py-3 text-ink/70">{fee.paidOn ? new Date(fee.paidOn).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-steel">No fee records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
