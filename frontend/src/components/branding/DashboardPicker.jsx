import React from 'react';

const DASHBOARD_OPTIONS = [
  {
    id: 'classic',
    name: 'Classic Full',
    desc: 'Standard expansive grid displaying all KPI stat cards, charts, and activity feeds.',
  },
  {
    id: 'focus',
    name: 'Focus Priority',
    desc: 'Highlighted check-in banner, primary streak, and core membership actions prioritized at top.',
  },
  {
    id: 'compact',
    name: 'Compact Streamlined',
    desc: 'Dense, clean multi-column layout optimized for quick mobile scanning.',
  },
];

export default function DashboardPicker({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {DASHBOARD_OPTIONS.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
              isSelected
                ? 'border-ink ring-2 ring-ink/20 shadow-md bg-panel'
                : 'border-ink/10 hover:border-ink/30 bg-panel/60 hover:bg-panel'
            }`}
          >
            <div className="text-xs font-bold text-ink">{opt.name}</div>
            <div className="mt-1 text-[11px] text-steel">{opt.desc}</div>
            {isSelected && (
              <span className="mt-2.5 inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">
                Active Preset
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
