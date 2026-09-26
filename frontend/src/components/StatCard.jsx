import React, { useEffect, useState } from 'react';

/**
 * StatCard — enhanced with:
 *   - count-up animation on numeric values
 *   - trend delta ("+12%" ↑ / "-5%" ↓ with color)
 *   - shimmer skeleton loading state
 *   - stat-pop entrance animation
 *
 * All new props are optional. Existing call sites with only
 * label/value/sub/accent/icon/hi continue to work unchanged.
 */
export default function StatCard({
  label,
  value,
  sub,
  accent = 'text-ink',
  icon,
  hi = false,
  trend,
  trendUp,
  loading = false,
}) {
  const isNumeric = typeof value === 'number';
  const [displayed, setDisplayed] = useState(isNumeric ? 0 : value);

  // Count-up animation for numeric values
  useEffect(() => {
    if (!isNumeric || loading) {
      setDisplayed(value);
      return;
    }
    let startTime = null;
    const duration = 650;
    const startVal = 0;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(startVal + eased * (value - startVal)));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value, isNumeric, loading]);

  // Skeleton state
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton mb-3 h-2.5 w-16" />
        <div className="skeleton mt-1 h-8 w-24" />
        <div className="skeleton mt-2.5 h-2 w-20" />
      </div>
    );
  }

  return (
    <div className={`stat-card stat-pop ${hi ? 'stat-card--hi' : ''}`}>
      {icon && (
        <svg className="icon relative mb-2.5 !h-5 !w-5 text-steel">
          <use href={`#i-${icon}`} />
        </svg>
      )}
      <div className="relative text-overline mb-1">{label}</div>
      <div className={`stat-number relative ${accent}`}>
        {isNumeric ? displayed.toLocaleString() : value}
      </div>
      <div className="relative mt-1 flex items-center gap-2 flex-wrap">
        {sub && <span className="text-caption">{sub}</span>}
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
              trendUp ? 'text-chalk-dark' : 'text-danger'
            }`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
