import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    managerName: '',
    operatingHours: '6:00 AM - 10:00 PM',
    capacity: 100,
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data);
    } catch {
      setError('Could not load gym branches.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddBranch(e) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      await api.post('/admin/branches', {
        ...form,
        capacity: Number(form.capacity),
      });
      setShowAdd(false);
      setForm({
        name: '',
        address: '',
        phone: '',
        managerName: '',
        operatingHours: '6:00 AM - 10:00 PM',
        capacity: 100,
      });
      await load();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add branch.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteBranch(id) {
    if (!window.confirm('Are you sure you want to remove this branch location?')) return;
    try {
      await api.delete(`/admin/branches/${id}`);
      setBranches((prev) => prev.filter((b) => b._id !== id));
    } catch {
      setError('Failed to remove branch.');
    }
  }

  if (loading) return <div className="text-sm text-steel">Loading branches…</div>;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Multi-Branch Locations</h1>
          <p className="text-sm text-steel">Manage physical facilities, branch operating hours, and location managers.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Add Location
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => (
          <div key={b._id} className="panel p-6 relative flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-ink">{b.name}</h3>
                <span className="rounded bg-chalk/10 px-2 py-0.5 text-xs font-semibold text-chalk-dark">
                  Active Location
                </span>
              </div>
              <p className="mt-2 text-xs text-steel">{b.address || 'Address not specified'}</p>

              <div className="mt-4 space-y-1.5 border-t border-ink/5 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-steel">Manager:</span>
                  <span className="font-medium text-ink">{b.managerName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Contact:</span>
                  <span className="font-medium text-ink">{b.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Hours:</span>
                  <span className="font-medium text-ink">{b.operatingHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Facility Capacity:</span>
                  <span className="font-medium text-ink">{b.capacity} members</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-ink/5 pt-3">
              <button
                onClick={() => handleDeleteBranch(b._id)}
                className="text-xs font-medium text-steel hover:text-ember-dark"
              >
                Remove branch
              </button>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full panel p-12 text-center text-sm text-steel">
            No additional branches added yet. Click "+ Add Location" to manage multi-facility chains.
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAdd && (
        <Modal title="Add Gym Branch Location" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddBranch}>
            <div className="mb-3">
              <label className="field-label">Branch Name</label>
              <input
                className="field-input"
                placeholder="e.g. Ironline Downtown / Westside Center"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="field-label">Address</label>
              <input
                className="field-input"
                placeholder="123 Fitness Ave, Suite 4"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Phone</label>
                <input
                  className="field-input"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Location Manager</label>
                <input
                  className="field-input"
                  placeholder="e.g. Sarah Jenkins"
                  value={form.managerName}
                  onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Operating Hours</label>
                <input
                  className="field-input"
                  placeholder="6:00 AM - 10:00 PM"
                  value={form.operatingHours}
                  onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Facility Capacity</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="150"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
            </div>
            {addError && <div className="mb-3 text-sm text-ember-dark">{addError}</div>}
            <button type="submit" disabled={adding} className="btn-primary w-full">
              {adding ? 'Adding…' : 'Create Branch'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
