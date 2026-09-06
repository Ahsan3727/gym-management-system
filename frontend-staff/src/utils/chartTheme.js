import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Phase 3 (§7): Recharts renders via inline SVG presentation attributes
 * (the `fill`/`stroke` props on <XAxis tick>, <Line>, <Bar>, etc.), not
 * CSS classes — so it never picks up the `rgb(var(--c-x))` token repoint
 * that the rest of the app gets for free. These need the actual hex pulled
 * in from JS and swapped explicitly per theme.
 *
 * Values below are the literal hex already defined for each token in
 * src/index.css (`:root` = dark, `html.light` = light) — kept in sync by
 * hand since Recharts can't read the CSS variables directly.
 */
const PALETTE = {
  dark: {
    grid: '#f6f6f8',
    gridOpacity: 0.08,
    axisTick: '#9a9ba5',
    tooltipBg: '#15171c',
    tooltipBorder: '#f6f6f81a',
    tooltipText: '#f6f6f8',
    cursorFill: '#f6f6f80d',
    ember: '#ff4e1f',
    chalk: '#7ee787',
    iron: '#5ea8ff',
  },
  light: {
    grid: '#14171A',
    gridOpacity: 0.08,
    axisTick: '#545B62',
    tooltipBg: '#ffffff',
    tooltipBorder: '#14171a1a',
    tooltipText: '#14171A',
    cursorFill: '#14171a0d',
    ember: '#E1553A',
    chalk: '#A8C23A',
    iron: '#2F5D8A',
  },
};

/** Returns the current theme's chart color set, plus ready-made prop bundles for common Recharts elements. */
export function useChartColors() {
  const { theme } = useTheme();
  const c = PALETTE[theme] || PALETTE.dark;

  return {
    ...c,
    gridProps: { strokeDasharray: '3 3', stroke: c.grid, strokeOpacity: c.gridOpacity },
    axisTickStyle: (fontSize = 12) => ({ fontSize, fill: c.axisTick }),
    tooltipContentStyle: {
      fontSize: 12,
      borderRadius: 8,
      border: `1px solid ${c.tooltipBorder}`,
      backgroundColor: c.tooltipBg,
      color: c.tooltipText,
    },
    tooltipCursor: { fill: c.cursorFill },
  };
}
