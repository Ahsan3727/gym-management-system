import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAccentClasses } from './shellParts.jsx';

export default function TopBarShell({ navItems, accent = 'ember', roleLabel }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = isSuperAdmin ? 'IRONLINE' : (user?.gymName || tenant?.gymName || 'IRONLINE');
  const gymLogo = isSuperAdmin ? null : (user?.gymLogoUrl || tenant?.gymLogoUrl || null);

  const { accentText, accentBg, accentActiveBg, accentIconBg } = useAccentClasses(accent);
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
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentBg} shadow-sm`}>
                <svg className="icon !h-5 !w-5 text-on-primary">
                  <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
                </svg>
              </div>
            )}
            <div>
              <div className="font-display text-base font-extrabold tracking-tight text-ink uppercase truncate">
                {gymName}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${accentText}`}>
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
                    isActive
                      ? `${accentActiveBg} ${accentText} font-bold shadow-sm`
                      : 'text-steel hover:bg-ink/5 hover:text-ink'
                  }`
                }
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
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-on-primary ${accentBg} ring-2 ring-transparent hover:ring-ink/20 transition-all`}
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

        {/* Mobile Horizontal Scrolling Sub-Nav */}
        <div className="md:hidden border-t border-ink/5 overflow-x-auto px-2 py-1.5 flex gap-1 scrollbar-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? `${accentActiveBg} ${accentText} font-bold`
                    : 'text-steel hover:bg-ink/5 hover:text-ink'
                }`
              }
            >
              <svg className="icon !h-3.5 !w-3.5">
                <use href={`#i-${item.icon || 'dots'}`} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
