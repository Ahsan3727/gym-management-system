import React from 'react';

/**
 * Apex-style pill segmented control — a fit for things like Analytics'
 * time-range switch (7d/30d/90d) or Diet's meal-type filter, replacing
 * plain button groups in Phase 2.
 *
 *   <SegmentedControl
 *     options={[{ value: '7d', label: '7D' }, { value: '30d', label: '30D' }]}
 *     value={range}
 *     onChange={setRange}
 *     accent="ember"
 *   />
 *
 * `options` also accepts a plain string array (used as both value and label).
 */
export default function SegmentedControl({ options, value, onChange, accent = 'ember', className = '' }) {
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';

  return (
    <div className={`inline-flex rounded-full border border-ink/10 bg-panel p-1 ${className}`}>
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        const active = optValue === value;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
              active ? `${accentBg} text-white shadow-soft` : 'text-steel hover:text-ink'
            }`}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}
