import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';
import { useToast } from '../../components/Toast.jsx';

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
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Gym accounts</h1>
          <p className="text-sm text-steel">Create, monitor and manage every gym on the platform.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
          Add gym
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <ListCard>
        {admins.map((admin) => (
          <ListRow
            key={admin._id}
            icon="building"
            iconBg={admin.isSuspended ? 'bg-ember/15 text-ember-dark' : 'bg-chalk/15 text-chalk-dark'}
            title={admin.gymName}
            subtitle={
              <>
                {admin.user?.username} ·{' '}
                <span className={admin.user?.isActive === false ? 'text-ember-dark' : 'text-chalk-dark'}>
                  {admin.user?.isActive === false ? 'Login disabled' : 'Login enabled'}
                </span>{' '}
                ·{' '}
                <span className={admin.isSuspended ? 'text-ember-dark font-medium' : 'text-chalk-dark font-medium'}>
                  {admin.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </>
            }
            trailing={
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <button onClick={() => openInstallLink(admin)} className="text-xs font-medium text-iron hover:underline">Install link</button>
                <button onClick={() => copyInstallLink(admin)} className="text-xs font-medium text-steel hover:text-ink">Copy link</button>
                <button onClick={() => openSummary(admin)} className="text-xs font-medium text-iron hover:underline">Summary</button>
                <button onClick={() => setEditing({ ...admin })} className="text-xs font-medium text-steel hover:text-ink">Edit</button>
                <button onClick={() => toggleSuspend(admin)} className="text-xs font-medium text-steel hover:text-ink">
                  {admin.isSuspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button onClick={() => toggleLogin(admin)} className="text-xs font-medium text-steel hover:text-ink">
                  {admin.user?.isActive === false ? 'Enable login' : 'Disable login'}
                </button>
                <button onClick={() => resetPassword(admin)} className="text-xs font-medium text-steel hover:text-ember-dark">
                  Reset password
                </button>
              </div>
            }
          />
        ))}
        {admins.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-steel">No gym accounts yet.</div>
        )}
      </ListCard>


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
            {createError && <div className="mb-3 text-sm text-ember-dark">{createError}</div>}
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
            {editError && <div className="mb-3 text-sm text-ember-dark">{editError}</div>}
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
            <div className="py-8 text-center text-sm text-ember-dark">{summaryError}</div>
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
                <div className="stat-number mt-1 text-lg">${summary.revenueCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="panel px-4 py-3 col-span-2">
                <div className="text-xs uppercase tracking-wide text-steel">Overdue fees</div>
                <div className={`stat-number mt-1 text-lg ${summary.overdueFees ? 'text-ember-dark' : ''}`}>{summary.overdueFees}</div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {installFor && (
        <Modal title={`Install link — ${installFor.gymName}`} onClose={() => setInstallFor(null)}>
          <p className="mb-4 text-xs text-steel">
            Share this with {installFor.gymName} to install their own branded app — name, icon and accent color, via
            "Add to Home Screen". No app store, no install file.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-sm border border-ink/15 bg-ink/[0.03] px-3 py-2">
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
            <div className="py-4 text-center text-sm text-ember-dark">{installError}</div>
          ) : !installQr ? (
            <div className="py-8 text-center text-sm text-steel">Generating QR code…</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Printable Reception Flyer Card */}
              <div id="reception-flyer" className="w-full rounded-2xl border-2 border-dashed border-ink/20 bg-panel p-6 text-center shadow-sm">
                <div className="text-xs font-bold uppercase tracking-widest text-ember mb-1">Official Member App</div>
                <h3 className="font-display text-2xl font-black text-ink mb-1">{installFor.gymName}</h3>
                <p className="text-xs text-steel mb-4">Scan with your phone camera to install our app</p>
                <div className="inline-block rounded-2xl bg-white p-3 shadow-md border border-ink/10">
                  <img src={installQr.qrDataUrl} alt="Install link QR code" className="h-44 w-44 mx-auto" />
                </div>
                <div className="mt-4 text-[11px] text-steel">
                  Workout logging • Attendance check-in • Diet & streaks
                </div>
              </div>

              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-2"
                >
                  <svg className="icon !h-4 !w-4"><use href="#i-clipboard" /></svg>
                  Print Reception Flyer
                </button>
                <button
                  type="button"
                  onClick={() => copyInstallLink(installFor)}
                  className="btn-secondary text-xs py-2"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* BUG #2 FIX: No longer shows a temp password — shows the server message instead */}
      {resetMessage && (
        <Modal title="Password Reset" onClose={() => setResetMessage('')}>
          <div className="rounded-sm border border-ink/15 bg-ink/[0.03] px-4 py-4 text-sm text-ink">
            {resetMessage}
          </div>
        </Modal>
      )}
    </div>
  );
}
