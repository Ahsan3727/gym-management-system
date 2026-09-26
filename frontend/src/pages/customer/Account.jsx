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
        setPaymentNotice(`Simulated payment of Rs. ${fee.amount.toFixed(2)} completed! Receipt issued.`);
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

  if (error && !profile) return <div className="text-sm text-danger">{error}</div>;
  if (!profile) return <div className="text-sm text-steel">Loading…</div>;

  const statusAccent = { paid: 'text-chalk-dark', unpaid: 'text-steel', overdue: 'text-danger' };

  function fmtAmount(amount) {
    return Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-headline text-ink">Account & Membership</h1>
        <p className="text-caption mt-0.5">Profile, notification preferences, passwords, and dues.</p>
      </div>

      {paymentNotice && (
        <div className="mb-6 rounded-2xl border border-chalk/30 bg-chalk/10 p-4 text-sm font-medium text-chalk-dark">
          {paymentNotice}
        </div>
      )}

      {/* Plan Card */}
      <div className="panel card--tint mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember/10 text-ember">
            <svg className="icon !h-5 !w-5"><use href="#i-card" /></svg>
          </span>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-steel">Current Plan</div>
            <div className="mt-1 text-xl font-bold text-ink">{profile.plan?.planName || 'No active plan assigned'}</div>
            {profile.plan?.price !== undefined && (
              <div className="text-xs text-steel mt-0.5">
                Rs. {fmtAmount(profile.plan.price)} / {profile.plan.durationMonths} month(s)
              </div>
            )}
          </div>
        </div>
        <div className="relative text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Member Since</div>
          <div className="mt-1 text-sm font-medium text-ink">
            {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '—'}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        {/* Profile & Notifications */}
        <form onSubmit={handleSaveProfile} className="panel p-6">
          <h2 className="text-title text-ink mb-1">Profile & Preferences</h2>
          <p className="text-caption mb-4">Update contact information and notification channels.</p>
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
          {error && <div className="mb-3 text-sm text-danger">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="panel p-6">
          <h2 className="text-title text-ink mb-1">Change Password</h2>
          <p className="text-caption mb-4">Ensure your account uses a secure password.</p>
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
          {pwError && <div className="mb-3 text-sm text-danger">{pwError}</div>}
          <button type="submit" disabled={pwSaving} className="btn-secondary">
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Fee History & Online Payment */}
      <div className="mb-4">
        <h2 className="text-title text-ink">Fee History & Online Payment</h2>
        <p className="text-caption mt-0.5">Track paid invoices and clear any outstanding membership dues.</p>
      </div>

      <div className="panel divide-y divide-ink/10 overflow-hidden">
        {fees.map((fee) => (
          <div key={fee._id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold ${
                  fee.status === 'paid'
                    ? 'bg-chalk/20 text-chalk-dark'
                    : fee.status === 'overdue'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-iron/10 text-iron'
                }`}
              >
                <svg className="icon !h-5 !w-5">
                  <use href={fee.status === 'paid' ? '#i-check-circle' : '#i-card'} />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">Rs. {fmtAmount(fee.amount)}</span>
                  <span
                    className={
                      fee.status === 'paid'
                        ? 'badge-active'
                        : fee.status === 'overdue'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }
                  >
                    {fee.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-steel">
                  Due {new Date(fee.dueDate).toLocaleDateString()}
                  {fee.paidOn ? ` · Paid on ${new Date(fee.paidOn).toLocaleDateString()}` : ''}
                  {fee.receiptNumber ? ` · Receipt #${fee.receiptNumber}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {fee.status !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => handlePayFee(fee)}
                  disabled={payingFeeId === fee._id}
                  className="btn-primary btn-sm"
                >
                  {payingFeeId === fee._id ? 'Opening Gateway…' : 'Pay Now'}
                </button>
              ) : (
                <span className="badge-active">Paid in full</span>
              )}
            </div>
          </div>
        ))}
        {fees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-6 !w-6 text-steel"><use href="#i-card" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No fee records found</h3>
            <p className="text-caption max-w-xs">You have no billed membership dues or fee history on file.</p>
          </div>
        )}
      </div>
    </div>
  );
}
