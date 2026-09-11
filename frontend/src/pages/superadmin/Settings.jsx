import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/settings')
      .then((res) => setSettings(res.data))
      .catch(() => setError('Could not load settings.'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...settings,
        defaultMonthlyFee: Number(settings.defaultMonthlyFee) || 0,
        gracePeriodDays: Number(settings.gracePeriodDays) || 14,
      };
      const { data } = await api.put('/superadmin/settings', payload);
      setSettings(data);
      setMessage('Settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!settings) return <div className="text-sm text-steel">Loading settings…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-ink">Platform Settings</h1>
        <p className="text-sm text-steel">Configure global platform settings, default gym subscription fees, and payment accounts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Settings */}
        <div className="panel p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink border-b border-ink/10 pb-2">Platform Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Platform Currency</label>
              <input
                className="field-input"
                value={settings.currency || 'PKR'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="PKR"
              />
              <p className="mt-1 text-xs text-steel">Standard ISO code (e.g. PKR, Rs.).</p>
            </div>
            <div>
              <label className="field-label">Terms & Privacy URL</label>
              <input
                className="field-input"
                value={settings.termsUrl || ''}
                onChange={(e) => setSettings({ ...settings, termsUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Subscription & Grace Period */}
        <div className="panel p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink border-b border-ink/10 pb-2">Gym SaaS Billing & Dues Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Default Monthly Gym Fee ({settings.currency || 'PKR'})</label>
              <input
                type="number"
                min="0"
                className="field-input font-mono"
                value={settings.defaultMonthlyFee ?? 5000}
                onChange={(e) => setSettings({ ...settings, defaultMonthlyFee: e.target.value })}
                placeholder="5000"
              />
              <p className="mt-1 text-xs text-steel">Standard monthly fee used when batch-invoicing gyms.</p>
            </div>
            <div>
              <label className="field-label">Overdue Grace Period (Days)</label>
              <input
                type="number"
                min="1"
                max="90"
                className="field-input font-mono"
                value={settings.gracePeriodDays ?? 14}
                onChange={(e) => setSettings({ ...settings, gracePeriodDays: e.target.value })}
                placeholder="14"
              />
              <p className="mt-1 text-xs text-steel">Days after due date before severe service restriction notices trigger.</p>
            </div>
          </div>
          <div>
            <label className="field-label">Platform Billing Instructions / Notice Note</label>
            <textarea
              className="field-input"
              rows={2}
              value={settings.platformBillingNote || ''}
              onChange={(e) => setSettings({ ...settings, platformBillingNote: e.target.value })}
              placeholder="e.g. Please share screenshot on WhatsApp after transfer."
            />
          </div>
        </div>

        {/* SuperAdmin Receiving Accounts */}
        <div className="panel p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Receiving Payment Accounts</h2>
            <p className="text-xs text-steel mt-0.5">These account details will appear automatically on gym owners' invoices and payment portals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="field-label">Bank Name</label>
              <input
                className="field-input"
                value={settings.bankName || ''}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                placeholder="e.g. Meezan Bank / HBL"
              />
            </div>
            <div>
              <label className="field-label">Account Title</label>
              <input
                className="field-input"
                value={settings.accountTitle || ''}
                onChange={(e) => setSettings({ ...settings, accountTitle: e.target.value })}
                placeholder="e.g. Ironline Technologies"
              />
            </div>
            <div>
              <label className="field-label">Account Number</label>
              <input
                className="field-input font-mono"
                value={settings.accountNumber || ''}
                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                placeholder="e.g. 010203040506"
              />
            </div>
            <div>
              <label className="field-label">IBAN</label>
              <input
                className="field-input font-mono"
                value={settings.iban || ''}
                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                placeholder="e.g. PK36MEZN0001020304050607"
              />
            </div>
            <div>
              <label className="field-label">JazzCash Number</label>
              <input
                className="field-input font-mono"
                value={settings.jazzcashNumber || ''}
                onChange={(e) => setSettings({ ...settings, jazzcashNumber: e.target.value })}
                placeholder="e.g. 03001234567"
              />
            </div>
            <div>
              <label className="field-label">EasyPaisa Number</label>
              <input
                className="field-input font-mono"
                value={settings.easypaisaNumber || ''}
                onChange={(e) => setSettings({ ...settings, easypaisaNumber: e.target.value })}
                placeholder="e.g. 03451234567"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 rounded-lg bg-chalk/15 px-4 py-3 text-sm font-medium text-chalk-dark border border-chalk/30">
            <svg className="icon !h-5 !w-5"><use href="#i-check-circle" /></svg>
            {message}
          </div>
        )}
        {error && <div className="text-sm text-ember-dark">{error}</div>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Save Platform Settings'}
        </button>
      </form>
    </div>
  );
}
