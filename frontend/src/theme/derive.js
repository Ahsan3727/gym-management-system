/**
 * WCAG 2.1 AA Luminance and Contrast Mathematical Engine
 * Derives accessible foreground/background tints and on-primary text colors.
 */

export const hexToRgb = (h) => {
  const clean = h.replace(/^#/, '');
  return clean.match(/.{2}/g).map((x) => parseInt(x, 16));
};

export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');

const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const luminance = (h) => {
  const [r, g, b] = hexToRgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [bright, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (bright + 0.05) / (dark + 0.05);
};

export const mix = (a, b, t) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};

export function ensureContrast(fg, bg, min = 4.5) {
  if (contrast(fg, bg) >= min) return fg;
  const toward = luminance(bg) > 0.5 ? '#000000' : '#ffffff';
  let c = fg;
  for (let t = 0.05; t <= 1; t += 0.05) {
    c = mix(fg, toward, t);
    if (contrast(c, bg) >= min) return c;
  }
  return toward;
}

export const pickOnPrimary = (p) =>
  contrast('#ffffff', p) >= contrast('#000000', p) ? '#ffffff' : '#000000';
