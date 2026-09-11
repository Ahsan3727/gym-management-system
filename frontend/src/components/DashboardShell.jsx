import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/**
 * Apex Elite–style app shell: rounded icon-pill nav, glow-tinted active
 * state, and an account card pinned to the bottom of the sidebar.
 * Structure (routing, drawer behavior) is unchanged from Phase 0 — this is
 * the Phase 1 visual pass described in the implementation plan §5.
 *
 * accent: 'ember' (customer) | 'iron' (admin/trainer) | 'chalk' (super admin)
 * navItems: { to, label, end?, icon? }[] — icon is an IconSprite id
 *   (e.g. 'home', 'dumbbell'); falls back to a neutral dot if omitted.
 */
export default function DashboardShell({ navItems, accent = 'ember', roleLabel, brandSub }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = isSuperAdmin ? 'IRONLINE' : (user?.gymName || tenant?.gymName || 'IRONLINE');
  const gymLogo = isSuperAdmin ? null : (user?.gymLogoUrl || tenant?.gymLogoUrl || null);

  // Phase 4 QA: the drawer had no Escape-to-close and didn't lock
  // background scroll, so the page behind it kept scrolling while it was
  // open. Not theme-related — fixed here as part of the full page-by-page
  // interaction pass (see implementation plan §8).
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const accentText = { ember: 'text-ember', iron: 'text-iron', chalk: 'text-chalk-dark' }[accent] || 'text-ember';
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';
  const accentActiveBg = { ember: 'bg-ember/10', iron: 'bg-iron/10', chalk: 'bg-chalk/10' }[accent] || 'bg-ember/10';
  const accentIconBg = { ember: 'bg-ember/15', iron: 'bg-iron/15', chalk: 'bg-chalk/15' }[accent] || 'bg-ember/15';

  const initials = (user?.username || '?').trim().charAt(0).toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-panel">
      {/* Logo header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-ink/5">
        {gymLogo ? (
          <img src={gymLogo} alt={gymName} className="h-10 w-10 shrink-0 rounded-2xl object-cover border border-ink/10 shadow-soft" />
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accentBg} shadow-soft`}>
            <svg className="icon !h-5 !w-5 text-white">
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
        {/* Close button inside drawer on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-full p-1.5 text-steel hover:bg-ink/5 hover:text-ink md:hidden"
          aria-label="Close menu"
        >
          <svg className="icon !h-5 !w-5">
            <use href="#i-close" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="block" onClick={() => setMobileOpen(false)}>
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
        ))}
      </nav>

      {/* Account card */}
      <div className="mx-4 mb-4 mt-2 rounded-[20px] border border-ink/10 bg-bone/60 p-3">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${accentBg}`}
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
            onClick={() => {
              setMobileOpen(false);
              logout();
            }}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-bone md:flex">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-panel px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="h-8 w-8 shrink-0 rounded-xl object-cover border border-ink/10 shadow-sm" />
          ) : (
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accentBg}`}>
              <svg className="icon !h-4 !w-4 text-white">
                <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
              </svg>
            </div>
          )}
          <span className="font-display text-base font-bold tracking-wide text-ink truncate uppercase">
            {gymName}
          </span>
          <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${accentText}`}>· {roleLabel}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-full p-1.5 text-ink hover:bg-bone focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="icon !h-6 !w-6">
            <use href="#i-menu" />
          </svg>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-panel shadow-xl transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-ink/10 bg-panel md:block">
        {sidebarContent}
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
