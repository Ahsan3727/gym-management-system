import { DEFAULT_APP } from './themes.js';

export function resolveBranding(role, tenant, user) {
  if (role === 'super_admin') {
    return { app: null, settings: { ...DEFAULT_APP } };
  }

  const app = role === 'customer' ? 'memberApp' : 'adminApp';

  const userSettings = user?.branding?.[app];
  const tenantSettings = tenant?.branding?.[app] || (tenant?.branding?.theme ? tenant.branding : null);

  const settings = {
    ...DEFAULT_APP,
    ...(tenantSettings || {}),
    ...(userSettings || {}),
  };

  return { app, settings };
}

export async function fetchTenantBranding(slug) {
  if (!slug) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`/api/public/branding/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    // Return cached tenant if available in localStorage
    try {
      const cached = localStorage.getItem(`ironline_tenant_${slug}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  }
}
