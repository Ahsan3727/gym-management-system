import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Minimal, functional theme switch. Full visual placement/redesign of the
 * shell happens in Phase 1 — this just proves the dark/light system works
 * end to end and gives every role a way to reach it today.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-full border border-ink/15 bg-panel px-3 py-1.5 text-xs font-semibold text-steel transition-colors hover:border-ink/30 hover:text-ink ${className}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <svg className="icon !h-4 !w-4">
        <use href={isDark ? '#i-sun' : '#i-moon'} />
      </svg>
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
