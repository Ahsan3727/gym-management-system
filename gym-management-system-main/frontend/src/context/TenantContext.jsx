import React, { createContext, useContext, useState } from 'react';

// Per-gym branding (Option A branded PWA — see IMPLEMENTATION_PLAN.md).
// The actual detection + fetch happens once, in main.jsx, BEFORE this
// provider ever mounts — by the time React renders, either sessionStorage
// already has the resolved tenant, or there isn't one (direct/marketing
// traffic with no /g/:slug in the URL). This context just exposes whatever
// main.jsx found so any component (DashboardShell header, GymProfile, etc.)
// can read it without re-fetching.
export const TENANT_STORAGE_KEY = 'ironline_tenant';

const TenantContext = createContext({ tenant: null, setTenant: () => {} });

function readStoredTenant() {
  try {
    const raw = sessionStorage.getItem(TENANT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TenantProvider({ children }) {
  const [tenant, setTenantState] = useState(readStoredTenant);

  function setTenant(next) {
    setTenantState(next);
    try {
      if (next) sessionStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(TENANT_STORAGE_KEY);
    } catch {
      // Storage can throw in private-browsing/quota-exceeded edge cases —
      // branding still works for this page load, it just won't persist.
    }
  }

  return <TenantContext.Provider value={{ tenant, setTenant }}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
