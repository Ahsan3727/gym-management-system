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
  const todaysLogs = logs.filter((l) => new Date(l.date).toDateString() === today);
  const todaysWater = todaysLogs.reduce((sum, l) => sum + (l.waterMl || 0), 0);
  const todaysCalories = todaysLogs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const todaysProtein = todaysLogs.reduce((sum, l) => sum + (l.macros?.proteinG || 0), 0);
  const todaysCarbs = todaysLogs.reduce((sum, l) => sum + (l.macros?.carbsG || 0), 0);
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
    if (!window.confirm('Delete this meal entry?')) return;
    try {
      await api.delete(`/customer/diet/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete entry.');
    }
  }

  async function quickWater(amount) {
    await api.post('/customer/diet', { meal: 'Water', waterMl: amount, calories: 0 });
    await load();
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-headline text-ink">Diet & Nutrition</h1>
        <p className="text-caption mt-0.5">Track your daily calories, macronutrients, and hydration goals.</p>
      </div>

      {/* Daily Snapshot Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Today's Calories</div>
          <div className="mt-1 text-2xl font-bold text-ink">{todaysCalories} <span className="text-xs font-normal text-steel">kcal</span></div>
        </div>
        <div className="panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Today's Protein</div>
          <div className="mt-1 text-2xl font-bold text-ember">{todaysProtein}g</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Today's Carbs</div>
          <div className="mt-1 text-2xl font-bold text-iron">{todaysCarbs}g</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Water Progress</div>
          <div className="mt-1 text-2xl font-bold text-chalk-dark">{waterPct}% <span className="text-xs font-normal text-steel">({(todaysWater / 1000).toFixed(1)}L)</span></div>
        </div>
      </div>

      {/* Hydration Tracker */}
      <div className="panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
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
            <div className="text-xs font-semibold uppercase tracking-wider text-steel">Daily Hydration</div>
            <div className="text-base font-bold text-ink mt-0.5">{(todaysWater / 1000).toFixed(1)} L of {(waterGoalMl / 1000).toFixed(1)} L Goal</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => quickWater(ml)} className="btn-secondary btn-sm">
              <svg className="icon !h-4 !w-4"><use href="#i-drop" /></svg>
              +{ml} ml
            </button>
          ))}
        </div>
      </div>

      {/* Log Meal Form */}
      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-5">
        <div className="col-span-2 md:col-span-5 border-b border-ink/10 pb-3 mb-1">
          <h2 className="text-title text-ink">Log Meal or Snack</h2>
          <p className="text-caption">Record meal details, approximate calories and macronutrient breakdown.</p>
        </div>

        <div className="col-span-2">
          <label className="field-label">Meal Description</label>
          <input className="field-input" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })} placeholder="e.g. Grilled Chicken & Quinoa" required />
        </div>
        <div>
          <label className="field-label">Calories (kcal)</label>
          <input type="number" className="field-input" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="e.g. 520" />
        </div>
        <div>
          <label className="field-label">Protein (g)</label>
          <input type="number" className="field-input" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} placeholder="e.g. 45" />
        </div>
        <div>
          <label className="field-label">Carbs (g)</label>
          <input type="number" className="field-input" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} placeholder="e.g. 50" />
        </div>
        <div>
          <label className="field-label">Fat (g)</label>
          <input type="number" className="field-input" value={form.fatG} onChange={(e) => setForm({ ...form, fatG: e.target.value })} placeholder="e.g. 12" />
        </div>
        <div>
          <label className="field-label">Water Added (ml)</label>
          <input type="number" className="field-input" value={form.waterMl} onChange={(e) => setForm({ ...form, waterMl: e.target.value })} placeholder="e.g. 300" />
        </div>
        <div className="col-span-2 flex items-end md:col-span-3">
          {error && <div className="mb-1 text-sm text-danger">{error}</div>}
        </div>
        <div className="col-span-2 md:col-span-5 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Log Meal'}
          </button>
        </div>
      </form>

      {/* Meals List */}
      <div className="panel divide-y divide-ink/10 overflow-hidden">
        {logs.map((log) => (
          <div key={log._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.02] transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-iron/10 text-iron">
              <svg className="icon !h-5 !w-5"><use href="#i-note" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">{log.meal}</span>
                {log.calories != null && <span className="badge-warning">{log.calories} kcal</span>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-steel">
                <span>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                {log.macros?.proteinG != null && (
                  <span>&middot; P: {log.macros.proteinG}g &middot; C: {log.macros.carbsG ?? '—'}g &middot; F: {log.macros.fatG ?? '—'}g</span>
                )}
                {log.waterMl ? <span>&middot; 💧 {log.waterMl} ml</span> : null}
              </div>
            </div>
            <button
              onClick={() => handleDelete(log._id)}
              aria-label="Delete entry"
              title="Delete meal entry"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-steel hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
            >
              <svg className="icon !h-4 !w-4"><use href="#i-trash" /></svg>
            </button>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-6 !w-6 text-steel"><use href="#i-note" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No meals logged yet</h3>
            <p className="text-caption max-w-xs">Use the nutrition form above to record meals, snacks, and track your macros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
