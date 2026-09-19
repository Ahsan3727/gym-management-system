import { THEMES } from './themes.js';
import { hexToRgb, mix, ensureContrast, pickOnPrimary } from './derive.js';

export const OWNED_VARS = [
  '--c-ember',
  '--c-ember-light',
  '--c-ember-dark',
  '--c-iron',
  '--c-iron-light',
  '--c-iron-dark',
  '--c-bone',
  '--c-panel',
  '--c-on-primary',
];

const toRgbTriplet = (hex) => hexToRgb(hex).join(' ');

/**
 * Computes CSS variable overrides for a given theme, mode, and target app.
 * D2: 'ember' returns {} — pixel-identical default with ZERO CSS variable overrides.
 */
export function computeVars(settings, app) {
  const themeId = settings?.theme || 'ember';
  if (themeId === 'ember' || !THEMES[themeId]?.primary) {
    return {};
  }

  const t = THEMES[themeId];
  const mode = settings?.mode === 'light' ? 'light' : 'dark';

  const bg = mode === 'dark' ? t.bg : '#F6F5F1';
  const panel = mode === 'dark' ? t.panel : '#FFFFFF';

  const p = ensureContrast(ensureContrast(t.primary, bg), panel);
  const pLight = mix(p, '#ffffff', 0.25);
  const pDark = ensureContrast(mix(p, '#000000', 0.2), panel);
  const onPrimary = pickOnPrimary(p);

  const vars = {
    '--c-on-primary': toRgbTriplet(onPrimary),
  };

  if (app === 'memberApp') {
    vars['--c-ember'] = toRgbTriplet(p);
    vars['--c-ember-light'] = toRgbTriplet(pLight);
    vars['--c-ember-dark'] = toRgbTriplet(pDark);
  } else if (app === 'adminApp') {
    vars['--c-iron'] = toRgbTriplet(p);
    vars['--c-iron-light'] = toRgbTriplet(pLight);
    vars['--c-iron-dark'] = toRgbTriplet(pDark);
  }

  // D9: Themes only override dark bg/panel. Light mode keeps clean bone/white.
  if (mode === 'dark') {
    vars['--c-bone'] = toRgbTriplet(bg);
    vars['--c-panel'] = toRgbTriplet(panel);
  }

  return vars;
}

/**
 * Single meta tag writer for meta[name="theme-color"].
 */
export function setThemeColorMeta(hex) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', hex);
}

/**
 * Applies theme CSS variables and dataset attributes to a target DOM node.
 * If applied to document.documentElement, persists to localStorage for zero-flash PWA boot.
 */
export function applyTheme(settings, app, el = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!el || !settings) return;

  // Clean previous overrides
  for (const varName of OWNED_VARS) {
    el.style.removeProperty(varName);
  }

  const isDark = (settings.mode || (typeof document !== 'undefined' && !document.documentElement.classList.contains('light') ? 'dark' : 'light')) === 'dark';
  const effectiveMode = isDark ? 'dark' : 'light';
  const vars = computeVars({ ...settings, mode: effectiveMode }, app);

  for (const [key, val] of Object.entries(vars)) {
    el.style.setProperty(key, val);
  }

  if (settings.theme) el.dataset.theme = settings.theme;
  if (settings.surface) el.dataset.surface = settings.surface;

  // Global document scope enhancements
  if (typeof document !== 'undefined' && el === document.documentElement) {
    try {
      localStorage.setItem('ironline_theme_vars', JSON.stringify({
        vars,
        theme: settings.theme || 'ember',
        surface: settings.surface || 'accent',
      }));
    } catch {}

    const themeData = THEMES[settings.theme];
    const defaultMeta = effectiveMode === 'dark' ? '#ff4e1f' : '#E1553A';
    setThemeColorMeta(themeData?.primary || defaultMeta);
  }
}
