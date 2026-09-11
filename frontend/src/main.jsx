import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { TenantProvider, TENANT_STORAGE_KEY } from './context/TenantContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
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
    // FIX (blank-page bug): this fetch runs BEFORE React ever renders (see
    // bootstrap() below), so anyone visiting a /g/:slug install link was
    // stuck on a totally blank white page for as long as this request
    // took — and if it never resolved (flaky wifi, a slow cold-started
    // backend, a dropped connection), the app never rendered AT ALL. There
    // was no timeout, so "slow" and "never" looked the same to the user.
    // A hard 4s timeout means a slow/broken branding lookup degrades to
    // default Ironline branding instead of an indefinite blank screen —
    // the rest of the app still loads normally either way.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/public/branding/${slug}`, { signal: controller.signal });
    clearTimeout(timeout);
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

function applyStaffBranding() {
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) manifestLink.href = `${API_BASE}/public/manifest/staff`;

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = '#ff4e1f';

  document.title = 'Ironline Staff · Operations & Studio';
}

async function bootstrap() {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const gymParam = searchParams.get('gym');
  const match = pathname.match(TENANT_PATH_RE);

  if (match) {
    // Fresh visit to a gym's install link — resolve and apply branding before the first render.
    await resolveTenantBranding(match[1]);
  } else if (gymParam) {
    // Visit via QR code or link with ?gym=slug parameter
    await resolveTenantBranding(gymParam);
  } else if (pathname.startsWith('/staff')) {
    // Staff portal entry — apply Staff PWA manifest & title
    applyStaffBranding();
  } else {
    // Check if we have a saved tenant in localStorage (e.g. launching installed member PWA)
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
      {/* FIX (blank-page bug): this is the ONE place that wraps the whole
          app, so any render error anywhere — a bad API shape, a null the
          component didn't expect, anything — shows a "Something went
          wrong" screen with a Reload button instead of unmounting to a
          blank white page. See components/ErrorBoundary.jsx. */}
      <ErrorBoundary>
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
      </ErrorBoundary>
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

