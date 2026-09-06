import React from 'react';

/**
 * A single row inside a <ListCard>. Renders as a <button> (with a hover
 * state and trailing chevron) when `onClick` is given, otherwise a plain
 * <div> for rows that are just informational.
 *
 *   <ListCard>
 *     <ListRow icon="user" title="Jordan Blake" subtitle="Premium plan" trailing="Active" onClick={...} />
 *   </ListCard>
 */
export default function ListRow({ icon, iconBg = 'bg-ink/5', title, subtitle, trailing, onClick }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors ${
        onClick ? 'hover:bg-ink/5' : ''
      }`}
    >
      {icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <svg className="icon !h-5 !w-5">
            <use href={`#i-${icon}`} />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{title}</div>
        {subtitle && <div className="truncate text-xs text-steel">{subtitle}</div>}
      </div>
      {trailing && <div className="shrink-0 text-sm text-steel">{trailing}</div>}
      {onClick && (
        <svg className="icon !h-4 !w-4 shrink-0 text-steel-light">
          <use href="#i-chevron-r" />
        </svg>
      )}
    </Comp>
  );
}
