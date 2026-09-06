import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/settings').then((res) => setSettings(res.data)).catch(() => setError('Could not load settings.'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.put('/superadmin/settings', settings);
      setSettings(data);
      setMessage('Saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!settings) return <div className="text-sm text-steel">Loading…</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Platform settings</h1>
      <p className="mb-8 text-sm text-steel">Global configuration that applies across every gym.</p>

      <form onSubmit={handleSubmit} className="panel grid max-w-xl gap-4 p-6">
        <div>
          <label className="field-label">Platform Currency</label>
          <input className="field-input" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} placeholder="PKR" />
          <p className="mt-1 text-xs text-steel">Standard ISO code (e.g. PKR, Rs.). All subscription dues and receipts adhere to this.</p>
        </div>
        <div>
          <label className="field-label">Terms URL</label>
          <input className="field-input" value={settings.termsUrl} onChange={(e) => setSettings({ ...settings, termsUrl: e.target.value })} placeholder="https://…" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={settings.platformBillingEnabled}
              onChange={(e) => setSettings({ ...settings, platformBillingEnabled: e.target.checked })}
            />
            Platform billing enabled
          </label>
        </div>
        <div>
          <label className="field-label">Platform billing note</label>
          <textarea className="field-input" rows={3} value={settings.platformBillingNote} onChange={(e) => setSettings({ ...settings, platformBillingNote: e.target.value })} />
        </div>
        {message && (
          <div className="flex items-center gap-2 text-sm text-chalk-dark">
            <svg className="icon !h-4 !w-4"><use href="#i-check-circle" /></svg>
            {message}
          </div>
        )}
        {error && <div className="text-sm text-ember-dark">{error}</div>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
