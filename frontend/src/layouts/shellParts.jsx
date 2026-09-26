import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';

export function useAccentClasses(accent = 'ember') {
  // Legacy Tailwind class fallback (kept for non-themed builds / ember/iron/chalk)
  const accentText = { ember: 'text-ember', iron: 'text-iron', chalk: 'text-chalk-dark' }[accent] || 'text-ember';
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';
  const accentActiveBg = { ember: 'bg-ember/10', iron: 'bg-iron/10', chalk: 'bg-chalk/10' }[accent] || 'bg-ember/10';
  const accentIconBg = { ember: 'bg-ember/15', iron: 'bg-iron/15', chalk: 'bg-chalk/15' }[accent] || 'bg-ember/15';

  return { accentText, accentBg, accentActiveBg, accentIconBg };
}

/**
 * Theme-aware accent styles using live CSS variables.
 * Works with all 12 themes — accent colour is always rgb(var(--c-ember))
 * which is overridden per-theme by applyTheme.js.
 * Returns { colorStyle, bgStyle, activeBgStyle, iconBgStyle } as inline style objects.
 */
export function useAccentStyles() {
  return {
    // Solid accent colour — for avatar, brand icon background
    bgStyle:       { backgroundColor: 'rgb(var(--c-ember))' },
    // Active nav item background — subtle tint
    activeBgStyle: { backgroundColor: 'rgb(var(--c-ember) / 0.12)' },
    // Active icon pill background
    iconBgStyle:   { backgroundColor: 'rgb(var(--c-ember) / 0.16)' },
    // Active text colour
    colorStyle:    { color: 'rgb(var(--c-ember))' },
  };
}

export function BrandHeader({
  gymLogo,
  gymName,
  roleLabel,
  brandSub,
  isSuperAdmin,
  onClose,
}) {
  const { bgStyle, colorStyle } = useAccentStyles();
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-ink/8">
      {gymLogo ? (
        <img
          src={gymLogo}
          alt={gymName}
          className="h-10 w-10 shrink-0 rounded-2xl object-cover border border-ink/10 shadow-soft"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-soft" style={bgStyle}>
          <svg className="icon !h-5 !w-5 text-on-primary">
            <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-extrabold tracking-[-0.02em] text-ink uppercase truncate">
          {gymName}
        </div>
        <div className="truncate text-[11px] font-bold uppercase tracking-wide" style={colorStyle}>{roleLabel}</div>
        {brandSub && <div className="mt-0.5 truncate text-xs text-steel">{brandSub}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-steel hover:bg-ink/5 hover:text-ink md:hidden"
          aria-label="Close menu"
        >
          <svg className="icon !h-5 !w-5">
            <use href="#i-close" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function NavItemLink({ item, onClick }) {
  const { activeBgStyle, iconBgStyle, colorStyle } = useAccentStyles();
  return (
    <NavLink to={item.to} end={item.end} className="block" onClick={onClick}>
      {({ isActive }) => (
        <span
          className={`group relative flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-sm transition-all duration-150 ${
            isActive
              ? 'font-semibold'
              : 'font-medium text-steel hover:bg-ink/5 hover:text-ink'
          }`}
          style={isActive ? { ...activeBgStyle, ...colorStyle } : {}}
        >
          {/* Left accent bar — visible only on active item */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{ backgroundColor: 'rgb(var(--c-ember))' }}
            />
          )}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? '' : 'bg-ink/5 group-hover:bg-ink/10'
            }`}
            style={isActive ? iconBgStyle : {}}
          >
            <svg className={`icon !h-[18px] !w-[18px] ${!isActive ? 'text-steel group-hover:text-ink' : ''}`}>
              <use href={`#i-${item.icon || 'dots'}`} />
            </svg>
          </span>
          <span className={`truncate ${!isActive ? 'text-steel group-hover:text-ink' : ''}`}>{item.label}</span>
        </span>
      )}
    </NavLink>
  );
}

export function AccountCard({ user, roleLabel, initials, onLogout }) {
  const { bgStyle } = useAccentStyles();
  return (
    <div className="mx-4 mb-4 mt-2 rounded-[20px] border border-ink/10 bg-bone/60 p-3">
      <div className="mb-3 flex items-center gap-3 px-1">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-on-primary"
          style={bgStyle}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{user?.username}</div>
          <div className="truncate text-xs text-steel">{roleLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle className="flex-1 justify-center" />
        <button
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-ink/15 text-steel transition-colors hover:border-danger/40 hover:text-danger"
        >
          <svg className="icon !h-4 !w-4">
            <use href="#i-logout" />
          </svg>
        </button>
      </div>
    </div>
  );
}
