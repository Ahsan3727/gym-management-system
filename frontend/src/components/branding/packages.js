/**
 * Recommended Brand Packages — curated theme + shell + dashboard combos.
 * Each package pre-fills both memberApp and adminApp drafts in GymBranding.jsx.
 */

export const BRAND_PACKAGES = [
  {
    id: 'iron-pro',
    name: 'Iron Pro',
    emoji: '🏆',
    tagline: 'Dark, powerful, desktop-first',
    memberApp: { theme: 'ember',    defaultMode: 'dark', shell: 'sidebar',     dashboard: 'classic', surface: 'accent' },
    adminApp:  { theme: 'ember',    defaultMode: 'dark', shell: 'sidebar',     dashboard: 'classic', surface: 'accent' },
  },
  {
    id: 'ocean-club',
    name: 'Ocean Club',
    emoji: '🌊',
    tagline: 'Blue, mobile-first, clean membership',
    memberApp: { theme: 'ocean',    defaultMode: 'dark', shell: 'bottom-tabs', dashboard: 'focus',   surface: 'tinted' },
    adminApp:  { theme: 'ocean',    defaultMode: 'dark', shell: 'top-bar',     dashboard: 'classic', surface: 'accent' },
  },
  {
    id: 'forest-studio',
    name: 'Forest Studio',
    emoji: '🌿',
    tagline: 'Green, clean, fitness studio',
    memberApp: { theme: 'forest',   defaultMode: 'dark', shell: 'top-bar',     dashboard: 'compact', surface: 'accent' },
    adminApp:  { theme: 'forest',   defaultMode: 'dark', shell: 'sidebar',     dashboard: 'compact', surface: 'accent' },
  },
  {
    id: 'royal-elite',
    name: 'Royal Elite',
    emoji: '👑',
    tagline: 'Purple, premium, high-end gym',
    memberApp: { theme: 'royal',    defaultMode: 'dark', shell: 'sidebar',     dashboard: 'focus',   surface: 'bold' },
    adminApp:  { theme: 'royal',    defaultMode: 'dark', shell: 'sidebar',     dashboard: 'focus',   surface: 'bold' },
  },
  {
    id: 'midnight-hustle',
    name: 'Midnight Hustle',
    emoji: '🌃',
    tagline: 'Indigo energy, urban fitness',
    memberApp: { theme: 'midnight', defaultMode: 'dark', shell: 'bottom-tabs', dashboard: 'classic', surface: 'accent' },
    adminApp:  { theme: 'midnight', defaultMode: 'dark', shell: 'top-bar',     dashboard: 'classic', surface: 'accent' },
  },
  {
    id: 'coral-energy',
    name: 'Coral Energy',
    emoji: '🔴',
    tagline: 'Red, fast, boutique fitness',
    memberApp: { theme: 'crimson',  defaultMode: 'dark', shell: 'bottom-tabs', dashboard: 'compact', surface: 'accent' },
    adminApp:  { theme: 'crimson',  defaultMode: 'dark', shell: 'top-bar',     dashboard: 'compact', surface: 'accent' },
  },
];
