import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios.js';

const emptyForm = {
  weightKg: '', heightCm: '', chestCm: '', waistCm: '', hipsCm: '', armsCm: '', progressPhotoUrl: '',
};

export default function Weight() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/customer/weight');
    setLogs(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your weight log.'));
  }, []);

  const latest = logs[0];
  const bmi = latest?.weightKg && latest?.heightCm
    ? (latest.weightKg / ((latest.heightCm / 100) ** 2)).toFixed(1)
    : null;

  const chartData = [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({ date: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: l.weightKg }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/customer/weight', {
        weightKg: Number(form.weightKg),
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        measurements: {
          chestCm: form.chestCm ? Number(form.chestCm) : undefined,
          waistCm: form.waistCm ? Number(form.waistCm) : undefined,
          hipsCm: form.hipsCm ? Number(form.hipsCm) : undefined,
          armsCm: form.armsCm ? Number(form.armsCm) : undefined,
        },
        progressPhotoUrl: form.progressPhotoUrl || undefined,
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
    await api.delete(`/customer/weight/${id}`);
    setLogs((prev) => prev.filter((l) => l._id !== id));
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Weight & body</h1>
      <p className="mb-8 text-sm text-steel">Track weight trend, BMI, measurements and progress photos.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Latest weight</div>
          <div className="stat-number mt-1">{latest ? `${latest.weightKg} kg` : '—'}</div>
        </div>
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">BMI</div>
          <div className="stat-number mt-1">{bmi || '—'}</div>
          <div className="mt-1 text-xs text-steel">{bmi ? 'Add height to keep this accurate' : 'Add height for BMI'}</div>
        </div>
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Entries logged</div>
          <div className="stat-number mt-1">{logs.length}</div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="panel mb-8 p-6">
          <div className="mb-4 text-sm font-medium text-steel">Weight trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14171A" strokeOpacity={0.08} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #14171A1A' }} />
              <Line type="monotone" dataKey="weight" stroke="#E1553A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div>
          <label className="field-label">Weight (kg)</label>
          <input type="number" step="0.1" className="field-input" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} required />
        </div>
        <div>
          <label className="field-label">Height (cm)</label>
          <input type="number" className="field-input" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Chest (cm)</label>
          <input type="number" className="field-input" value={form.chestCm} onChange={(e) => setForm({ ...form, chestCm: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Waist (cm)</label>
          <input type="number" className="field-input" value={form.waistCm} onChange={(e) => setForm({ ...form, waistCm: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Hips (cm)</label>
          <input type="number" className="field-input" value={form.hipsCm} onChange={(e) => setForm({ ...form, hipsCm: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Arms (cm)</label>
          <input type="number" className="field-input" value={form.armsCm} onChange={(e) => setForm({ ...form, armsCm: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="field-label">Progress photo URL</label>
          <input className="field-input" value={form.progressPhotoUrl} onChange={(e) => setForm({ ...form, progressPhotoUrl: e.target.value })} placeholder="https://…" />
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
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Chest / Waist / Hips / Arms</th>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(log.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-ink">{log.weightKg} kg</td>
                <td className="px-4 py-3 text-ink/70">
                  {log.measurements?.chestCm ?? '—'} / {log.measurements?.waistCm ?? '—'} / {log.measurements?.hipsCm ?? '—'} / {log.measurements?.armsCm ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {log.progressPhotoUrl ? (
                    <a href={log.progressPhotoUrl} target="_blank" rel="noreferrer" className="text-iron hover:underline">View</a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(log._id)} className="text-xs font-medium text-steel hover:text-ember-dark">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">No weight entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
