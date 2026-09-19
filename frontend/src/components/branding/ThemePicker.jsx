import React from 'react';
import { THEMES } from '../../theme/themes.js';

export default function ThemePicker({ value, onChange, app = 'memberApp' }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Object.entries(THEMES).map(([id, t]) => {
        const isSelected = value === id;
        const isEmber = id === 'ember';

        // D11: In adminApp, 'ember' is labeled "Default (current)" with iron swatch
        const label = isEmber && app === 'adminApp' ? 'Default (current)' : t.label;
        const swatchColor = isEmber
          ? (app === 'adminApp' ? '#5ea8ff' : '#ff4e1f')
          : t.primary;

        const bgColor = isEmber
          ? (app === 'adminApp' ? '#15171c' : '#0b0c10')
          : t.bg;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`group relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
              isSelected
                ? 'border-ink ring-2 ring-ink/20 shadow-md bg-panel'
                : 'border-ink/10 hover:border-ink/30 bg-panel/60 hover:bg-panel'
            }`}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full shadow-sm border border-white/20"
                style={{ backgroundColor: swatchColor }}
              />
              <span
                className="h-6 w-6 rounded-full border border-white/10"
                style={{ backgroundColor: bgColor }}
              />
            </div>
            <div className="text-xs font-bold text-ink truncate w-full">{label}</div>
            <div className="mt-0.5 text-[10px] text-steel font-mono uppercase">{swatchColor}</div>
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-paper text-[10px]">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
