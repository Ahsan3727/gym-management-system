import React from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.jsx';

export function useAccentClasses(accent = 'ember') {
  const accentText = { ember: 'text-ember', iron: 'text-iron', chalk: 'text-chalk-dark' }[accent] || 'text-ember';
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';
  const accentActiveBg = { ember: 'bg-ember/10', iron: 'bg-iron/10', chalk: 'bg-chalk/10' }[accent] || 'bg-ember/10';
  const accentIconBg = { ember: 'bg-ember/15', iron: 'bg-iron/15', chalk: 'bg-chalk/15' }[accent] || 'bg-ember/15';

  return { accentText, accentBg, accentActiveBg, accentIconBg };
}

export function BrandHeader({
  gymLogo,
  gymName,
  roleLabel,
  brandSub,
  accentBg,
  accentText,
  isSuperAdmin,
  onClose,
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-6 border-b border-ink/5">
      {gymLogo ? (
        <img
          src={gymLogo}
          alt={gymName}
          className="h-10 w-10 shrink-0 rounded-2xl object-cover border border-ink/10 shadow-soft"
        />
      ) : (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accentBg} shadow-soft`}>
          <svg className="icon !h-5 !w-5 text-on-primary">
            <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-extrabold tracking-[-0.02em] text-ink uppercase truncate">
          {gymName}
        </div>
        <div className={`truncate text-[11px] font-bold uppercase tracking-wide ${accentText}`}>{roleLabel}</div>
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

export function NavItemLink({ item, accentActiveBg, accentText, accentIconBg, onClick }) {
  return (
    <NavLink to={item.to} end={item.end} className="block" onClick={onClick}>
      {({ isActive }) => (
        <span
          className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
            isActive ? `${accentActiveBg} ${accentText}` : 'text-steel hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? accentIconBg : 'bg-ink/5 group-hover:bg-ink/10'
            }`}
          >
            <svg className="icon !h-[18px] !w-[18px]">
              <use href={`#i-${item.icon || 'dots'}`} />
            </svg>
          </span>
          <span className="truncate">{item.label}</span>
        </span>
      )}
    </NavLink>
  );
}

export function AccountCard({ user, roleLabel, initials, accentBg, onLogout }) {
  return (
    <div className="mx-4 mb-4 mt-2 rounded-[20px] border border-ink/10 bg-bone/60 p-3">
      <div className="mb-3 flex items-center gap-3 px-1">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-on-primary ${accentBg}`}
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
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-ink/15 text-steel transition-colors hover:border-ember/40 hover:text-ember-dark"
        >
          <svg className="icon !h-4 !w-4">
            <use href="#i-logout" />
          </svg>
        </button>
      </div>
    </div>
  );
}
