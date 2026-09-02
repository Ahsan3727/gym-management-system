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
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Plans & pricing</h1>
          <p className="text-sm text-steel">Membership tiers customers can be assigned to.</p>
        </div>
        <button onClick={openCreate} className="btn-primary">Add plan</button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan._id} className="panel p-5">
            <div className="mb-1 flex items-start justify-between">
              <div className="font-display text-lg font-semibold text-ink">{plan.planName}</div>
              <span className={plan.isActive ? 'text-xs text-chalk-dark' : 'text-xs text-steel'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mb-4 text-2xl font-semibold text-iron">
              ${plan.price}
              <span className="text-sm font-normal text-steel"> / {plan.durationMonths}mo</span>
            </div>
            <div className="flex gap-3 text-xs font-medium">
              <button onClick={() => openEdit(plan)} className="text-steel hover:text-ink">Edit</button>
              <button onClick={() => toggleActive(plan)} className="text-steel hover:text-ink">
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(plan)} className="text-steel hover:text-ember-dark">Delete</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="text-sm text-steel">No plans yet — add your first one.</div>}
      </div>

      {showCreate && (
        <Modal title={editingId ? 'Edit plan' : 'Add plan'} onClose={() => setShowCreate(false)}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="field-label">Plan name</label>
              <input className="field-input" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} placeholder="e.g. Premium" required />
            </div>
            <div className="mb-4">
              <label className="field-label">Price</label>
              <input type="number" className="field-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Duration (months)</label>
              <input type="number" className="field-input" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} required />
            </div>
            {saveError && <div className="mb-3 text-sm text-ember-dark">{saveError}</div>}
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add plan'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
