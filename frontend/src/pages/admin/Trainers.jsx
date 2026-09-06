import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';

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
  const [trainerCreatedResult, setTrainerCreatedResult] = useState(null);

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
      const { data } = await api.post('/admin/trainers', form);
      await load();
      if (data.generatedPassword) {
        setTrainerCreatedResult({
          name: form.name,
          username: form.username,
          generatedPassword: data.generatedPassword,
        });
        setForm({ username: '', password: '', name: '', phone: '', specialty: '', bio: '' });
      } else {
        setShowAdd(false);
        setForm({ username: '', password: '', name: '', phone: '', specialty: '', bio: '' });
      }
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
          <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
          Add Trainer
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <ListCard>
        {trainers.map((t) => (
          <ListRow
            key={t._id}
            icon="user"
            iconBg="bg-iron/15 text-iron"
            title={`Coach ${t.name}`}
            subtitle={`${t.specialty || 'General'} · ${t.phone || 'No phone'} · ${t.assignedCustomers?.length || 0} client(s)`}
            trailing={
              <div className="flex items-center gap-3">
                <button onClick={() => openAssignModal(t)} className="text-xs font-medium text-iron hover:underline">
                  Assign clients
                </button>
                <button onClick={() => handleDeleteTrainer(t._id)} className="text-xs font-medium text-steel hover:text-ember-dark">
                  Remove
                </button>
              </div>
            }
          />
        ))}
        {trainers.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-steel">
            No personal trainers added yet. Click "Add Trainer" to onboard coaches.
          </div>
        )}
      </ListCard>

      {/* Add Trainer Modal */}
      {showAdd && (
        <Modal title="Add Personal Trainer" onClose={() => { setShowAdd(false); setTrainerCreatedResult(null); }}>
          {!trainerCreatedResult ? (
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
                  <label className="field-label">
                    Password <span className="font-normal text-steel">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="field-input font-mono"
                    placeholder="Blank = auto-generate"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    minLength={form.password ? 8 : undefined}
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
          ) : (
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-1 font-semibold text-ink">Trainer Account Created</h3>
              <p className="mb-5 text-sm text-steel">
                Give these login credentials to Coach <strong>{trainerCreatedResult.name}</strong>.
              </p>

              <div className="rounded-2xl border border-ink/10 bg-ink/5 px-5 py-4 text-left">
                <div className="mb-3">
                  <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-steel">Username</div>
                  <div className="font-mono text-base text-ink select-all">{trainerCreatedResult.username}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-steel">
                    Auto-Generated Password
                  </div>
                  <div className="font-mono text-xl font-bold tracking-wider text-ink select-all">{trainerCreatedResult.generatedPassword}</div>
                </div>
              </div>

              <p className="mt-4 text-xs text-steel">
                ⚠️ Share this password with the coach. No email is required.
              </p>
              <button
                onClick={() => { setShowAdd(false); setTrainerCreatedResult(null); }}
                className="btn-primary mt-5 w-full"
              >
                Done
              </button>
            </div>
          )}
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
