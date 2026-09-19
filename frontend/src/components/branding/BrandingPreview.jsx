import React, { useEffect, useRef } from 'react';
import { applyTheme } from '../../theme/applyTheme.js';
import StatCard from '../StatCard.jsx';

export default function BrandingPreview({ settings, app = 'memberApp', gymName = 'Sample Gym' }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current) {
      applyTheme(settings, app, previewRef.current);
    }
  }, [settings, app]);

  const isLight = settings?.defaultMode === 'light';

  return (
    <div
      ref={previewRef}
      className={`rounded-2xl border border-ink/10 p-5 transition-colors ${
        isLight ? 'light bg-[#F6F5F1] text-[#14171A]' : 'bg-[#0b0c10] text-[#f6f6f8]'
      }`}
      style={{ minHeight: '380px' }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ember text-on-primary font-bold text-xs">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink">{gymName}</div>
            <div className="text-[10px] text-steel capitalize">{app.replace('App', ' Portal')} · {settings.theme}</div>
          </div>
        </div>
        <span className="rounded-md border border-ink/10 bg-panel px-2 py-0.5 text-[10px] font-semibold uppercase text-steel">
          Live Scoped Preview
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon="flame"
          hi
          label={app === 'memberApp' ? 'Current Streak' : 'Active Members'}
          value={app === 'memberApp' ? '14d' : '342'}
          accent={app === 'memberApp' ? 'text-ember' : 'text-iron'}
        />
        <StatCard
          icon="card"
          label={app === 'memberApp' ? 'Monthly Plan' : 'Revenue'}
          value={app === 'memberApp' ? 'Premium Tier' : 'Rs. 420k'}
        />
      </div>

      <div className="panel p-4 mb-4">
        <div className="text-xs font-semibold text-ink mb-1">Interactive Action Card</div>
        <div className="text-xs text-steel mb-3">
          This card renders using the tenant's derived tokens and surface styling.
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs py-1.5 px-3">
            Primary Action
          </button>
          <button type="button" className="btn-secondary text-xs py-1.5 px-3">
            Secondary
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger flex items-center gap-2">
        <span>⚠️</span>
        <span>Error & overdue alert state stays accessible red across all themes.</span>
      </div>
    </div>
  );
}
