import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios.js';
import SegmentedControl from '../../components/SegmentedControl.jsx';
import { useChartColors } from '../../utils/chartTheme.js';

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

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');
  const chart = useChartColors();

  const days = RANGE_DAYS[range];

  useEffect(() => {
    api.get('/customer/analytics', { params: { days } })
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load analytics.'));
  }, [days]);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [days]);


  if (error) return <div className="text-sm text-danger">{error}</div>;
  if (!data) return <div className="text-sm text-steel">Loading…</div>;

  const weightSeries = data.weight
    .filter((w) => new Date(w.date) >= cutoff)
    .map((w) => ({ date: fmtDate(w.date), weight: w.weightKg }));
  const calorieSeries = data.diet
    .filter((d) => d.calories != null && new Date(d.date) >= cutoff)
    .map((d) => ({ date: fmtDate(d.date), calories: d.calories }));
  const workoutSeries = consistencyByDay(data.workouts, days);

  return (
    <div className="page-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline text-ink">Analytics</h1>
          <p className="text-caption mt-0.5">Weight, training &amp; nutrition over the selected window</p>
        </div>
        <SegmentedControl
          options={[{ value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '90d', label: '90D' }]}
          value={range}
          onChange={setRange}
        />
      </div>

      <div className="mb-8 panel p-6">
        <h2 className="text-title text-ink mb-1">Weight Trend</h2><p className="text-caption mb-4">Bodyweight over selected period</p>
        {weightSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightSeries}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="date" tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} />
              <YAxis tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={chart.tooltipContentStyle} cursor={chart.tooltipCursor} />
              <Line type="monotone" dataKey="weight" stroke={chart.ember} strokeWidth={2} dot={{ r: 3, fill: chart.ember }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center py-10 text-center"><svg className="icon !h-8 !w-8 text-steel mb-3"><use href="#i-trend" /></svg><p className="text-caption">Log weight on a few different days to see your trend</p></div>
        )}
      </div>

      <div className="mb-8 panel p-6">
        <h2 className="text-title text-ink mb-1">Workout Consistency</h2><p className="text-caption mb-4">Daily training sessions logged</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workoutSeries}>
            <CartesianGrid {...chart.gridProps} />
            <XAxis dataKey="date" tick={chart.axisTickStyle(11)} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(days / 7))} />
            <YAxis tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={chart.tooltipContentStyle} cursor={chart.tooltipCursor} />
            <Bar dataKey="sessions" fill={chart.iron} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel p-6">
        <h2 className="text-title text-ink mb-1">Calorie Trend</h2><p className="text-caption mb-4">Daily caloric intake from meal logs</p>
        {calorieSeries.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={calorieSeries}>
              <CartesianGrid {...chart.gridProps} />
              <XAxis dataKey="date" tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} />
              <YAxis tick={chart.axisTickStyle(12)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chart.tooltipContentStyle} cursor={chart.tooltipCursor} />
              <Line type="monotone" dataKey="calories" stroke={chart.chalk} strokeWidth={2} dot={{ r: 3, fill: chart.chalk }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center py-10 text-center"><svg className="icon !h-8 !w-8 text-steel mb-3"><use href="#i-trend" /></svg><p className="text-caption">Log meals with calorie counts to see a trend</p></div>
        )}
      </div>
    </div>
  );
}
