import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ironline_theme';
const EXPLICIT_KEY = 'ironline_theme_explicit';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
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
    } catch {}
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    try {
      localStorage.setItem(EXPLICIT_KEY, 'true');
    } catch {}
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    try {
      localStorage.setItem(EXPLICIT_KEY, 'true');
    } catch {}
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sets default mode only if the user hasn't explicitly chosen light/dark (D5)
  const setDefaultMode = useCallback((mode) => {
    if (!mode || (mode !== 'dark' && mode !== 'light')) return;
    try {
      const explicit = localStorage.getItem(EXPLICIT_KEY);
      if (explicit === 'true') return;
    } catch {}
    setThemeState(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, setDefaultMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
