/**
 * Ironline 12 Curated Multi-Tenant Themes & Tokens
 * Pure ESM: consumable by Vite frontend and test parity runners.
 */

export const THEMES = {
  ember: {
    label: 'Ember',
    primary: null, // Default brand - writes zero CSS variable overrides (D2)
    bg: null,
    panel: null,
  },
  ocean: {
    label: 'Ocean',
    primary: '#0284c7',
    bg: '#081018',
    panel: '#0f1d2b',
  },
  forest: {
    label: 'Forest',
    primary: '#16a34a',
    bg: '#08140c',
    panel: '#0e2416',
  },
  royal: {
    label: 'Royal',
    primary: '#7c3aed',
    bg: '#100b1e',
    panel: '#1c1433',
  },
  crimson: {
    label: 'Crimson',
    primary: '#e11d48',
    bg: '#18080c',
    panel: '#2a0e16',
  },
  teal: {
    label: 'Teal',
    primary: '#0d9488',
    bg: '#061413',
    panel: '#0c2422',
  },
  amber: {
    label: 'Amber',
    primary: '#d97706',
    bg: '#161006',
    panel: '#261c0a',
  },
  rose: {
    label: 'Rose',
    primary: '#e11d74',
    bg: '#180912',
    panel: '#291020',
  },
  slate: {
    label: 'Slate',
    primary: '#64748b',
    bg: '#0f1318',
    panel: '#181e26',
  },
  lime: {
    label: 'Lime',
    primary: '#65a30d',
    bg: '#0d1405',
    panel: '#18240a',
  },
  midnight: {
    label: 'Midnight',
    primary: '#6366f1',
    bg: '#090a16',
    panel: '#121427',
  },
  cyan: {
    label: 'Cyan',
    primary: '#0891b2',
    bg: '#051318',
    panel: '#0a212b',
  },
};

export const THEME_IDS = Object.keys(THEMES);
export const SHELL_IDS = ['sidebar', 'bottom-tabs', 'top-bar'];
export const DASHBOARD_IDS = ['classic', 'focus', 'compact'];
export const SURFACE_IDS = ['accent', 'tinted', 'bold'];
export const MODE_IDS = ['dark', 'light'];

export const DEFAULT_APP = {
  theme: 'ember',
  shell: 'sidebar',
  dashboard: 'classic',
  surface: 'accent',
  defaultMode: 'dark',
};

// Map of theme hexes for manifests (ember omitted as it uses default themeColor)
export const THEME_MANIFEST = Object.entries(THEMES).reduce((acc, [id, data]) => {
  if (id !== 'ember' && data.primary) {
    acc[id] = { primary: data.primary, bg: data.bg, panel: data.panel };
  }
  return acc;
}, {});
