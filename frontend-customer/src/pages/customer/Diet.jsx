import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';

const emptyForm = { meal: '', calories: '', proteinG: '', carbsG: '', fatG: '', waterMl: '' };

export default function Diet() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/customer/diet');
    setLogs(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your diet log.'));
  }, []);

  const today = new Date().toDateString();
  const todaysWater = logs
    .filter((l) => new Date(l.date).toDateString() === today)
    .reduce((sum, l) => sum + (l.waterMl || 0), 0);
  const waterGoalMl = 2500;
  const waterPct = Math.min(100, Math.round((todaysWater / waterGoalMl) * 100));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/customer/diet', {
        meal: form.meal,
        calories: form.calories ? Number(form.calories) : undefined,
        macros: {
          proteinG: form.proteinG ? Number(form.proteinG) : undefined,
          carbsG: form.carbsG ? Number(form.carbsG) : undefined,
          fatG: form.fatG ? Number(form.fatG) : undefined,
        },
        waterMl: form.waterMl ? Number(form.waterMl) : 0,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save that entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/customer/diet/${id}`);
    setLogs((prev) => prev.filter((l) => l._id !== id));
  }

  async function quickWater(amount) {
    await api.post('/customer/diet', { meal: 'Water', waterMl: amount, calories: 0 });
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Diet & water</h1>
      <p className="mb-8 text-sm text-steel">Log meals, macros and how much water you're drinking.</p>

      <div className="panel card--tint mb-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="relative flex items-center gap-4">
          <svg viewBox="0 0 44 44" className="h-11 w-11 shrink-0 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgb(var(--c-ink) / 0.08)" strokeWidth="5" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgb(var(--c-iron))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - waterPct / 100)}
            />
          </svg>
          <div>
            <div className="text-sm font-medium text-steel">Today's water</div>
            <div className="stat-number mt-1">{(todaysWater / 1000).toFixed(1)} L</div>
          </div>
        </div>
        <div className="relative flex gap-2">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => quickWater(ml)} className="btn-secondary">
              <svg className="icon !h-4 !w-4"><use href="#i-drop" /></svg>
              +{ml} ml
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-5">
        <div className="col-span-2">
          <label className="field-label">Meal</label>
          <input className="field-input" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })} placeholder="e.g. Chicken & rice" required />
        </div>
        <div>
          <label className="field-label">Calories</label>
          <input type="number" className="field-input" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Protein (g)</label>
          <input type="number" className="field-input" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Carbs (g)</label>
          <input type="number" className="field-input" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Fat (g)</label>
          <input type="number" className="field-input" value={form.fatG} onChange={(e) => setForm({ ...form, fatG: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Water (ml)</label>
          <input type="number" className="field-input" value={form.waterMl} onChange={(e) => setForm({ ...form, waterMl: e.target.value })} />
        </div>
        <div className="col-span-2 flex items-end md:col-span-3">
          {error && <div className="mb-1 text-sm text-ember-dark">{error}</div>}
        </div>
        <div className="col-span-2 md:col-span-5">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Log entry'}
          </button>
        </div>
      </form>

      <ListCard>
        {logs.map((log) => (
          <ListRow
            key={log._id}
            icon="note"
            title={log.meal}
            subtitle={`${new Date(log.date).toLocaleDateString()}${log.calories != null ? ` · ${log.calories} cal` : ''}${
              log.macros?.proteinG != null ? ` · P${log.macros.proteinG}/C${log.macros.carbsG ?? '—'}/F${log.macros.fatG ?? '—'}` : ''
            }${log.waterMl ? ` · ${log.waterMl} ml water` : ''}`}
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
        {logs.length === 0 && <div className="px-4 py-8 text-center text-sm text-steel">No meals logged yet.</div>}
      </ListCard>
    </div>
  );
}
