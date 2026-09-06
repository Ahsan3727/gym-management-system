import React from 'react';

/**
 * Apex-style vertical timeline — a rail of connected dots, each with a
 * title/time and optional description. Good fit for SuperAdmin's AuditLog
 * or a workout/session history feed (Phase 2).
 *
 *   <Timeline
 *     accent="chalk"
 *     items={[{ id: 1, title: 'Plan updated', time: '2h ago', description: 'Premium price changed to $49' }]}
 *   />
 */
export default function Timeline({ items, accent = 'ember' }) {
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';

  return (
    <div className="relative pl-6">
      <div className="absolute bottom-1 left-[7px] top-1 w-px bg-ink/10" />
      <div className="space-y-6">
        {items.map((item, i) => (
          <div key={item.id ?? i} className="relative">
            <span
              className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-panel ${accentBg}`}
            />
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-semibold text-ink">{item.title}</div>
              {item.time && <div className="shrink-0 text-xs text-steel">{item.time}</div>}
            </div>
            {item.description && <div className="mt-0.5 text-sm text-steel">{item.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
