import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAccentStyles } from './shellParts.jsx';

export default function TopBarShell({ navItems, accent = 'ember', roleLabel }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = isSuperAdmin ? 'IRONLINE' : (user?.gymName || tenant?.gymName || 'IRONLINE');
  const gymLogo = isSuperAdmin ? null : (user?.gymLogoUrl || tenant?.gymLogoUrl || null);

  const { bgStyle, activeBgStyle, colorStyle } = useAccentStyles();
  const initials = (user?.username || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-bone flex flex-col">
      {/* Top Header with horizontal navigation */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-panel shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {gymLogo ? (
              <img
                src={gymLogo}
                alt={gymName}
                className="h-9 w-9 shrink-0 rounded-xl object-cover border border-ink/10 shadow-sm"
              />
            ) : (
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm`} style={bgStyle}>
                <svg className="icon !h-5 !w-5 text-on-primary">
                  <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
                </svg>
              </div>
            )}
            <div>
              <div className="font-display text-base font-extrabold tracking-tight text-ink uppercase truncate">
                {gymName}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={colorStyle}>
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive ? 'font-bold shadow-sm' : 'text-steel hover:bg-ink/5 hover:text-ink'
                  }`
                }
                style={({ isActive }) => isActive ? { ...activeBgStyle, ...colorStyle } : {}}
              >
                <svg className="icon !h-4 !w-4">
                  <use href={`#i-${item.icon || 'dots'}`} />
                </svg>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Account and controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="scale-90" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-on-primary ring-2 ring-transparent hover:ring-ink/20 transition-all`}
              style={bgStyle}
                aria-label="User menu"
              >
                {initials}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-2xl border border-ink/10 bg-panel p-2 shadow-xl z-50 animate-[fadeIn_0.15s_ease-out]"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-ink/10 mb-1">
                    <div className="text-xs font-bold text-ink truncate">{user?.username}</div>
                    <div className="text-[10px] text-steel capitalize">{roleLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
                  >
                    <svg className="icon !h-4 !w-4">
                      <use href="#i-logout" />
                    </svg>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* No horizontal sub-nav on mobile — bottom tab bar is below */}
      </header>

      {/* Main Content Area — pb-20 clears the bottom tab bar on mobile */}
      <main className="flex-1">
        <div
          className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:pb-8"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar — hidden on md+ where the top nav handles navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-ink/10 bg-panel/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-medium transition-colors min-h-[56px] ${
                isActive ? 'font-bold' : 'text-steel'
              }`
            }
            style={({ isActive }) => isActive ? colorStyle : {}}
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-7 w-10 items-center justify-center rounded-xl mb-0.5 transition-colors`}
                  style={isActive ? activeBgStyle : {}}
                >
                  <svg className="icon !h-[18px] !w-[18px]">
                    <use href={`#i-${item.icon || 'dots'}`} />
                  </svg>
                </div>
                <span className="truncate max-w-[56px] leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {navItems.length > 5 && (
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-medium text-steel min-h-[56px]"
          >
            <div className="flex h-7 w-10 items-center justify-center rounded-xl mb-0.5 hover:bg-ink/5">
              <svg className="icon !h-[18px] !w-[18px]"><use href="#i-dots" /></svg>
            </div>
            <span>More</span>
          </button>
        )}
      </nav>

      {/* More drawer for overflow nav items */}
      {menuOpen && navItems.length > 5 && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-ink/10 bg-panel p-5 shadow-2xl md:hidden"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-ink">More</div>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-steel hover:text-ink">✕</button>
            </div>
            <div className="space-y-1">
              {navItems.slice(5).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive ? '' : 'text-steel hover:bg-ink/5 hover:text-ink'
                    }`
                  }
                  style={({ isActive }) => isActive ? { ...activeBgStyle, ...colorStyle } : {}}
                >
                  <svg className="icon !h-5 !w-5"><use href={`#i-${item.icon || 'dots'}`} /></svg>
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 border-t border-ink/10 pt-4 flex items-center justify-between">
              <div className="text-xs text-steel">{user?.username} · {roleLabel}</div>
              <button onClick={() => { setMenuOpen(false); logout(); }} className="btn-secondary text-xs py-1.5 px-3">Log Out</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
