import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function GymProfile() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState('');

  useEffect(() => {
    api.get('/admin/profile').then((res) => setProfile(res.data)).catch(() => setError('Could not load gym profile.'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.put('/admin/profile', {
        gymName: profile.gymName,
        gymLogoUrl: profile.gymLogoUrl,
        address: profile.address,
        contact: profile.contact,
        workingHours: profile.workingHours,
      });
      setProfile(data);
      setMessage('Saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAnnounce(e) {
    e.preventDefault();
    setSending(true);
    setAnnounceMessage('');
    try {
      const { data } = await api.post('/admin/announcements', { message: announcement });
      setAnnounceMessage(data.message);
      setAnnouncement('');
    } catch (err) {
      setAnnounceMessage(err.response?.data?.message || 'Could not send announcement.');
    } finally {
      setSending(false);
    }
  }

  if (error && !profile) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!profile) return <div className="text-sm text-steel">Loading…</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Gym profile</h1>
      <p className="mb-8 text-sm text-steel">Branding customers see, plus announcements & reminders.</p>

      <form onSubmit={handleSubmit} className="panel mb-8 grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label className="field-label">Gym name</label>
          <input className="field-input" value={profile.gymName} onChange={(e) => setProfile({ ...profile, gymName: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Logo URL</label>
          <input className="field-input" value={profile.gymLogoUrl || ''} onChange={(e) => setProfile({ ...profile, gymLogoUrl: e.target.value })} placeholder="https://…" />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Address</label>
          <input className="field-input" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Contact</label>
          <input className="field-input" value={profile.contact || ''} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Working hours</label>
          <input className="field-input" value={profile.workingHours || ''} onChange={(e) => setProfile({ ...profile, workingHours: e.target.value })} placeholder="Mon–Sat 6am–10pm" />
        </div>
        <div className="md:col-span-2">
          {message && <div className="mb-3 text-sm text-chalk-dark">{message}</div>}
          {error && <div className="mb-3 text-sm text-ember-dark">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <form onSubmit={handleAnnounce} className="panel p-6">
        <div className="mb-1 text-sm font-medium text-steel">Send an announcement</div>
        <p className="mb-4 text-xs text-steel">Delivered as a notification to every customer at your gym.</p>
        <textarea className="field-input mb-4" rows={3} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} required />
        {announceMessage && <div className="mb-3 text-sm text-ink/80">{announceMessage}</div>}
        <button type="submit" disabled={sending} className="btn-secondary">
          {sending ? 'Sending…' : 'Send announcement'}
        </button>
      </form>
    </div>
  );
}
