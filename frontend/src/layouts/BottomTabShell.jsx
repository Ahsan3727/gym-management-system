import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAccentStyles } from './shellParts.jsx';

export default function BottomTabShell({ navItems, accent = 'ember', roleLabel }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [showMore, setShowMore] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = isSuperAdmin ? 'IRONLINE' : (user?.gymName || tenant?.gymName || 'IRONLINE');
  const gymLogo = isSuperAdmin ? null : (user?.gymLogoUrl || tenant?.gymLogoUrl || null);

  const { bgStyle, activeBgStyle, colorStyle } = useAccentStyles();
  const initials = (user?.username || '?').trim().charAt(0).toUpperCase();

  // Split primary tabs (max 4) vs extra items in "More"
  const primaryTabs = navItems.slice(0, 4);
  const extraTabs = navItems.slice(4);

  return (
    <div className="min-h-screen bg-bone flex flex-col">
      {/* Top Compact Brand Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-panel px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="h-8 w-8 shrink-0 rounded-xl object-cover border border-ink/10 shadow-sm" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={bgStyle}>
              <svg className="icon !h-4 !w-4 text-on-primary">
                <use href={isSuperAdmin ? '#i-shield' : '#i-zap'} />
              </svg>
            </div>
          )}
          <span className="font-display text-base font-bold tracking-wide text-ink truncate uppercase">
            {gymName}
          </span>
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide" style={colorStyle}>· {roleLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="scale-90" />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-on-primary" style={bgStyle}>
            {initials}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 max-w-5xl mx-auto w-full"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Outlet />
      </main>

      {/* Slide-Up "More" Sheet Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* Slide-Up "More" Sheet Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform rounded-t-3xl bg-panel p-6 shadow-2xl border-t border-ink/10 transition-transform duration-200 ease-out ${
          showMore ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-bold text-ink">More Navigation & Settings</div>
          <button
            onClick={() => setShowMore(false)}
            className="rounded-full p-1 text-steel hover:text-ink"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1 mb-6">
          {extraTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive ? '' : 'text-steel hover:bg-ink/5 hover:text-ink'
                }`
              }
              style={({ isActive }) => isActive ? { ...activeBgStyle, ...colorStyle } : {}}
            >
              <svg className="icon !h-5 !w-5">
                <use href={`#i-${item.icon || 'dots'}`} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="border-t border-ink/10 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-on-primary" style={bgStyle}>
              {initials}
            </div>
            <div className="text-xs font-semibold text-ink">{user?.username}</div>
          </div>
          <button
            onClick={() => {
              setShowMore(false);
              logout();
            }}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Sticky Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t border-ink/10 bg-panel/95 backdrop-blur-md px-2 py-2 flex items-center justify-around shadow-lg"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {primaryTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                isActive ? `${accentText} font-bold` : 'text-steel hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-8 w-12 items-center justify-center rounded-xl mb-0.5 transition-colors ${
                    isActive ? '' : 'hover:bg-ink/5'
                  }`}
                  style={isActive ? activeBgStyle : {}}
                >
                  <svg className="icon !h-5 !w-5">
                    <use href={`#i-${item.icon || 'dots'}`} />
                  </svg>
                </div>
                <span className="truncate max-w-[64px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {extraTabs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-steel hover:text-ink"
          >
            <div className="flex h-8 w-12 items-center justify-center rounded-xl mb-0.5 hover:bg-ink/5">
              <svg className="icon !h-5 !w-5">
                <use href="#i-dots" />
              </svg>
            </div>
            <span>More</span>
          </button>
        )}
      </nav>
    </div>
  );
}
