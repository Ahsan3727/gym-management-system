/**
 * Ironline Per-Gym Branding Constants
 * Single source of truth for backend validation, manifests, and parity checks.
 */
const THEMES = [
  'ember',
  'ocean',
  'forest',
  'royal',
  'crimson',
  'teal',
  'amber',
  'rose',
  'slate',
  'lime',
  'midnight',
  'cyan',
];

const SHELLS = ['sidebar', 'bottom-tabs', 'top-bar'];
const DASHBOARDS = ['classic', 'focus', 'compact'];
const SURFACES = ['accent', 'tinted', 'bold'];
const MODES = ['dark', 'light'];

const APP_DEFAULT = {
  theme: 'ember',
  shell: 'sidebar',
  dashboard: 'classic',
  surface: 'accent',
  defaultMode: 'dark',
};

// Hex values for PWA Web Manifest dynamic generation when custom themes are applied.
// 'ember' is omitted because ember preserves legacy themeColor/defaults.
const THEME_MANIFEST = {
  ocean:    { primary: '#0284c7', bg: '#081018', panel: '#0f1d2b' },
  forest:   { primary: '#16a34a', bg: '#08140c', panel: '#0e2416' },
  royal:    { primary: '#7c3aed', bg: '#100b1e', panel: '#1c1433' },
  crimson:  { primary: '#e11d48', bg: '#18080c', panel: '#2a0e16' },
  teal:     { primary: '#0d9488', bg: '#061413', panel: '#0c2422' },
  amber:    { primary: '#d97706', bg: '#161006', panel: '#261c0a' },
  rose:     { primary: '#e11d74', bg: '#180912', panel: '#291020' },
  slate:    { primary: '#64748b', bg: '#0f1318', panel: '#181e26' },
  lime:     { primary: '#65a30d', bg: '#0d1405', panel: '#18240a' },
  midnight: { primary: '#6366f1', bg: '#090a16', panel: '#121427' },
  cyan:     { primary: '#0891b2', bg: '#051318', panel: '#0a212b' },
};

module.exports = {
  THEMES,
  SHELLS,
  DASHBOARDS,
  SURFACES,
  MODES,
  APP_DEFAULT,
  THEME_MANIFEST,
};
