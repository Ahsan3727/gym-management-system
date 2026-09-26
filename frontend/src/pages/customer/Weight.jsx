import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import { useChartColors } from '../../utils/chartTheme.js';

const emptyForm = {
  weightKg: '',
  heightCm: '',
  chestCm: '',
  waistCm: '',
  hipsCm: '',
  armsCm: '',
  progressPhotoUrl: '',
};

// BMI category → ring color + label, clamped to a 15–35 gauge range.
function bmiGauge(bmi) {
  if (!bmi) return null;
  const clamped = Math.min(Math.max(bmi, 15), 35);
  const pct = (clamped - 15) / (35 - 15);
  let color = 'iron';
  let category = 'Underweight';
  if (bmi >= 18.5 && bmi < 25) {
    color = 'chalk';
    category = 'Normal';
  } else if (bmi >= 25 && bmi < 30) {
    color = 'ember';
    category = 'Overweight';
  } else if (bmi >= 30) {
    color = 'ember';
    category = 'High';
  }
  return { pct, color, category };
}

function BmiRing({ bmi }) {
  const gauge = bmiGauge(bmi);
  const r = 30;
  const c = 2 * Math.PI * r;
  const strokeColor = { iron: 'rgb(var(--c-iron))', chalk: 'rgb(var(--c-chalk))', ember: 'rgb(var(--c-ember))' };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0 -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgb(var(--c-ink) / 0.08)" strokeWidth="7" />
        {gauge && (
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={strokeColor[gauge.color]}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - gauge.pct)}
          />
        )}
      </svg>
      <div>
        <div className="stat-number">{bmi || '—'}</div>
        <div className="mt-0.5 text-xs text-steel">{gauge ? gauge.category : 'Add height for BMI'}</div>
      </div>
    </div>
  );
}

export default function Weight() {
  const chart = useChartColors();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function load() {
    const { data } = await api.get('/customer/weight');
    setLogs(data);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load your weight log.'));
  }, []);

  const latest = logs[0];
  const bmi =
    latest?.weightKg && latest?.heightCm
      ? Number((latest.weightKg / (latest.heightCm / 100) ** 2).toFixed(1))
      : null;

  const chartData = [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: l.weightKg,
    }));

  async function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);

    // Upload to server/Cloudinary
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    try {
      const { data } = await api.post('/upload/progress-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, progressPhotoUrl: data.url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo.');
      setPhotoPreview('');
    } finally {
      setUploading(false);
    }
  }

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
      setPhotoPreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save that entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this weight entry? This cannot be undone.')) return;
    try {
      await api.delete(`/customer/weight/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete entry. Please try again.');
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-headline text-ink">Weight & Body Metrics</h1>
        <p className="text-caption mt-0.5">Track weight trend, BMI, measurements and progress photos.</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon="drop" hi label="Latest weight" value={latest ? `${latest.weightKg} kg` : '—'} />
        <div className="stat-card">
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-steel">BMI</div>
          <BmiRing bmi={bmi} />
        </div>
        <StatCard icon="note" label="Entries logged" value={logs.length} />
      </div>

      {chartData.length > 1 && (
        <div className="panel mb-8 p-6">
          <div className="mb-4 text-sm font-medium text-steel">Weight trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="date" tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} />
              <YAxis
                tick={chart.axisTickStyle(12)}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip contentStyle={chart.tooltipContentStyle} cursor={chart.tooltipCursor} />
              <Line type="monotone" dataKey="weight" stroke={chart.ember} strokeWidth={2} dot={{ r: 3, fill: chart.ember }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel mb-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-4 border-b border-ink/10 pb-3 mb-1">
          <h2 className="text-title text-ink">Log Weight & Measurements</h2>
          <p className="text-caption">Record your body weight, tape measurements, and optional progress photo.</p>
        </div>
        <div>
          <label className="field-label">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            className="field-input"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="field-label">Height (cm)</label>
          <input
            type="number"
            className="field-input"
            value={form.heightCm}
            onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Chest (cm)</label>
          <input
            type="number"
            className="field-input"
            value={form.chestCm}
            onChange={(e) => setForm({ ...form, chestCm: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Waist (cm)</label>
          <input
            type="number"
            className="field-input"
            value={form.waistCm}
            onChange={(e) => setForm({ ...form, waistCm: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Hips (cm)</label>
          <input
            type="number"
            className="field-input"
            value={form.hipsCm}
            onChange={(e) => setForm({ ...form, hipsCm: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Arms (cm)</label>
          <input
            type="number"
            className="field-input"
            value={form.armsCm}
            onChange={(e) => setForm({ ...form, armsCm: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <label className="field-label">Progress photo</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="text-xs text-steel file:mr-2 file:rounded-full file:border-0 file:bg-ink/5 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-ink/10 cursor-pointer"
            />
            {uploading && <span className="text-xs text-ember-dark">Uploading photo…</span>}
          </div>
          {(photoPreview || form.progressPhotoUrl) && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={photoPreview || form.progressPhotoUrl}
                alt="Preview"
                className="h-12 w-12 rounded-2xl object-cover border border-ink/10"
              />
              <span className="text-xs text-chalk-dark font-medium">Photo attached</span>
            </div>
          )}
        </div>

        <div className="col-span-2 md:col-span-4">
          {error && <div className="mb-3 text-sm text-danger">{error}</div>}
          <button type="submit" disabled={saving || uploading} className="btn-primary">
            {saving ? 'Saving…' : 'Log entry'}
          </button>
        </div>
      </form>

      <div className="panel divide-y divide-ink/10 overflow-hidden">
        {logs.map((log) => {
          const m = log.measurements || {};
          const meta = [
            m.chestCm != null ? `Chest: ${m.chestCm}cm` : null,
            m.waistCm != null ? `Waist: ${m.waistCm}cm` : null,
            m.hipsCm != null ? `Hips: ${m.hipsCm}cm` : null,
            m.armsCm != null ? `Arms: ${m.armsCm}cm` : null,
          ].filter(Boolean);
          return (
            <div key={log._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.02] transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-iron/10 text-iron">
                <svg className="icon !h-5 !w-5"><use href="#i-drop" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-ink">{log.weightKg} kg</span>
                  <span className="text-xs text-steel">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {meta.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-steel">
                    {meta.map((item, i) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-ink/5 px-1.5 py-0.5 text-[11px] text-ink/80">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {log.progressPhotoUrl && (
                  <a href={log.progressPhotoUrl} target="_blank" rel="noreferrer" title="View progress photo">
                    <img
                      src={log.progressPhotoUrl}
                      alt="Progress"
                      className="h-9 w-9 rounded-[10px] object-cover border border-ink/10 hover:opacity-90 transition-opacity"
                    />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(log._id)}
                  aria-label="Delete entry"
                  title="Delete weight entry"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-steel hover:bg-danger/10 hover:text-danger transition-colors"
                >
                  <svg className="icon !h-4 !w-4"><use href="#i-trash" /></svg>
                </button>
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
              <svg className="icon !h-6 !w-6 text-steel"><use href="#i-drop" /></svg>
            </div>
            <h3 className="text-title text-ink mb-1">No weight entries yet</h3>
            <p className="text-caption max-w-xs">Use the measurement form above to log your first weigh-in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
