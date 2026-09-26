import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { escapeHtml } from '../../utils/escapeHtml.js';
import GymBranding from './GymBranding.jsx';

function installUrlFor(admin) {
  if (!admin?.slug) return null;
  return `${window.location.origin}/g/${admin.slug}`;
}

const emptyForm = { username: '', password: '', gymName: '', address: '', contact: '', workingHours: '' };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [brandingGym, setBrandingGym] = useState(null);

  const [summaryFor, setSummaryFor] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');

  // BUG #2 FIX: resetResult no longer holds a tempPassword — the backend
  // no longer returns one in the response (it logs server-side instead).
  const [resetMessage, setResetMessage] = useState('');

  // Per-gym branded install link (IMPLEMENTATION_PLAN.md Phase 7)
  const [installFor, setInstallFor] = useState(null);
  const [installQr, setInstallQr] = useState(null);
  const [installError, setInstallError] = useState('');

  // Staff operations app QR modal state
  const [showStaffQr, setShowStaffQr] = useState(false);
  const [staffQr, setStaffQr] = useState(null);
  const [staffQrError, setStaffQrError] = useState('');

  const { showToast } = useToast();

  async function load() {
    const { data } = await api.get('/superadmin/admins');
    setAdmins(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load gym accounts.'));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data: created } = await api.post('/superadmin/admins', form);
      setShowCreate(false);
      setForm(emptyForm);
      await load();
      // Surface the install link right away — this is the whole point of
      // creating the gym account in the first place.
      openInstallLink(created);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create gym account.');
    } finally {
      setCreating(false);
    }
  }

  async function openInstallLink(admin) {
    setInstallFor(admin);
    setInstallQr(null);
    setInstallError('');
    try {
      const { data } = await api.get(`/superadmin/admins/${admin._id}/install-qr`);
      setInstallQr(data);
    } catch (err) {
      setInstallError(err.response?.data?.message || 'Could not generate the install QR code.');
    }
  }

  async function copyInstallLink(admin) {
    const url = installUrlFor(admin);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Install link copied.', { type: 'success' });
    } catch {
      showToast('Could not copy — long-press the link to copy it manually.', { type: 'error' });
    }
  }

  async function openStaffQrModal() {
    setShowStaffQr(true);
    setStaffQr(null);
    setStaffQrError('');
    try {
      const { data } = await api.get('/superadmin/staff-install-qr');
      setStaffQr(data);
    } catch (err) {
      setStaffQrError(err.response?.data?.message || 'Could not generate staff app QR code.');
    }
  }

  async function copyStaffInstallLink() {
    if (!staffQr?.staffInstallUrl) return;
    try {
      await navigator.clipboard.writeText(staffQr.staffInstallUrl);
      showToast('Staff app link copied.', { type: 'success' });
    } catch {
      showToast('Could not copy staff link.', { type: 'error' });
    }
  }

  function printStaffFlyer() {
    if (!staffQr?.qrDataUrl) return;
    const win = window.open('');
    const safeInstallUrl = escapeHtml(staffQr.staffInstallUrl);
    win.document.write(
      `<html><head><title>Staff Operations App - Setup Flyer</title><style>body{text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;color:#111;}h2{font-size:14px;color:#ff4e1f;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;}h1{font-size:30px;margin-top:0;margin-bottom:8px;font-weight:800;}.card{display:inline-block;padding:24px;border:2px solid #e4e4e7;border-radius:20px;margin:20px 0;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.06);}img{width:280px;height:280px;}.url{font-family:monospace;font-size:14px;background:#f4f4f5;padding:8px 16px;border-radius:8px;display:inline-block;margin-top:12px;color:#27272a;}.instructions{max-width:440px;margin:24px auto 0;text-align:left;font-size:14px;line-height:1.6;color:#52525b;}.instructions ol{padding-left:20px;}</style></head><body><h2>Ironline Platform</h2><h1>Staff Operations App</h1><p>Dedicated management portal for Gym Admins, Front Desk Staff, and Personal Trainers.</p><div class="card"><img src="${staffQr.qrDataUrl}"/><br/><span class="url">${safeInstallUrl}</span></div><div class="instructions"><strong>Setup Instructions:</strong><ol><li>Open the camera on your smartphone or tablet and scan the QR code.</li><li>Tap the link to open the Staff Portal.</li><li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li><li>Sign in with your staff credentials.</li></ol></div><script>window.print();</script></body></html>`
    );
    win.document.close();
  }

  function printMemberFlyer(admin, qrDataUrl, installUrl) {
    const win = window.open('');
    const safeGymName = escapeHtml(admin?.gymName);
    const safeInstallUrl = escapeHtml(installUrl);
    win.document.write(
      `<html><head><title>${safeGymName} - Member App Flyer</title><style>body{text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;color:#111;}h2{font-size:14px;color:#ff4e1f;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;}h1{font-size:32px;margin-top:0;margin-bottom:8px;font-weight:800;}.card{display:inline-block;padding:24px;border:2px solid #e4e4e7;border-radius:20px;margin:20px 0;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.06);}img{width:280px;height:280px;}.url{font-family:monospace;font-size:14px;background:#f4f4f5;padding:8px 16px;border-radius:8px;display:inline-block;margin-top:12px;color:#27272a;}.instructions{max-width:440px;margin:24px auto 0;text-align:left;font-size:14px;line-height:1.6;color:#52525b;}.instructions ol{padding-left:20px;}</style></head><body><h2>Official Gym App</h2><h1>${safeGymName}</h1><p>Scan with your phone to install our official member app. Track workouts, diets, attendance streaks and dues.</p><div class="card"><img src="${qrDataUrl}"/><br/><span class="url">${safeInstallUrl}</span></div><div class="instructions"><strong>Quick Setup:</strong><ol><li>Scan the QR code with your smartphone camera.</li><li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li><li>Sign in with your member username & password.</li></ol></div><script>window.print();</script></body></html>`
    );
    win.document.close();
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/superadmin/admins/${editing._id}`, {
        gymName: editing.gymName,
        address: editing.address,
        contact: editing.contact,
        workingHours: editing.workingHours,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  // BUG #12 FIX: toggleSuspend now has error handling
  async function toggleSuspend(admin) {
    try {
      await api.put(`/superadmin/admins/${admin._id}/suspend`, { suspend: !admin.isSuspended });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update suspension status.');
    }
  }

  // BUG #12 FIX: toggleLogin now has error handling
  async function toggleLogin(admin) {
    const enable = admin.user?.isActive === false;
    try {
      await api.put(`/superadmin/admins/${admin._id}/disable`, { enable });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update login access.');
    }
  }

  // BUG #12 FIX: resetPassword now has error handling.
  // BUG #2 FIX: No longer shows a temp password — backend logs it server-side.
  async function resetPassword(admin) {
    if (!window.confirm(`Reset the password for ${admin.gymName}'s login?`)) return;
    try {
      const { data } = await api.put(`/superadmin/admins/${admin._id}/reset-password`);
      setResetMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    }
  }

  // BUG #11 FIX: openSummary now has error handling
  async function openSummary(admin) {
    setSummaryFor(admin);
    setSummary(null);
    setSummaryError('');
    try {
      const { data } = await api.get(`/superadmin/admins/${admin._id}/summary`);
      setSummary(data);
    } catch {
      setSummaryError('Could not load summary data.');
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline text-ink">Gym Accounts</h1>
          <p className="text-caption mt-0.5">Create, monitor and manage every gym on the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
          <button type="button" onClick={openStaffQrModal} className="btn-secondary btn-md">
            <svg className="icon !h-4 !w-4"><use href="#i-briefcase" /></svg>
            Staff App QR
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="btn-primary btn-md">
            <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
            Add Gym
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-danger">{error}</div>}

      {/* Gym Account Cards */}
      <div className="space-y-2">
        {admins.map((admin) => {
          const initials = (admin.gymName || '?').trim().charAt(0).toUpperCase();
          const suspended = admin.isSuspended;
          const loginDisabled = admin.user?.isActive === false;
          return (
            <div
              key={admin._id}
              className={`group relative rounded-[14px] border bg-panel transition-all duration-200 hover:shadow-soft hover:-translate-y-px ${
                suspended ? 'border-danger/20 opacity-80' : 'border-ink/10'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Avatar */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-base font-bold shadow-xs"
                  style={{
                    background: suspended
                      ? 'rgb(var(--c-danger) / 0.15)'
                      : 'linear-gradient(135deg, rgb(var(--c-chalk)), rgb(var(--c-chalk-dark)))',
                    color: suspended ? 'rgb(var(--c-danger))' : '#fff',
                  }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-ink truncate">{admin.gymName}</span>
                    {suspended
                      ? <span className="badge-danger">Suspended</span>
                      : <span className="badge-active">Active</span>
                    }
                    {loginDisabled && <span className="badge-inactive">Login off</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-steel">
                    <span className="font-mono">@{admin.user?.username || '—'}</span>
                    {admin.slug && (
                      <span className="font-mono text-steel-light">/g/{admin.slug}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Branding */}
                  <button
                    onClick={() => setBrandingGym(admin)}
                    className="btn-sm border border-ink/10 bg-ink/5 text-ink hover:bg-ink/10 transition-colors"
                    title="Gym Branding"
                  >
                    <svg className="icon !h-3.5 !w-3.5"><use href="#i-pencil" /></svg>
                    Branding
                  </button>

                  {/* Install Link */}
                  <button
                    onClick={() => openInstallLink(admin)}
                    className="btn-sm border border-iron/20 bg-iron/10 text-iron hover:bg-iron/20 transition-colors"
                    title="Install Link & QR"
                  >
                    <svg className="icon !h-3.5 !w-3.5"><use href="#i-cloud" /></svg>
                    Install
                  </button>

                  {/* Summary */}
                  <button
                    onClick={() => openSummary(admin)}
                    className="btn-icon !h-8 !w-8 !rounded-[8px]"
                    title="Gym Summary"
                    aria-label="View summary"
                  >
                    <svg className="icon !h-3.5 !w-3.5"><use href="#i-trend" /></svg>
                  </button>

                  {/* ⋯ More: Edit, Suspend, Login, Reset PW */}
                  <div className="relative">
                    <button
                      className="btn-icon !h-8 !w-8 !rounded-[8px]"
                      title="More actions"
                      aria-label="More actions"
                      onClick={(e) => {
                        e.currentTarget.nextSibling.classList.toggle('hidden');
                      }}
                    >
                      <svg className="icon !h-3.5 !w-3.5"><use href="#i-dots" /></svg>
                    </button>
                    <div className="hidden absolute right-0 top-9 z-20 w-44 rounded-[12px] border border-ink/10 bg-panel shadow-lg py-1">
                      <button
                        onClick={(e) => { e.currentTarget.closest('.relative').querySelector('div').classList.add('hidden'); setEditing({ ...admin }); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-steel hover:bg-ink/5 hover:text-ink transition-colors"
                      >
                        <svg className="icon !h-3.5 !w-3.5"><use href="#i-pencil" /></svg>
                        Edit Details
                      </button>
                      <button
                        onClick={(e) => { e.currentTarget.closest('.relative').querySelector('div').classList.add('hidden'); copyInstallLink(admin); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-steel hover:bg-ink/5 hover:text-ink transition-colors"
                      >
                        <svg className="icon !h-3.5 !w-3.5"><use href="#i-clipboard" /></svg>
                        Copy Install Link
                      </button>
                      <div className="my-1 border-t border-ink/5" />
                      <button
                        onClick={(e) => { e.currentTarget.closest('.relative').querySelector('div').classList.add('hidden'); toggleSuspend(admin); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${suspended ? 'text-chalk-dark hover:bg-chalk/5' : 'text-danger hover:bg-danger/5'}`}
                      >
                        <svg className="icon !h-3.5 !w-3.5"><use href="#i-shield" /></svg>
                        {suspended ? 'Unsuspend Gym' : 'Suspend Gym'}
                      </button>
                      <button
                        onClick={(e) => { e.currentTarget.closest('.relative').querySelector('div').classList.add('hidden'); toggleLogin(admin); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-steel hover:bg-ink/5 hover:text-ink transition-colors"
                      >
                        <svg className="icon !h-3.5 !w-3.5"><use href="#i-lock" /></svg>
                        {loginDisabled ? 'Enable Login' : 'Disable Login'}
                      </button>
                      <button
                        onClick={(e) => { e.currentTarget.closest('.relative').querySelector('div').classList.add('hidden'); resetPassword(admin); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors"
                      >
                        <svg className="icon !h-3.5 !w-3.5"><use href="#i-lock" /></svg>
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {admins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-7 !w-7 text-steel"><use href="#i-building" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No gym accounts yet</h3>
            <p className="text-caption max-w-xs">Add the first gym to start onboarding members across the platform.</p>
            <button className="btn-primary btn-md mt-5" onClick={() => setShowCreate(true)}>
              <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
              Add First Gym
            </button>
          </div>
        )}
      </div>


      {showCreate && (
        <Modal title="Add gym" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="field-label">Gym name</label>
              <input className="field-input" value={form.gymName} onChange={(e) => setForm({ ...form, gymName: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Admin username</label>
              <input className="field-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Temporary password</label>
              <input type="password" className="field-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div className="mb-4">
              <label className="field-label">Address</label>
              <input className="field-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Contact</label>
              <input className="field-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Working hours</label>
              <input className="field-input" value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
            </div>
            {createError && <div className="mb-3 text-sm text-danger">{createError}</div>}
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating…' : 'Create gym account'}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.gymName}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSaveEdit}>
            <div className="mb-4">
              <label className="field-label">Gym name</label>
              <input className="field-input" value={editing.gymName} onChange={(e) => setEditing({ ...editing, gymName: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Address</label>
              <input className="field-input" value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Contact</label>
              <input className="field-input" value={editing.contact || ''} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Working hours</label>
              <input className="field-input" value={editing.workingHours || ''} onChange={(e) => setEditing({ ...editing, workingHours: e.target.value })} />
            </div>
            {editError && <div className="mb-3 text-sm text-danger">{editError}</div>}
            <button type="submit" disabled={savingEdit} className="btn-primary w-full">
              {savingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}

      {summaryFor && (
        <Modal title={`${summaryFor.gymName} — summary`} onClose={() => setSummaryFor(null)}>
          {/* BUG #11 FIX: Show error instead of infinite "Loading…" */}
          {summaryError ? (
            <div className="py-8 text-center text-sm text-danger">{summaryError}</div>
          ) : !summary ? (
            <div className="py-8 text-center text-sm text-steel">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="panel px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-steel">Customers</div>
                <div className="stat-number mt-1 text-lg">{summary.customerCount}</div>
              </div>
              <div className="panel px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-steel">Revenue collected</div>
                {/* BUG #14 FIX: Format amount properly */}
                <div className="stat-number mt-1 text-lg">Rs. {(summary.revenueCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="panel px-4 py-3 col-span-2">
                <div className="text-xs uppercase tracking-wide text-steel">Overdue fees</div>
                <div className={`stat-number mt-1 text-lg ${summary.overdueFees ? 'text-danger' : ''}`}>{summary.overdueFees}</div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {installFor && (
        <Modal title={`Member App — ${installFor.gymName}`} onClose={() => setInstallFor(null)}>
          <p className="mb-4 text-xs text-steel">
            Share this QR code or link with members of {installFor.gymName}. Scanning it installs their own branded gym app (name, icon and theme color) directly to their home screen.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-ink/10 bg-ink/[0.03] px-3 py-2">
            <code className="flex-1 truncate text-xs text-ink">{installUrlFor(installFor)}</code>
            <button
              type="button"
              onClick={() => copyInstallLink(installFor)}
              className="shrink-0 text-xs font-medium text-iron hover:underline"
            >
              Copy
            </button>
          </div>
          {installError ? (
            <div className="py-4 text-center text-sm text-danger">{installError}</div>
          ) : !installQr ? (
            <div className="py-8 text-center text-sm text-steel">Generating QR code…</div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-panel p-3 shadow-soft border border-ink/10">
                <img src={installQr.qrDataUrl} alt="Install link QR code" className="h-44 w-44" />
              </div>
              <p className="text-xs text-steel">Scan with phone camera to open and install the member app.</p>
              <button
                type="button"
                onClick={() => printMemberFlyer(installFor, installQr.qrDataUrl, installUrlFor(installFor))}
                className="btn-secondary text-xs mt-1"
              >
                Print Member Flyer
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Staff Operations App QR Modal */}
      {showStaffQr && (
        <Modal title="Staff & Operations App — QR Code" onClose={() => setShowStaffQr(false)}>
          <p className="mb-4 text-xs text-steel">
            Installable management app for Gym Admins, Receptionists, and Personal Trainers. Scan with any mobile or tablet camera to install.
          </p>
          {staffQrError ? (
            <div className="py-4 text-center text-sm text-danger">{staffQrError}</div>
          ) : !staffQr ? (
            <div className="py-8 text-center text-sm text-steel">Generating Staff App QR…</div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2 rounded-sm border border-ink/10 bg-ink/[0.03] px-3 py-2">
                <code className="flex-1 truncate text-xs text-ink">{staffQr.staffInstallUrl}</code>
                <button
                  type="button"
                  onClick={copyStaffInstallLink}
                  className="shrink-0 text-xs font-medium text-iron hover:underline"
                >
                  Copy
                </button>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-panel p-3 shadow-soft border border-ink/10">
                  <img src={staffQr.qrDataUrl} alt="Staff App QR" className="h-44 w-44" />
                </div>
                <p className="text-xs text-steel">Scan to install the Staff Operations portal on phone or front-desk tablet.</p>
                <button
                  type="button"
                  onClick={printStaffFlyer}
                  className="btn-secondary text-xs mt-1"
                >
                  Print Staff Setup Flyer
                </button>
              </div>
            </>
          )}
        </Modal>
      )}


      {/* BUG #2 FIX: No longer shows a temp password — shows the server message instead */}
      {resetMessage && (
        <Modal title="Password Reset" onClose={() => setResetMessage('')}>
          <div className="rounded-sm border border-ink/10 bg-ink/[0.03] px-4 py-4 text-sm text-ink">
            {resetMessage}
          </div>
        </Modal>
      )}

      {brandingGym && (
        <Modal
          title={`Branding & Layout — ${brandingGym.gymName}`}
          onClose={() => setBrandingGym(null)}
          width="max-w-5xl"
        >
          <GymBranding
            admin={brandingGym}
            allAdmins={admins}
            onClose={() => setBrandingGym(null)}
            onUpdated={(updated) => {
              setAdmins((prev) =>
                prev.map((a) => (a._id === updated._id ? { ...a, ...updated } : a))
              );
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
