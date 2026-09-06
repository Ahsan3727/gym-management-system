import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { TenantProvider, TENANT_STORAGE_KEY } from './context/TenantContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Matches the /g/:slug prefix used for per-gym branded install links
// (see IMPLEMENTATION_PLAN.md Phase 5). Deliberately mirrors the slug
// format produced by backend/utils/slugify.js.
const TENANT_PATH_RE = /^\/g\/([a-z0-9-]+)/;

// Fetches this gym's branding and swaps the PWA identity tags in
// index.html BEFORE React ever renders, so there's no flash of default
// Ironline branding on a fresh /g/:slug visit — which is also exactly the
// moment Android/Chrome decide what to show in the install prompt.
async function resolveTenantBranding(slug) {
  try {
    const res = await fetch(`${API_BASE}/public/branding/${slug}`);
    if (!res.ok) return null;
    const branding = await res.json();
    if (!branding?.gymName) return null;

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.href = `${API_BASE}/public/manifest/${slug}`;

    // iOS Safari never reads manifest.json at all — this tag is the only
    // thing it looks at for the home-screen icon.
    const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIconLink && branding.gymLogoUrl) appleIconLink.href = branding.gymLogoUrl;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta && branding.themeColor) themeMeta.content = branding.themeColor;

    // Keep the "powered by" framing — useful for support/brand recognition
    // when a gym owner emails in referencing what's in their tab title.
    document.title = `${branding.gymName} · Powered by Ironline`;

    const tenant = { slug, ...branding };
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    } catch {
      // ignore storage failures — branding still applies for this load
    }
    return tenant;
  } catch {
    // Network hiccup on a cold /g/:slug visit — fall through to default index.html
    return null;
  }
}

function applyBrandingTags(tenant) {
  if (!tenant?.gymName) return;
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink && tenant.slug) manifestLink.href = `${API_BASE}/public/manifest/${tenant.slug}`;

  const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIconLink && tenant.gymLogoUrl) appleIconLink.href = tenant.gymLogoUrl;

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta && tenant.themeColor) themeMeta.content = tenant.themeColor;

  document.title = `${tenant.gymName} · Powered by Ironline`;
}

async function bootstrap() {
  const match = window.location.pathname.match(TENANT_PATH_RE);
  if (match) {
    // Fresh visit to a gym's install link — resolve and apply branding before the first render.
    await resolveTenantBranding(match[1]);
  } else {
    // No /g/:slug in URL (e.g. launching installed PWA from mobile home screen)
    // Check if we have a saved tenant in localStorage and apply their custom branding immediately!
    try {
      const stored = localStorage.getItem(TENANT_STORAGE_KEY);
      if (stored) {
        const tenant = JSON.parse(stored);
        applyBrandingTags(tenant);
      }
    } catch {
      // ignore storage parse errors
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <TenantProvider>
            <AuthProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </AuthProvider>
          </TenantProvider>
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );

  // Register service worker for PWA installability and offline support
  if ('serviceWorker' in navigator && !window.location.host.startsWith('localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[pwa] Service worker registration failed:', err);
      });
    });
  }
}

bootstrap();
