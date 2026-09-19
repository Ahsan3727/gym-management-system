import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import BrandingApplier from './components/BrandingApplier.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { TenantProvider, TENANT_STORAGE_KEY } from './context/TenantContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { setThemeColorMeta, applyTheme } from './theme/applyTheme.js';
import './index.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Matches the /g/:slug prefix used for per-gym branded install links
const TENANT_PATH_RE = /^\/g\/([a-z0-9-]+)/;

async function resolveTenantBranding(slug) {
  // Stale-while-revalidate: apply cached tenant first if present
  let cached = null;
  try {
    const raw = localStorage.getItem(TENANT_STORAGE_KEY);
    if (raw) {
      cached = JSON.parse(raw);
      if (cached?.slug === slug) {
        applyBrandingTags(cached);
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/public/branding/${slug}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return cached;
    const branding = await res.json();
    if (!branding?.gymName) return cached;

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) manifestLink.href = `${API_BASE}/public/manifest/${slug}`;

    const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIconLink && branding.gymLogoUrl) appleIconLink.href = branding.gymLogoUrl;

    if (branding.branding) {
      applyTheme(branding.branding, 'memberApp');
    } else if (branding.themeColor) {
      setThemeColorMeta(branding.themeColor);
    }

    document.title = `${branding.gymName} · Powered by Ironline`;

    const tenant = { slug, ...branding };
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    } catch {}
    return tenant;
  } catch {
    return cached;
  }
}

function applyBrandingTags(tenant) {
  if (!tenant?.gymName) return;
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink && tenant.slug) manifestLink.href = `${API_BASE}/public/manifest/${tenant.slug}`;

  const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIconLink && tenant.gymLogoUrl) appleIconLink.href = tenant.gymLogoUrl;

  if (tenant.branding) {
    applyTheme(tenant.branding, 'memberApp');
  } else if (tenant.themeColor) {
    setThemeColorMeta(tenant.themeColor);
  }

  document.title = `${tenant.gymName} · Powered by Ironline`;
}

function applyStaffBranding() {
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) manifestLink.href = `${API_BASE}/public/manifest/staff`;

  setThemeColorMeta('#ff4e1f');
  document.title = 'Ironline Staff · Operations & Studio';
}

async function bootstrap() {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const gymParam = searchParams.get('gym');
  const match = pathname.match(TENANT_PATH_RE);

  if (match) {
    await resolveTenantBranding(match[1]);
  } else if (gymParam) {
    await resolveTenantBranding(gymParam);
  } else if (pathname.startsWith('/staff')) {
    applyStaffBranding();
  } else {
    try {
      const stored = localStorage.getItem(TENANT_STORAGE_KEY);
      if (stored) {
        const tenant = JSON.parse(stored);
        applyBrandingTags(tenant);
      }
    } catch {}
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <TenantProvider>
              <AuthProvider>
                <BrandingApplier />
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

