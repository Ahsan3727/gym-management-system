import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * accent: 'ember' (customer) | 'iron' (admin/trainer) | 'chalk' (super admin)
 */
export default function DashboardShell({ navItems, accent = 'ember', roleLabel, brandSub }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const accentText = { ember: 'text-ember', iron: 'text-iron', chalk: 'text-chalk-dark' }[accent] || 'text-ember';
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent] || 'bg-ember';
  const accentActiveBg = { ember: 'bg-ember/10', iron: 'bg-iron/10', chalk: 'bg-chalk/10' }[accent] || 'bg-ember/10';

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-5">
        <div>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 ${accentBg}`} />
            <span className="font-display text-base tracking-wide text-ink">IRONLINE</span>
          </div>
          <div className={`mt-1 text-xs font-medium ${accentText}`}>{roleLabel}</div>
          {brandSub && <div className="mt-0.5 truncate text-xs text-steel">{brandSub}</div>}
        </div>
        {/* Close button inside drawer on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 text-steel hover:bg-bone hover:text-ink md:hidden"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `block rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? `${accentActiveBg} ${accentText}` : 'text-ink/70 hover:bg-ink/5'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink/10 px-5 py-4">
        <div className="mb-2 truncate text-sm text-ink/80">{user?.username}</div>
        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="text-sm font-medium text-steel hover:text-ember-dark"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bone md:flex">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 ${accentBg}`} />
          <span className="font-display text-base tracking-wide text-ink">IRONLINE</span>
          <span className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}>· {roleLabel}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded p-1.5 text-ink hover:bg-bone focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-ink/10 bg-white md:block">
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
