import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * accent: 'ember' (customer) | 'iron' (admin) | 'chalk' (super admin) — keeps
 * the three roles visually distinct at a glance while sharing one layout.
 */
export default function DashboardShell({ navItems, accent = 'ember', roleLabel, brandSub }) {
  const { user, logout } = useAuth();

  const accentText = { ember: 'text-ember', iron: 'text-iron', chalk: 'text-chalk-dark' }[accent];
  const accentBg = { ember: 'bg-ember', iron: 'bg-iron', chalk: 'bg-chalk' }[accent];
  const accentActiveBg = { ember: 'bg-ember/10', iron: 'bg-iron/10', chalk: 'bg-chalk/10' }[accent];

  return (
    <div className="flex min-h-screen bg-bone">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 ${accentBg}`} />
            <span className="font-display text-base tracking-wide text-ink">IRONLINE</span>
          </div>
          <div className={`mt-1 text-xs font-medium ${accentText}`}>{roleLabel}</div>
          {brandSub && <div className="mt-0.5 truncate text-xs text-steel">{brandSub}</div>}
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
          <button onClick={logout} className="text-sm font-medium text-steel hover:text-ember-dark">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
