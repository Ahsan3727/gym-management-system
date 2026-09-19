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

        const panelColor = isEmber
          ? (app === 'adminApp' ? '#1c2030' : '#151720')
          : t.panel;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`group relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
              isSelected
                ? 'border-ember/50 ring-2 ring-ember/15 shadow-md bg-panel'
                : 'border-ink/10 hover:border-ink/30 bg-panel/60 hover:bg-panel'
            }`}
          >
            {/* Mini app mockup preview */}
            <div
              className="mb-3 w-full rounded-xl overflow-hidden border border-white/10 relative"
              style={{ backgroundColor: bgColor, height: '52px' }}
            >
              {/* Simulated panel strip */}
              <div
                className="absolute inset-x-0 top-0 h-3.5"
                style={{ backgroundColor: panelColor, opacity: 0.9 }}
              />
              {/* Simulated accent avatar dot */}
              <div
                className="absolute top-1 left-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: swatchColor }}
              />
              {/* Simulated nav items */}
              <div className="absolute top-1.5 left-5 flex gap-1">
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: swatchColor, opacity: 0.7 }} />
                <div className="h-1 w-4 rounded-full bg-white opacity-20" />
                <div className="h-1 w-4 rounded-full bg-white opacity-15" />
              </div>
              {/* Simulated stat cards */}
              <div className="absolute inset-x-2 bottom-2 top-5 flex gap-1.5">
                <div className="flex-1 rounded-lg" style={{ backgroundColor: panelColor, opacity: 0.8 }} />
                <div className="flex-1 rounded-lg" style={{ backgroundColor: panelColor, opacity: 0.8 }} />
                <div
                  className="flex-1 rounded-lg"
                  style={{ backgroundColor: swatchColor, opacity: 0.25 }}
                />
              </div>
            </div>
            <div className="text-xs font-bold text-ink truncate w-full">{label}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: swatchColor }}
              />
              <span className="text-[10px] text-steel font-mono uppercase truncate">{swatchColor}</span>
            </div>
            {isSelected && (
              <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-bone text-[10px]">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
