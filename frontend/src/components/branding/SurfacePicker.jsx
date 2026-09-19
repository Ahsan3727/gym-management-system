import React from 'react';

const SURFACE_OPTIONS = [
  {
    id: 'accent',
    name: 'Accent Clean',
    desc: 'Clean, modern neutral card panels with vibrant theme accent strokes and icons.',
  },
  {
    id: 'tinted',
    name: 'Subtle Tinted',
    desc: 'Soft atmospheric background color-mix wash across all surfaces.',
  },
  {
    id: 'bold',
    name: 'Bold Highlight',
    desc: 'High-energy brand gradient hero sections and saturated primary buttons.',
  },
];

export default function SurfacePicker({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SURFACE_OPTIONS.map((opt) => {
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
                Active Surface
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
