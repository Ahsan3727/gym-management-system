import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios.js';

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Buckets a list of {date} items into a count-per-day map for the last N days.
function consistencyByDay(items, days = 30) {
  const map = {};
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map[d.toDateString()] = 0;
  }
  items.forEach((item) => {
    const key = new Date(item.date).toDateString();
    if (key in map) map[key] += 1;
  });
  return Object.entries(map).map(([date, count]) => ({ date: fmtDate(date), sessions: count }));
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/customer/analytics')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load analytics.'));
  }, []);

  if (error) return <div className="text-sm text-ember-dark">{error}</div>;
  if (!data) return <div className="text-sm text-steel">Loading…</div>;

  const weightSeries = data.weight.map((w) => ({ date: fmtDate(w.date), weight: w.weightKg }));
  const calorieSeries = data.diet
    .filter((d) => d.calories != null)
    .map((d) => ({ date: fmtDate(d.date), calories: d.calories }));
  const workoutSeries = consistencyByDay(data.workouts);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Analytics</h1>
      <p className="mb-8 text-sm text-steel">Last 30 days across weight, training and nutrition.</p>

      <div className="mb-8 panel p-6">
        <div className="mb-4 text-sm font-medium text-steel">Weight over time</div>
        {weightSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14171A" strokeOpacity={0.08} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #14171A1A' }} />
              <Line type="monotone" dataKey="weight" stroke="#E1553A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-sm text-steel">Log weight on a few different days to see a trend.</div>
        )}
      </div>

      <div className="mb-8 panel p-6">
        <div className="mb-4 text-sm font-medium text-steel">Workout consistency</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workoutSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#14171A" strokeOpacity={0.08} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#545B62' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #14171A1A' }} />
            <Bar dataKey="sessions" fill="#2F5D8A" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel p-6">
        <div className="mb-4 text-sm font-medium text-steel">Calorie trend</div>
        {calorieSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={calorieSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14171A" strokeOpacity={0.08} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#545B62' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #14171A1A' }} />
              <Line type="monotone" dataKey="calories" stroke="#A8C23A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-sm text-steel">Log calories on a few meals to see a trend.</div>
        )}
      </div>
    </div>
  );
}
