import React from 'react';

export default function ModePicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-ink/10 bg-panel p-1">
      <button
        type="button"
        onClick={() => onChange('dark')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
          value === 'dark'
            ? 'bg-ink text-paper shadow-sm'
            : 'text-steel hover:text-ink'
        }`}
      >
        <span className="text-sm">🌙</span>
        Dark Mode (Default)
      </button>
      <button
        type="button"
        onClick={() => onChange('light')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
          value === 'light'
            ? 'bg-ink text-paper shadow-sm'
            : 'text-steel hover:text-ink'
        }`}
      >
        <span className="text-sm">☀️</span>
        Light Mode
      </button>
    </div>
  );
}
