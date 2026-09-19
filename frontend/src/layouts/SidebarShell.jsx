import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { BrandHeader, NavItemLink, AccountCard, useAccentClasses } from './shellParts.jsx';

export default function SidebarShell({ navItems, accent = 'ember', roleLabel, brandSub }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = isSuperAdmin ? 'IRONLINE' : (user?.gymName || tenant?.gymName || 'IRONLINE');
  const gymLogo = isSuperAdmin ? null : (user?.gymLogoUrl || tenant?.gymLogoUrl || null);

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

  const { accentText, accentBg, accentActiveBg, accentIconBg } = useAccentClasses(accent);
  const initials = (user?.username || '?').trim().charAt(0).toUpperCase();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-panel">
      <BrandHeader
        gymLogo={gymLogo}
        gymName={gymName}
        roleLabel={roleLabel}
        brandSub={brandSub}
        accentBg={accentBg}
        accentText={accentText}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setMobileOpen(false)}
      />

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-2">
        {navItems.map((item) => (
          <NavItemLink
            key={item.to}
            item={item}
            accentActiveBg={accentActiveBg}
            accentText={accentText}
            accentIconBg={accentIconBg}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      <AccountCard
        user={user}
        roleLabel={roleLabel}
        initials={initials}
        accentBg={accentBg}
        onLogout={() => {
          setMobileOpen(false);
          logout();
        }}
      />
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
              <svg className="icon !h-4 !w-4 text-on-primary">
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
