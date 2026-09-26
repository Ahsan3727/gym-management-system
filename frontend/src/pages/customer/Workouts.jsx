import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const emptyForm = { exercise: '', sets: '', reps: '', weight: '', durationMinutes: '', isRestDay: false, notes: '' };

export default function Workouts() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/customer/workouts');
    setLogs(data);
  }

  useEffect(() => {
    load()
      .catch(() => setError('Could not load your workout log.'))
      .finally(() => setLoading(false));
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
    if (!window.confirm('Delete this workout entry? This cannot be undone.')) return;
    try {
      await api.delete(`/customer/workouts/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete entry. Please try again.');
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-headline text-ink">Workouts</h1>
        <p className="text-caption mt-0.5">Log sets, reps, weight and duration — or mark a rest day.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-4 border-b border-ink/10 pb-3 mb-1">
          <h2 className="text-title text-ink">Log Workout Entry</h2>
          <p className="text-caption">Record your daily training or schedule recovery.</p>
        </div>

        <div className="col-span-2 md:col-span-2">
          <label className="field-label">Exercise</label>
          <input
            className="field-input"
            value={form.exercise}
            onChange={(e) => setForm({ ...form, exercise: e.target.value })}
            placeholder="e.g. Back squat"
            disabled={form.isRestDay}
            required={!form.isRestDay}
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
          <input className="field-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Felt strong on last set" />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-ink/20"
              checked={form.isRestDay}
              onChange={(e) => setForm({ ...form, isRestDay: e.target.checked })}
            />
            <span>Rest day</span>
          </label>
        </div>
        <div className="col-span-2 md:col-span-4 pt-2">
          {error && <div className="mb-3 text-sm text-danger">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Log entry'}
          </button>
        </div>
      </form>

      <div className="panel divide-y divide-ink/10 overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-steel">Loading workouts…</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-6 !w-6 text-steel"><use href="#i-dumbbell" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No workouts logged yet</h3>
            <p className="text-caption max-w-xs">Use the form above to record your first workout session or recovery day.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.02] transition-colors">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-xs font-bold ${
                  log.isRestDay ? 'bg-iron/10 text-iron' : 'bg-ember/10 text-ember-dark'
                }`}
              >
                <svg className="icon !h-5 !w-5">
                  <use href={log.isRestDay ? '#i-moon' : '#i-dumbbell'} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {log.isRestDay ? 'Rest day' : log.exercise}
                  </span>
                  {log.isRestDay ? (
                    <span className="badge-info">Recovery</span>
                  ) : (
                    log.weight && <span className="badge-active">{log.weight} kg</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-steel">
                  <span>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {log.sets && log.reps && <span>&middot; {log.sets} &times; {log.reps} reps</span>}
                  {log.durationMinutes && <span>&middot; {log.durationMinutes} min</span>}
                  {log.notes && <span className="italic text-ink/70">&middot; "{log.notes}"</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(log._id)}
                aria-label="Delete entry"
                title="Delete workout"
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-steel hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
              >
                <svg className="icon !h-4 !w-4"><use href="#i-trash" /></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
