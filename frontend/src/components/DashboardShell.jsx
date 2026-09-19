import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { resolveBranding } from '../theme/branding.js';
import SidebarShell from '../layouts/SidebarShell.jsx';
import BottomTabShell from '../layouts/BottomTabShell.jsx';
import TopBarShell from '../layouts/TopBarShell.jsx';

const SHELLS = {
  sidebar: SidebarShell,
  'bottom-tabs': BottomTabShell,
  'top-bar': TopBarShell,
};

/**
 * Thin selector component: delegates dynamically to the configured responsive shell
 * based on tenant and user branding settings, while App.jsx routing remains untouched (D7).
 */
export default function DashboardShell(props) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { app, settings } = resolveBranding(user?.role, tenant, user);

  // Super admin always gets the Sidebar shell (D3). Others get configured or default.
  const Shell = app ? (SHELLS[settings.shell] ?? SidebarShell) : SidebarShell;
  return <Shell {...props} />;
}
