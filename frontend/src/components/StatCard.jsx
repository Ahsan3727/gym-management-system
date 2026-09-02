import React from 'react';

export default function StatCard({ label, value, sub, accent = 'text-ink' }) {
  return (
    <div className="panel px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-steel">{label}</div>
      <div className={`stat-number mt-1 ${accent}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-steel">{sub}</div>}
    </div>
  );
}
