import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ironline_theme';

/**
 * Dark is the default (matches the Apex Elite design). Passing 'light'
 * restores the original IRONLINE brand palette. See src/index.css for the
 * actual color values — this context only ever toggles a class on <html>.
 *
 * A blocking inline script in index.html applies the stored class before
 * React mounts, so there's no light-theme flash on reload.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme just won't persist
    }
    // Phase 4 QA: index.html set <meta name="theme-color"> once, to the new
    // dark-ember accent, but never made it theme-aware — so a phone's
    // browser chrome / PWA titlebar stayed dark-orange even in light mode.
    // Keep it in sync with the active theme's ember token.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#E1553A' : '#ff4e1f');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
