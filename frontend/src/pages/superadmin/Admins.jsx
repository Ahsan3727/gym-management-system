import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

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

  const [resetResult, setResetResult] = useState(null); // { gymName, tempPassword }

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
      await api.post('/superadmin/admins', form);
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create gym account.');
    } finally {
      setCreating(false);
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

  async function toggleSuspend(admin) {
    await api.put(`/superadmin/admins/${admin._id}/suspend`, { suspend: !admin.isSuspended });
    await load();
  }

  async function toggleLogin(admin) {
    const enable = admin.user?.isActive === false;
    await api.put(`/superadmin/admins/${admin._id}/disable`, { enable });
    await load();
  }

  async function resetPassword(admin) {
    if (!window.confirm(`Reset the password for ${admin.gymName}'s login?`)) return;
    const { data } = await api.put(`/superadmin/admins/${admin._id}/reset-password`);
    setResetResult({ gymName: admin.gymName, tempPassword: data.tempPassword });
  }

  async function openSummary(admin) {
    setSummaryFor(admin);
    setSummary(null);
    const { data } = await api.get(`/superadmin/admins/${admin._id}/summary`);
    setSummary(data);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Gym accounts</h1>
          <p className="text-sm text-steel">Create, monitor and manage every gym on the platform.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">Add gym</button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Gym</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{admin.gymName}</td>
                <td className="px-4 py-3 text-ink/70">{admin.user?.username}</td>
                <td className="px-4 py-3">
                  <span className={admin.user?.isActive === false ? 'text-ember-dark' : 'text-chalk-dark'}>
                    {admin.user?.isActive === false ? 'Disabled' : 'Enabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={admin.isSuspended ? 'text-ember-dark' : 'text-chalk-dark'}>
                    {admin.isSuspended ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
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
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">No gym accounts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
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
          {!summary ? (
            <div className="py-8 text-center text-sm text-steel">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="panel px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-steel">Customers</div>
                <div className="stat-number mt-1 text-lg">{summary.customerCount}</div>
              </div>
              <div className="panel px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-steel">Revenue collected</div>
                <div className="stat-number mt-1 text-lg">${summary.revenueCollected.toLocaleString()}</div>
              </div>
              <div className="panel px-4 py-3 col-span-2">
                <div className="text-xs uppercase tracking-wide text-steel">Overdue fees</div>
                <div className={`stat-number mt-1 text-lg ${summary.overdueFees ? 'text-ember-dark' : ''}`}>{summary.overdueFees}</div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {resetResult && (
        <Modal title={`Password reset — ${resetResult.gymName}`} onClose={() => setResetResult(null)}>
          <p className="mb-3 text-sm text-ink/80">
            Share this temporary password with the gym owner. In production this would be emailed rather than shown here.
          </p>
          <div className="rounded-sm border border-ink/15 bg-ink/[0.03] px-4 py-3 font-mono text-sm text-ink">
            {resetResult.tempPassword}
          </div>
        </Modal>
      )}
    </div>
  );
}
