import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const emptyForm = { exercise: '', sets: '', reps: '', weight: '', durationMinutes: '', isRestDay: false, notes: '' };

export default function Workouts() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/customer/workouts');
    setLogs(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your workout log.'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        sets: form.sets ? Number(form.sets) : undefined,
        reps: form.reps ? Number(form.reps) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      };
      await api.post('/customer/workouts', payload);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save that entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/customer/workouts/${id}`);
    setLogs((prev) => prev.filter((l) => l._id !== id));
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Workouts</h1>
      <p className="mb-8 text-sm text-steel">Log sets, reps, weight and duration — or mark a rest day.</p>

      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-2">
          <label className="field-label">Exercise</label>
          <input
            className="field-input"
            value={form.exercise}
            onChange={(e) => setForm({ ...form, exercise: e.target.value })}
            placeholder="e.g. Back squat"
            disabled={form.isRestDay}
          />
        </div>
        <div>
          <label className="field-label">Sets</label>
          <input type="number" className="field-input" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} disabled={form.isRestDay} />
        </div>
        <div>
          <label className="field-label">Reps</label>
          <input type="number" className="field-input" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} disabled={form.isRestDay} />
        </div>
        <div>
          <label className="field-label">Weight (kg)</label>
          <input type="number" className="field-input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} disabled={form.isRestDay} />
        </div>
        <div>
          <label className="field-label">Duration (min)</label>
          <input type="number" className="field-input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="field-label">Notes</label>
          <input className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={form.isRestDay}
              onChange={(e) => setForm({ ...form, isRestDay: e.target.checked })}
            />
            Rest day
          </label>
        </div>
        <div className="col-span-2 md:col-span-4">
          {error && <div className="mb-3 text-sm text-ember-dark">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Log entry'}
          </button>
        </div>
      </form>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Exercise</th>
              <th className="px-4 py-3">Sets × reps</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(log.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-ink">{log.isRestDay ? 'Rest day' : log.exercise}</td>
                <td className="px-4 py-3 text-ink/70">{log.sets && log.reps ? `${log.sets} × ${log.reps}` : '—'}</td>
                <td className="px-4 py-3 text-ink/70">{log.weight ? `${log.weight} kg` : '—'}</td>
                <td className="px-4 py-3 text-ink/70">{log.durationMinutes ? `${log.durationMinutes} min` : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(log._id)} className="text-xs font-medium text-steel hover:text-ember-dark">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-steel">
                  No workouts logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
