import React from 'react';

const SHELL_OPTIONS = [
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    desc: 'Left sidebar nav with mobile slide-out drawer. Best for desktop admin use.',
    wireframe: (
      <svg viewBox="0 0 80 52" className="w-full h-12 mb-3" aria-hidden="true">
        <rect x="0" y="0" width="22" height="52" rx="2" fill="currentColor" opacity="0.13"/>
        <rect x="2" y="4" width="18" height="4" rx="1" fill="currentColor" opacity="0.45"/>
        <rect x="3" y="12" width="13" height="2.5" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="3" y="17" width="13" height="2.5" rx="1" fill="currentColor" opacity="0.22"/>
        <rect x="3" y="22" width="13" height="2.5" rx="1" fill="currentColor" opacity="0.18"/>
        <rect x="3" y="27" width="13" height="2.5" rx="1" fill="currentColor" opacity="0.15"/>
        <rect x="25" y="4" width="52" height="5" rx="1.5" fill="currentColor" opacity="0.1"/>
        <rect x="25" y="13" width="24" height="10" rx="2" fill="currentColor" opacity="0.12"/>
        <rect x="53" y="13" width="24" height="10" rx="2" fill="currentColor" opacity="0.12"/>
        <rect x="25" y="27" width="52" height="20" rx="2" fill="currentColor" opacity="0.07"/>
      </svg>
    ),
  },
  {
    id: 'bottom-tabs',
    name: 'Bottom Tabs',
    desc: 'App-style sticky bottom tab bar. Best for mobile-first member experience.',
    wireframe: (
      <svg viewBox="0 0 80 52" className="w-full h-12 mb-3" aria-hidden="true">
        <rect x="0" y="0" width="80" height="9" rx="2" fill="currentColor" opacity="0.15"/>
        <rect x="2" y="2" width="20" height="5" rx="1" fill="currentColor" opacity="0.45"/>
        <rect x="0" y="11" width="80" height="30" fill="currentColor" opacity="0.04"/>
        <rect x="4" y="14" width="72" height="6" rx="1.5" fill="currentColor" opacity="0.1"/>
        <rect x="4" y="24" width="34" height="12" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="42" y="24" width="34" height="12" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="0" y="43" width="80" height="9" rx="2" fill="currentColor" opacity="0.2"/>
        <circle cx="10" cy="47.5" r="3" fill="currentColor" opacity="0.55"/>
        <circle cx="27" cy="47.5" r="3" fill="currentColor" opacity="0.3"/>
        <circle cx="44" cy="47.5" r="3" fill="currentColor" opacity="0.3"/>
        <circle cx="61" cy="47.5" r="3" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'top-bar',
    name: 'Top Navigation Bar',
    desc: 'Horizontal top bar with scrolling mobile sub-nav. Best for tablets and large phones.',
    wireframe: (
      <svg viewBox="0 0 80 52" className="w-full h-12 mb-3" aria-hidden="true">
        <rect x="0" y="0" width="80" height="11" rx="2" fill="currentColor" opacity="0.18"/>
        <rect x="2" y="2.5" width="12" height="6" rx="1" fill="currentColor" opacity="0.5"/>
        <rect x="18" y="3.5" width="10" height="4" rx="1" fill="currentColor" opacity="0.32"/>
        <rect x="31" y="3.5" width="10" height="4" rx="1" fill="currentColor" opacity="0.25"/>
        <rect x="44" y="3.5" width="10" height="4" rx="1" fill="currentColor" opacity="0.2"/>
        <circle cx="75" cy="5.5" r="3.5" fill="currentColor" opacity="0.4"/>
        <rect x="4" y="16" width="34" height="10" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="42" y="16" width="34" height="10" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="4" y="30" width="72" height="17" rx="2" fill="currentColor" opacity="0.07"/>
      </svg>
    ),
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
            className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
              isSelected
                ? 'border-ember/50 ring-2 ring-ember/15 shadow-md bg-panel'
                : 'border-ink/10 hover:border-ink/30 bg-panel/60 hover:bg-panel'
            }`}
          >
            {opt.wireframe}
            <div className="text-xs font-bold text-ink">{opt.name}</div>
            <div className="mt-1 text-[11px] text-steel leading-relaxed">{opt.desc}</div>
            {isSelected && (
              <span className="mt-3 inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold text-bone">
                Active Shell
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
