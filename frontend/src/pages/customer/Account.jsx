import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios.js';

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [payingFeeId, setPayingFeeId] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  async function load() {
    const [profileRes, feesRes] = await Promise.all([
      api.get('/customer/profile'),
      api.get('/customer/fees'),
    ]);
    setProfile(profileRes.data);
    setFees(feesRes.data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your account.'));

    // Handle return from payment session
    const paymentStatus = searchParams.get('payment') || searchParams.get('simulated_payment');
    const returnFeeId = searchParams.get('fee_id') || searchParams.get('paid_fee');

    if (paymentStatus === 'success' && returnFeeId) {
      // In simulated mode or returning from Stripe checkout, confirm payment
      api
        .post('/webhooks/confirm-simulation', { feeId: returnFeeId })
        .then(() => {
          setPaymentNotice('Payment completed successfully! Your membership status is updated.');
          load();
        })
        .catch(() => {})
        .finally(() => {
          setSearchParams({});
        });
    } else if (paymentStatus === 'cancelled') {
      setPaymentNotice('Payment was cancelled. You can try again at any time.');
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePayFee(fee) {
    setPayingFeeId(fee._id);
    setError('');
    setPaymentNotice('');
    try {
      const { data } = await api.post(`/customer/fees/${fee._id}/pay`);

      if (data.isSimulated) {
        // Simulated checkout confirmation
        await api.post('/webhooks/confirm-simulation', { feeId: fee._id });
        setPaymentNotice(`Simulated payment of $${fee.amount.toFixed(2)} completed! Receipt issued.`);
        await load();
      } else if (data.checkoutUrl) {
        // Real Stripe Checkout redirect
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not initiate payment session.');
    } finally {
      setPayingFeeId(null);
    }
  }

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

  function fmtAmount(amount) {
    return Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Account & membership</h1>
      <p className="mb-8 text-sm text-steel">Profile, notification preferences, passwords, and dues.</p>

      {paymentNotice && (
        <div className="mb-6 rounded-lg border border-chalk/30 bg-chalk/10 p-4 text-sm font-medium text-chalk-dark">
          {paymentNotice}
        </div>
      )}

      {/* Plan Card */}
      <div className="panel mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Current Plan</div>
          <div className="mt-1 text-xl font-bold text-ink">{profile.plan?.planName || 'No active plan assigned'}</div>
          {profile.plan?.price !== undefined && (
            <div className="text-xs text-steel mt-0.5">
              ${fmtAmount(profile.plan.price)} / {profile.plan.durationMonths} month(s)
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Member Since</div>
          <div className="mt-1 text-sm font-medium text-ink">
            {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        {/* Profile & Notifications */}
        <form onSubmit={handleSaveProfile} className="panel p-6">
          <div className="mb-4 text-sm font-medium text-steel">Profile & Preferences</div>
          <div className="mb-4">
            <label className="field-label">Name</label>
            <input className="field-input opacity-70 cursor-not-allowed" value={profile.name} disabled />
          </div>
          <div className="mb-4">
            <label className="field-label">Phone</label>
            <input
              className="field-input"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="field-label">Fitness goals</label>
            <input
              className="field-input"
              value={profile.goals || ''}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              placeholder="e.g. Build muscle, 5k run"
            />
          </div>

          <div className="mb-4">
            <label className="field-label mb-2 block">Notification channels</label>
            <div className="flex gap-4">
              {['email', 'sms', 'push'].map((k) => (
                <label key={k} className="flex items-center gap-2 text-xs font-medium text-ink/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.notificationPrefs?.[k] || false}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        notificationPrefs: { ...profile.notificationPrefs, [k]: e.target.checked },
                      })
                    }
                  />
                  {k.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
          {message && <div className="mb-3 text-sm text-chalk-dark">{message}</div>}
          {error && <div className="mb-3 text-sm text-ember-dark">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="panel p-6">
          <div className="mb-4 text-sm font-medium text-steel">Change password</div>
          <div className="mb-4">
            <label className="field-label">Current password</label>
            <input
              type="password"
              className="field-input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="field-label">New password</label>
            <input
              type="password"
              className="field-input"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
              minLength={8}
            />
          </div>
          {pwMessage && <div className="mb-3 text-sm text-chalk-dark">{pwMessage}</div>}
          {pwError && <div className="mb-3 text-sm text-ember-dark">{pwError}</div>}
          <button type="submit" disabled={pwSaving} className="btn-secondary">
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Fee History & Online Payment */}
      <div className="panel overflow-hidden">
        <div className="border-b border-ink/10 px-6 py-4 text-sm font-medium text-steel">
          Fee history & Online Payment
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt / Paid on</th>
              <th className="px-4 py-3 text-right">Payment</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(fee.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-ink">${fmtAmount(fee.amount)}</td>
                <td className={`px-4 py-3 font-medium capitalize ${statusColor[fee.status]}`}>{fee.status}</td>
                <td className="px-4 py-3 text-xs text-ink/70">
                  {fee.status === 'paid' ? (
                    <div>
                      <span className="font-mono text-ink">{fee.receiptNumber || 'Paid'}</span>
                      {fee.paidOn && (
                        <span className="block text-steel">{new Date(fee.paidOn).toLocaleDateString()}</span>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {fee.status !== 'paid' ? (
                    <button
                      type="button"
                      onClick={() => handlePayFee(fee)}
                      disabled={payingFeeId === fee._id}
                      className="btn-primary text-xs"
                    >
                      {payingFeeId === fee._id ? 'Opening checkout…' : 'Pay Now'}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-chalk-dark">Paid</span>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">
                  No fee records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
