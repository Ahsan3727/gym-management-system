import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios.js';

export default function GymProfile() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const logoInputRef = useRef(null);

  // QR check-in state
  const [qrData, setQrData] = useState({
    checkinTokenRequired: false,
    checkinToken: '',
    checkinTokenExpiry: null,
    isTokenValid: false,
    qrDataUrl: null,
  });
  const [generatingQr, setGeneratingQr] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [qrMessage, setQrMessage] = useState('');

  // Announcement state
  const [announcement, setAnnouncement] = useState('');
  const [sending, setSending] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState('');

  // Branded install link (IMPLEMENTATION_PLAN.md Phase 7)
  const [installData, setInstallData] = useState(null);
  const [installError, setInstallError] = useState('');

  useEffect(() => {
    api
      .get('/admin/profile')
      .then((res) => setProfile(res.data))
      .catch(() => setError('Could not load gym profile.'));

    api
      .get('/admin/checkin-qr')
      .then((res) => setQrData(res.data))
      .catch(() => {});

    api
      .get('/admin/install-qr')
      .then((res) => setInstallData(res.data))
      .catch((err) => setInstallError(err.response?.data?.message || 'Could not load your install link.'));
  }, []);

  async function copyInstallLink() {
    if (!installData?.installUrl) return;
    try {
      await navigator.clipboard.writeText(installData.installUrl);
      setMessage('Install link copied.');
    } catch {
      setError('Could not copy — long-press the link to copy it manually.');
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload/gym-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((prev) => ({ ...prev, gymLogoUrl: data.url }));
      setMessage('Gym logo updated successfully.');
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  }

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
        themeColor: profile.themeColor,
      });
      setProfile(data);
      setMessage('Saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleQrRequired(e) {
    const checked = e.target.checked;
    setUpdatingSettings(true);
    try {
      const { data } = await api.put('/admin/checkin-settings', {
        checkinTokenRequired: checked,
      });
      setQrData((prev) => ({ ...prev, checkinTokenRequired: data.checkinTokenRequired }));
      setQrMessage(
        checked
          ? 'QR verification is now required for member attendance streaks.'
          : 'QR verification is now optional.'
      );
    } catch (err) {
      setQrMessage(err.response?.data?.message || 'Failed to update check-in settings.');
    } finally {
      setUpdatingSettings(false);
    }
  }

  async function handleGenerateQr() {
    setGeneratingQr(true);
    setQrMessage('');
    try {
      const { data } = await api.post('/admin/checkin-qr');
      setQrData((prev) => ({
        ...prev,
        token: data.token,
        checkinToken: data.token,
        checkinTokenExpiry: data.expiresAt,
        qrDataUrl: data.qrDataUrl,
        isTokenValid: true,
      }));
      setQrMessage('New QR code generated. Valid for 24 hours at gym reception.');
    } catch (err) {
      setQrMessage(err.response?.data?.message || 'Failed to generate QR code.');
    } finally {
      setGeneratingQr(false);
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
      <p className="mb-8 text-sm text-steel">Branding customers see, reception QR check-ins, plus announcements.</p>

      {/* Gym Details & Logo Upload */}
      <form onSubmit={handleSubmit} className="panel mb-8 grid gap-6 p-6 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-ink/10">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink/20 bg-ink/[0.02]">
            {profile.gymLogoUrl ? (
              <img src={profile.gymLogoUrl} alt="Gym Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-steel text-center px-2">No Logo</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink">Gym Logo</h3>
            <p className="text-xs text-steel mb-3">
              Upload your gym emblem or logo. Displayed on member dashboards and invoices.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="btn-secondary text-xs"
              >
                {uploadingLogo ? 'Uploading to Cloudinary…' : 'Upload image'}
              </button>
              {profile.gymLogoUrl && (
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, gymLogoUrl: '' })}
                  className="text-xs text-steel hover:text-ember-dark"
                >
                  Remove
                </button>
              )}
            </div>
            {uploadError && <div className="mt-2 text-xs text-ember-dark">{uploadError}</div>}
          </div>
        </div>

        <div>
          <label className="field-label">Gym name</label>
          <input
            className="field-input"
            value={profile.gymName}
            onChange={(e) => setProfile({ ...profile, gymName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="field-label">Logo URL (manual override)</label>
          <input
            className="field-input"
            value={profile.gymLogoUrl || ''}
            onChange={(e) => setProfile({ ...profile, gymLogoUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="field-label">Accent color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={profile.themeColor || '#e11d48'}
              onChange={(e) => setProfile({ ...profile, themeColor: e.target.value })}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-ink/15 bg-transparent p-0.5"
            />
            <input
              className="field-input"
              value={profile.themeColor || ''}
              onChange={(e) => setProfile({ ...profile, themeColor: e.target.value })}
              placeholder="#e11d48"
            />
          </div>
          <p className="mt-1 text-xs text-steel">Used for your installed app's status bar and icon background.</p>
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Address</label>
          <input
            className="field-input"
            value={profile.address || ''}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Contact</label>
          <input
            className="field-input"
            value={profile.contact || ''}
            onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Working hours</label>
          <input
            className="field-input"
            value={profile.workingHours || ''}
            onChange={(e) => setProfile({ ...profile, workingHours: e.target.value })}
            placeholder="Mon–Sat 6am–10pm"
          />
        </div>
        <div className="md:col-span-2">
          {message && <div className="mb-3 text-sm text-chalk-dark">{message}</div>}
          {error && <div className="mb-3 text-sm text-ember-dark">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Branded install link */}
      <div className="panel mb-8 p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-iron/15 text-iron">
            <svg className="icon !h-[18px] !w-[18px]"><use href="#i-shield" /></svg>
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Install as an app</h2>
            <p className="text-xs text-steel">
              Share this link with your members — opening it on their phone lets them install{' '}
              {profile.gymName || 'your gym'} as an app with your own name, icon and color, right from their browser.
              No app store needed.
            </p>
          </div>
        </div>

        {installError ? (
          <div className="text-sm text-ember-dark">{installError}</div>
        ) : !installData ? (
          <div className="text-sm text-steel">Loading your install link…</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
            <div className="rounded-2xl bg-panel p-3 shadow-soft border border-ink/10">
              <img src={installData.qrDataUrl} alt="Install link QR code" className="h-40 w-40" />
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex items-center gap-2 rounded-sm border border-ink/15 bg-ink/[0.03] px-3 py-2">
                <code className="flex-1 truncate text-xs text-ink">{installData.installUrl}</code>
                <button type="button" onClick={copyInstallLink} className="shrink-0 text-xs font-medium text-iron hover:underline">
                  Copy
                </button>
              </div>
              <p className="text-xs text-steel">Print the QR code and display it at reception, or share the link directly.</p>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Reception Check-In */}
      <div className="panel mb-8 p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-iron/15 text-iron">
              <svg className="icon !h-[18px] !w-[18px]"><use href="#i-shield" /></svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Reception QR Check-In</h2>
              <p className="text-xs text-steel">
                Display this QR code at your front desk. Members scan it on their phone to verify attendance and increment daily streaks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateQr}
            disabled={generatingQr}
            className="btn-primary text-xs"
          >
            {generatingQr ? 'Generating…' : qrData.qrDataUrl ? 'Rotate / Refresh QR' : 'Generate QR Code'}
          </button>
        </div>

        <div className="mt-4 mb-6 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink/90 cursor-pointer">
            <input
              type="checkbox"
              checked={qrData.checkinTokenRequired}
              onChange={handleToggleQrRequired}
              disabled={updatingSettings}
              className="rounded border-ink/20 text-iron focus:ring-iron"
            />
            <span>Require QR verification for customer check-ins</span>
          </label>
        </div>

        {qrMessage && <div className="mb-4 text-xs font-medium text-chalk-dark">{qrMessage}</div>}

        {qrData.qrDataUrl ? (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
            <div className="rounded-2xl bg-panel p-3 shadow-soft border border-ink/10">
              <img src={qrData.qrDataUrl} alt="Check-in QR Code" className="h-44 w-44" />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <span className="chip border-chalk/25 bg-chalk/10 text-chalk-dark">Active Reception QR</span>
              <p className="text-xs text-steel">
                Valid until:{' '}
                <strong className="text-ink">
                  {qrData.checkinTokenExpiry
                    ? new Date(qrData.checkinTokenExpiry).toLocaleString()
                    : '24 hours'}
                </strong>
              </p>
              <p className="text-xs text-steel">
                Passcode token:{' '}
                <code className="rounded bg-ink/5 px-2 py-1 font-mono text-ink text-xs select-all">
                  {qrData.checkinToken}
                </code>
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open('');
                    win.document.write(
                      `<html><head><title>Reception QR - ${profile.gymName}</title><style>body{text-align:center;font-family:sans-serif;padding:40px;}h1{margin-bottom:8px;}p{color:#666;font-size:18px;}img{width:320px;height:320px;margin:20px 0;}</style></head><body><h1>${profile.gymName}</h1><p>Scan to check in</p><img src="${qrData.qrDataUrl}"/><p style="font-family:monospace;font-size:14px;">Token: ${qrData.checkinToken}</p><script>window.print();</script></body></html>`
                    );
                    win.document.close();
                  }}
                  className="btn-secondary text-xs"
                >
                  Print QR sign
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/20 p-8 text-center text-xs text-steel">
            No active QR code generated. Click "Generate QR Code" to create a check-in token for your reception desk.
          </div>
        )}
      </div>

      {/* Announcements */}
      <form onSubmit={handleAnnounce} className="panel p-6">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-steel">
          <svg className="icon !h-4 !w-4"><use href="#i-bell" /></svg>
          Send an announcement
        </div>
        <p className="mb-4 text-xs text-steel">Delivered as a notification to every customer at your gym.</p>
        <textarea
          className="field-input mb-4"
          rows={3}
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          required
        />
        {announceMessage && <div className="mb-3 text-sm text-ink/80">{announceMessage}</div>}
        <button type="submit" disabled={sending} className="btn-secondary">
          {sending ? 'Sending…' : 'Send announcement'}
        </button>
      </form>
    </div>
  );
}
