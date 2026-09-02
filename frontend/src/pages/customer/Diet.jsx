import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

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

      <div className="panel mb-8 flex items-center justify-between px-6 py-5">
        <div>
          <div className="text-sm font-medium text-steel">Today's water</div>
          <div className="stat-number mt-1">{(todaysWater / 1000).toFixed(1)} L</div>
        </div>
        <div className="flex gap-2">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => quickWater(ml)} className="btn-secondary">
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

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Meal</th>
              <th className="px-4 py-3">Calories</th>
              <th className="px-4 py-3">Macros (P/C/F)</th>
              <th className="px-4 py-3">Water</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(log.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-ink">{log.meal}</td>
                <td className="px-4 py-3 text-ink/70">{log.calories ?? '—'}</td>
                <td className="px-4 py-3 text-ink/70">
                  {log.macros?.proteinG ?? '—'}g / {log.macros?.carbsG ?? '—'}g / {log.macros?.fatG ?? '—'}g
                </td>
                <td className="px-4 py-3 text-ink/70">{log.waterMl ? `${log.waterMl} ml` : '—'}</td>
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
                  No meals logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
