import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add trainer modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    specialty: '',
    bio: '',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Assign clients modal
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [savingAssign, setSavingAssign] = useState(false);

  async function load() {
    try {
      const [trainersRes, customersRes] = await Promise.all([
        api.get('/admin/trainers'),
        api.get('/admin/customers'),
      ]);
      setTrainers(trainersRes.data);
      setCustomers(customersRes.data);
    } catch {
      setError('Could not load trainers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddTrainer(e) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      await api.post('/admin/trainers', form);
      setShowAdd(false);
      setForm({ username: '', password: '', name: '', phone: '', specialty: '', bio: '' });
      await load();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add trainer.');
    } finally {
      setAdding(false);
    }
  }

  function openAssignModal(trainer) {
    setEditingTrainer(trainer);
    setSelectedClientIds((trainer.assignedCustomers || []).map((c) => c._id || c));
  }

  async function handleSaveAssignments(e) {
    e.preventDefault();
    setSavingAssign(true);
    try {
      await api.put(`/admin/trainers/${editingTrainer._id}`, {
        assignedCustomers: selectedClientIds,
      });
      setEditingTrainer(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update trainer assignments.');
    } finally {
      setSavingAssign(false);
    }
  }

  async function handleDeleteTrainer(id) {
    if (!window.confirm('Are you sure you want to remove this trainer account?')) return;
    try {
      await api.delete(`/admin/trainers/${id}`);
      setTrainers((prev) => prev.filter((t) => t._id !== id));
    } catch {
      setError('Failed to remove trainer.');
    }
  }

  function toggleClientSelection(customerId) {
    setSelectedClientIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  }

  if (loading) return <div className="text-sm text-steel">Loading trainers…</div>;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Personal Trainers & Staff</h1>
          <p className="text-sm text-steel">Manage coaching staff, specialty assignments, and member allocations.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Add Trainer
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Trainer</th>
              <th className="px-4 py-3">Username / Login</th>
              <th className="px-4 py-3">Specialty</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Assigned Clients</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((t) => (
              <tr key={t._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">Coach {t.name}</td>
                <td className="px-4 py-3 text-xs font-mono text-steel">{t.user?.username || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink/70">{t.specialty || 'General'}</td>
                <td className="px-4 py-3 text-xs text-steel">{t.phone || '—'}</td>
                <td className="px-4 py-3 text-xs font-medium text-ink">
                  {t.assignedCustomers?.length || 0} client(s)
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => openAssignModal(t)}
                    className="text-xs font-medium text-iron hover:underline"
                  >
                    Assign clients
                  </button>
                  <button
                    onClick={() => handleDeleteTrainer(t._id)}
                    className="text-xs font-medium text-steel hover:text-ember-dark"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {trainers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-steel">
                  No personal trainers added yet. Click "+ Add Trainer" to onboard coaches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Trainer Modal */}
      {showAdd && (
        <Modal title="Add Personal Trainer" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddTrainer}>
            <div className="mb-3">
              <label className="field-label">Trainer Name</label>
              <input
                className="field-input"
                placeholder="e.g. Marcus Vance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Username</label>
                <input
                  className="field-input"
                  placeholder="e.g. coach.marcus"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Password</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Phone</label>
                <input
                  className="field-input"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Specialty</label>
                <input
                  className="field-input"
                  placeholder="e.g. Hypertrophy, CrossFit"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="field-label">Biography / Notes</label>
              <textarea
                className="field-input"
                rows={2}
                placeholder="Certifications, experience..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            {addError && <div className="mb-3 text-sm text-ember-dark">{addError}</div>}
            <button type="submit" disabled={adding} className="btn-primary w-full">
              {adding ? 'Adding…' : 'Create Trainer Account'}
            </button>
          </form>
        </Modal>
      )}

      {/* Assign Clients Modal */}
      {editingTrainer && (
        <Modal
          title={`Assign Clients to Coach ${editingTrainer.name}`}
          onClose={() => setEditingTrainer(null)}
        >
          <form onSubmit={handleSaveAssignments}>
            <p className="text-xs text-steel mb-4">
              Select the gym members who will be coached by this trainer. Trainers can only view workouts and assign plans to their assigned clients.
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-ink/10 rounded-lg p-3 mb-4">
              {customers.map((c) => (
                <label
                  key={c._id}
                  className="flex items-center justify-between p-2 rounded hover:bg-ink/[0.03] cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(c._id)}
                      onChange={() => toggleClientSelection(c._id)}
                    />
                    <span className="font-medium text-ink">{c.name}</span>
                  </div>
                  <span className="text-steel">{c.phone || 'No phone'}</span>
                </label>
              ))}
              {customers.length === 0 && (
                <div className="text-center text-xs text-steel py-4">No gym members found.</div>
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-steel mb-4">
              <span>{selectedClientIds.length} client(s) selected</span>
            </div>
            <button type="submit" disabled={savingAssign} className="btn-primary w-full">
              {savingAssign ? 'Saving…' : 'Update Client Assignments'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
