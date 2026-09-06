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
      },
      fontFamily: {
        // Apex Elite's type system is Inter end-to-end (headings lean on
        // weight, not a separate display face) — Oswald has been dropped.
        display: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
};
