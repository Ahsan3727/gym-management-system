import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

const emptyForm = { username: '', password: '', name: '', phone: '', planId: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState(null); // customer object
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [progressFor, setProgressFor] = useState(null); // customer object
  const [progress, setProgress] = useState(null);

  async function load() {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const [customersRes, plansRes] = await Promise.all([
      api.get('/admin/customers', { params }),
      api.get('/admin/plans'),
    ]);
    setCustomers(customersRes.data);
    setPlans(plansRes.data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load customers.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load().catch(() => setError('Could not load customers.'));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/customers', createForm);
      setShowCreate(false);
      setCreateForm(emptyForm);
      await load();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create customer.');
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/admin/customers/${editing._id}`, {
        name: editing.name,
        phone: editing.phone,
        planId: editing.plan?._id || editing.plan || null,
        isActive: editing.isActive,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Remove ${customer.name}? This deletes their login and all logged data.`)) return;
    await api.delete(`/admin/customers/${customer._id}`);
    await load();
  }

  async function openProgress(customer) {
    setProgressFor(customer);
    setProgress(null);
    const { data } = await api.get(`/admin/customers/${customer._id}/progress`);
    setProgress(data);
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-steel">Add, manage and monitor everyone at your gym.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">Add customer</button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-wrap gap-3">
        <input
          className="field-input max-w-xs"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="field-input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Inactive</option>
          <option value="overdue">Overdue fees</option>
        </select>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-ink/70">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-ink/70">{c.plan?.planName || '—'}</td>
                <td className="px-4 py-3">
                  <span className={c.isActive ? 'text-chalk-dark' : 'text-steel'}>{c.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openProgress(c)} className="text-xs font-medium text-iron hover:underline">Progress</button>
                  <button onClick={() => setEditing({ ...c })} className="text-xs font-medium text-steel hover:text-ink">Edit</button>
                  <button onClick={() => handleDelete(c)} className="text-xs font-medium text-steel hover:text-ember-dark">Remove</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">No customers match this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal title="Add customer" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="field-label">Full name</label>
              <input className="field-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Username</label>
              <input className="field-input" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Temporary password</label>
              <input type="password" className="field-input" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={8} />
            </div>
            <div className="mb-4">
              <label className="field-label">Phone</label>
              <input className="field-input" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Plan</label>
              <select className="field-input" value={createForm.planId} onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value })}>
                <option value="">No plan</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>{p.planName} — ${p.price}/{p.durationMonths}mo</option>
                ))}
              </select>
            </div>
            {createError && <div className="mb-3 text-sm text-ember-dark">{createError}</div>}
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating…' : 'Create customer'}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSaveEdit}>
            <div className="mb-4">
              <label className="field-label">Full name</label>
              <input className="field-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Phone</label>
              <input className="field-input" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="field-label">Plan</label>
              <select className="field-input" value={editing.plan?._id || editing.plan || ''} onChange={(e) => setEditing({ ...editing, plan: e.target.value })}>
                <option value="">No plan</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>{p.planName} — ${p.price}/{p.durationMonths}mo</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                Active
              </label>
            </div>
            {editError && <div className="mb-3 text-sm text-ember-dark">{editError}</div>}
            <button type="submit" disabled={savingEdit} className="btn-primary w-full">
              {savingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}

      {progressFor && (
        <Modal title={`${progressFor.name} — progress`} onClose={() => setProgressFor(null)} width="max-w-2xl">
          {!progress ? (
            <div className="py-8 text-center text-sm text-steel">Loading…</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="panel px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-steel">Current streak</div>
                  <div className="stat-number mt-1 text-lg">{progress.streak?.currentStreak ?? 0} days</div>
                </div>
                <div className="panel px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-steel">Longest streak</div>
                  <div className="stat-number mt-1 text-lg">{progress.streak?.longestStreak ?? 0} days</div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-steel">Recent weight</div>
                <ul className="space-y-1 text-sm text-ink/80">
                  {progress.weight.slice(0, 5).map((w) => (
                    <li key={w._id}>{new Date(w.date).toLocaleDateString()} — {w.weightKg} kg</li>
                  ))}
                  {progress.weight.length === 0 && <li className="text-steel">No entries yet.</li>}
                </ul>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-steel">Recent workouts</div>
                <ul className="space-y-1 text-sm text-ink/80">
                  {progress.workouts.slice(0, 5).map((w) => (
                    <li key={w._id}>{new Date(w.date).toLocaleDateString()} — {w.isRestDay ? 'Rest day' : w.exercise}</li>
                  ))}
                  {progress.workouts.length === 0 && <li className="text-steel">No entries yet.</li>}
                </ul>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-steel">Recent diet</div>
                <ul className="space-y-1 text-sm text-ink/80">
                  {progress.diet.slice(0, 5).map((d) => (
                    <li key={d._id}>{new Date(d.date).toLocaleDateString()} — {d.meal}{d.calories ? ` (${d.calories} cal)` : ''}</li>
                  ))}
                  {progress.diet.length === 0 && <li className="text-steel">No entries yet.</li>}
                </ul>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
