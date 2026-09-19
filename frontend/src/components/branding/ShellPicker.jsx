import React from 'react';

const SHELL_OPTIONS = [
  {
    id: 'sidebar',
    name: 'Sidebar Layout (Desktop Classic)',
    desc: 'Collapsible left sidebar nav with mobile slide-out drawer.',
    icon: '▥',
  },
  {
    id: 'bottom-tabs',
    name: 'Bottom Tab Bar (Mobile First)',
    desc: 'App-style sticky bottom tab bar with 5 primary destinations + More sheet.',
    icon: '▤',
  },
  {
    id: 'top-bar',
    name: 'Top Navigation Bar (Header Full)',
    desc: 'Clean horizontal top bar navigation with compact action bar.',
    icon: '▰',
  },
];

export default function ShellPicker({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SHELL_OPTIONS.map((opt) => {
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
            <div className="mb-2 text-2xl">{opt.icon}</div>
            <div className="text-xs font-bold text-ink">{opt.name}</div>
            <div className="mt-1 text-[11px] text-steel">{opt.desc}</div>
            {isSelected && (
              <span className="mt-3 inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">
                Active Shell
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
