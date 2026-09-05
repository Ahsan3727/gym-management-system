import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';

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

      <ListCard>
        {logs.map((log) => (
          <ListRow
            key={log._id}
            icon={log.isRestDay ? 'moon' : 'dumbbell'}
            title={log.isRestDay ? 'Rest day' : log.exercise}
            subtitle={`${new Date(log.date).toLocaleDateString()}${
              log.sets && log.reps ? ` · ${log.sets} × ${log.reps}` : ''
            }${log.weight ? ` · ${log.weight} kg` : ''}${log.durationMinutes ? ` · ${log.durationMinutes} min` : ''}`}
            trailing={
              <button
                onClick={() => handleDelete(log._id)}
                aria-label="Delete entry"
                className="flex h-8 w-8 items-center justify-center rounded-full text-steel transition-colors hover:bg-ember/10 hover:text-ember-dark"
              >
                <svg className="icon !h-4 !w-4"><use href="#i-minus" /></svg>
              </button>
            }
          />
        ))}
        {logs.length === 0 && <div className="px-4 py-8 text-center text-sm text-steel">No workouts logged yet.</div>}
      </ListCard>
    </div>
  );
}
