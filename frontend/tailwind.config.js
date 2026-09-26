/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All colors are backed by CSS variables (see src/index.css) so the
        // same utility classes (bg-ink, text-steel, border-ember/40, ...)
        // automatically repaint for dark vs light theme — no per-page edits.
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          line: 'rgb(var(--c-ink-line) / <alpha-value>)',
        },
        bone: {
          DEFAULT: 'rgb(var(--c-bone) / <alpha-value>)',
          dim: 'rgb(var(--c-bone-dim) / <alpha-value>)',
        },
        // NEW — card/surface color. Previously panels hardcoded bg-white,
        // which doesn't work once the page background can go dark.
        panel: {
          DEFAULT: 'rgb(var(--c-panel) / <alpha-value>)',
          2: 'rgb(var(--c-panel-2) / <alpha-value>)',
        },
        steel: {
          DEFAULT: 'rgb(var(--c-steel) / <alpha-value>)',
          light: 'rgb(var(--c-steel-light) / <alpha-value>)',
        },
        ember: {
          DEFAULT: 'rgb(var(--c-ember) / <alpha-value>)',
          dark: 'rgb(var(--c-ember-dark) / <alpha-value>)',
          light: 'rgb(var(--c-ember-light) / <alpha-value>)',
        },
        chalk: {
          DEFAULT: 'rgb(var(--c-chalk) / <alpha-value>)',
          dark: 'rgb(var(--c-chalk-dark) / <alpha-value>)',
        },
        iron: {
          DEFAULT: 'rgb(var(--c-iron) / <alpha-value>)',
          dark: 'rgb(var(--c-iron-dark) / <alpha-value>)',
          light: 'rgb(var(--c-iron-light) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)',
          dark: 'rgb(var(--c-danger-dark, var(--c-danger)) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--c-success) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--c-warning) / <alpha-value>)',
        },
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
      },
      fontFamily: {
        // Apex Elite's type system is Inter end-to-end (headings lean on
        // weight, not a separate display face) — Oswald has been dropped.
        display: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        xs:   '0 1px 3px rgb(0 0 0 / 0.15), 0 1px 2px rgb(0 0 0 / 0.10)',
        sm:   '0 2px 8px rgb(0 0 0 / 0.20), 0 1px 3px rgb(0 0 0 / 0.12)',
        soft: '0 4px 16px rgb(0 0 0 / 0.24), 0 2px 6px rgb(0 0 0 / 0.12)',
        lg:   '0 8px 32px rgb(0 0 0 / 0.28), 0 4px 8px rgb(0 0 0 / 0.14)',
        xl:   '0 20px 60px rgb(0 0 0 / 0.36), 0 8px 16px rgb(0 0 0 / 0.18)',
        glow: '0 0 0 1px rgb(var(--c-ember) / 0.20), 0 4px 20px rgb(var(--c-ember) / 0.30)',
        none: 'none',
      },
    },
  },
  plugins: [],
};
