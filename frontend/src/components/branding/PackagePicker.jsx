import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios.js';
import { BRAND_PACKAGES } from './packages.js';
import { THEMES } from '../../theme/themes.js';

/**
 * Horizontally scrolling row of curated + custom brand package cards.
 * DB packages (created by superadmin) appear first, hardcoded built-ins after.
 * Clicking a card calls onSelect(pkg) — parent fills both app drafts.
 * DB packages show a ✕ delete button.
 */
export default function PackagePicker({ activeTab, onSelect, refreshKey = 0 }) {
  const [dbPackages, setDbPackages] = useState([]);
  const [deleting, setDeleting] = useState(null);

  const fetchPackages = useCallback(() => {
    api.get('/superadmin/brand-packages')
      .then((r) => setDbPackages(r.data))
      .catch(() => {}); // graceful fail — built-ins still show
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages, refreshKey]);

  async function handleDelete(pkg, e) {
    e.stopPropagation(); // don't trigger onSelect
    if (!window.confirm(`Delete package "${pkg.name}"?`)) return;
    setDeleting(pkg._id);
    try {
      await api.delete(`/superadmin/brand-packages/${pkg._id}`);
      setDbPackages((prev) => prev.filter((p) => p._id !== pkg._id));
    } catch {
      // leave list unchanged on error
    }
    setDeleting(null);
  }

  // DB packages first (custom), then hardcoded built-ins
  const allPackages = [
    ...dbPackages.map((p) => ({ ...p, isCustom: true })),
    ...BRAND_PACKAGES,
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-steel">
          ✨ Start with a Package
        </label>
        <span className="text-[10px] text-steel/70">Click to pre-fill — then customise below</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {allPackages.map((pkg) => {
          const pkgKey = pkg._id || pkg.id;
          const settings = pkg[activeTab] || pkg.memberApp;
          const t = THEMES[settings.theme] || {};
          const bg     = t.bg    || '#0b0c10';
          const panel  = t.panel || '#151720';
          const accent = t.primary || '#ff4e1f';
          const isDeleting = deleting === pkg._id;

          return (
            <div key={pkgKey} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => onSelect(pkg)}
                className="w-44 flex flex-col items-start rounded-2xl border border-ink/10
                           hover:border-ink/30 bg-panel/60 hover:bg-panel p-3.5 text-left
                           transition-all hover:shadow-lg hover:-translate-y-0.5 duration-150"
              >
                {/* Mini app mockup */}
                <div
                  className="mb-3 w-full rounded-xl overflow-hidden border border-white/10 relative"
                  style={{ backgroundColor: bg, height: '56px' }}
                >
                  <div className="absolute inset-x-0 top-0 h-4" style={{ backgroundColor: panel, opacity: 0.92 }} />
                  <div className="absolute top-1 left-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                  <div className="absolute top-1.5 left-5 flex gap-1">
                    <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accent, opacity: 0.75 }} />
                    <div className="h-1 w-5 rounded-full bg-white opacity-20" />
                    <div className="h-1 w-4 rounded-full bg-white opacity-15" />
                  </div>
                  <div className="absolute inset-x-2 bottom-2 top-6 flex gap-1.5">
                    <div className="flex-1 rounded-lg" style={{ backgroundColor: panel, opacity: 0.8 }} />
                    <div className="flex-1 rounded-lg" style={{ backgroundColor: panel, opacity: 0.8 }} />
                    <div className="flex-1 rounded-lg" style={{ backgroundColor: accent, opacity: 0.22 }} />
                  </div>
                  {/* Custom badge */}
                  {pkg.isCustom && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-sm bg-black/40 px-1 text-[8px] font-semibold uppercase tracking-wide text-white/70">
                      custom
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{pkg.emoji}</span>
                  <span className="text-xs font-bold text-ink truncate max-w-[120px]">{pkg.name}</span>
                </div>
                <div className="text-[10px] text-steel leading-tight mb-2 line-clamp-1">{pkg.tagline}</div>

                {/* Badge pills */}
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-md bg-ink/8 px-1.5 py-0.5 text-[9px] font-mono uppercase text-steel">
                    {settings.theme}
                  </span>
                  <span className="rounded-md bg-ink/8 px-1.5 py-0.5 text-[9px] font-mono uppercase text-steel">
                    {settings.shell === 'bottom-tabs' ? 'btm-tabs' : settings.shell}
                  </span>
                  <span className="rounded-md bg-ink/8 px-1.5 py-0.5 text-[9px] font-mono uppercase text-steel">
                    {settings.dashboard}
                  </span>
                </div>
              </button>

              {/* Delete button — custom packages only */}
              {pkg.isCustom && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(pkg, e)}
                  disabled={isDeleting}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center
                             rounded-full bg-danger text-white text-[10px] font-bold shadow-md
                             hover:brightness-110 transition-all disabled:opacity-50"
                  aria-label={`Delete ${pkg.name}`}
                  title="Delete package"
                >
                  {isDeleting ? '…' : '✕'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
