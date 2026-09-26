import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

const emptyForm = { planName: '', price: '', durationMonths: '' };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await api.get('/admin/plans');
    setPlans(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load plans.'));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSaveError('');
    setShowCreate(true);
  }

  function openEdit(plan) {
    setEditingId(plan._id);
    setForm({ planName: plan.planName, price: plan.price, durationMonths: plan.durationMonths });
    setSaveError('');
    setShowCreate(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    const payload = { planName: form.planName, price: Number(form.price), durationMonths: Number(form.durationMonths) };
    try {
      if (editingId) {
        await api.put(`/admin/plans/${editingId}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setShowCreate(false);
      await load();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save plan.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan) {
    await api.put(`/admin/plans/${plan._id}`, { isActive: !plan.isActive });
    await load();
  }

  async function handleDelete(plan) {
    if (!window.confirm(`Delete "${plan.planName}"? Customers already on it keep their current plan reference.`)) return;
    await api.delete(`/admin/plans/${plan._id}`);
    await load();
  }

  return (
    <div className="page-enter">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline text-ink">Plans & Pricing</h1>
          <p className="text-caption mt-0.5">Membership tiers customers can be assigned to.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
          Add Plan
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan._id} className="panel p-5 flex flex-col justify-between hover:shadow-soft transition-all">
            <div>
              <div className="mb-2 flex items-start justify-between">
                <div className="font-display text-lg font-semibold text-ink">{plan.planName}</div>
                <span className={plan.isActive ? 'badge-active' : 'badge-inactive'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-ink">Rs. {Number(plan.price || 0).toLocaleString()}</span>
                <span className="text-xs text-steel"> / {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-ink/10 pt-3 text-xs font-medium">
              <button onClick={() => openEdit(plan)} className="btn-secondary btn-sm flex-1">Edit</button>
              <button onClick={() => toggleActive(plan)} className="btn-secondary btn-sm flex-1">
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(plan)} className="btn-icon !h-8 !w-8 text-steel hover:text-danger" title="Delete Plan">
                <svg className="icon !h-4 !w-4"><use href="#i-trash" /></svg>
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-6 !w-6 text-steel"><use href="#i-tag" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No plans created yet</h3>
            <p className="text-caption max-w-xs">Create your first membership tier (e.g. Monthly, Quarterly, VIP) to assign to members.</p>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title={editingId ? 'Edit plan' : 'Add plan'} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="field-label">Plan name</label>
              <input className="field-input" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} placeholder="e.g. Premium" required />
            </div>
            <div className="mb-4">
              <label className="field-label">Price (PKR / Rs.)</label>
              <input type="number" className="field-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 5000" required />
            </div>
            <div className="mb-4">
              <label className="field-label">Duration (months)</label>
              <input type="number" className="field-input" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} required />
            </div>
            {saveError && <div className="mb-3 text-sm text-danger">{saveError}</div>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add plan'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
