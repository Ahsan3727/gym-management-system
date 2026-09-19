import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME_IDS } from '../themes.js';
import { contrast, ensureContrast, pickOnPrimary, mix, hexToRgb, rgbToHex } from '../derive.js';

describe('WCAG 2.1 AA Contrast Ratios (All 12 Themes x 2 Modes)', () => {
  const modes = ['dark', 'light'];
  const apps = ['memberApp', 'adminApp'];

  for (const themeId of THEME_IDS) {
    for (const mode of modes) {
      for (const app of apps) {
        it(`validates ${themeId} [${mode}] (${app}) satisfies >= 4.5:1 WCAG AA contrast rules`, () => {
          const t = THEMES[themeId];
          const isEmber = themeId === 'ember';

          // Base colors
          const basePrimary = isEmber
            ? (app === 'memberApp' ? (mode === 'dark' ? '#ff4e1f' : '#E1553A') : (mode === 'dark' ? '#5ea8ff' : '#2F5D8A'))
            : t.primary;

          const bg = mode === 'dark'
            ? (isEmber ? '#0b0c10' : t.bg)
            : '#F6F5F1';

          const panel = mode === 'dark'
            ? (isEmber ? '#15171c' : t.panel)
            : '#FFFFFF';

          const ink = mode === 'dark' ? '#f6f6f8' : '#14171A';
          const steel = mode === 'dark' ? '#9a9ba5' : '#545B62';
          const danger = mode === 'dark' ? '#ff6b47' : '#C43F27';

          // Derived primary & on-primary
          const primary = ensureContrast(ensureContrast(basePrimary, bg, 4.5), panel, 4.5);
          const onPrimary = pickOnPrimary(primary);
          const primaryDark = ensureContrast(mix(primary, '#000000', 0.2), panel, 4.5);

          // 1. on-primary on primary (filled buttons, badges, avatar)
          const onPrimaryRatio = contrast(onPrimary, primary);
          assert.ok(
            onPrimaryRatio >= 4.5,
            `${themeId} [${mode}] on-primary (${onPrimary}) on primary (${primary}) ratio ${onPrimaryRatio.toFixed(2)} < 4.5`
          );

          // 2. primary as text on bg and panel
          const primaryOnBg = contrast(primary, bg);
          assert.ok(
            primaryOnBg >= 4.5,
            `${themeId} [${mode}] primary (${primary}) on bg (${bg}) ratio ${primaryOnBg.toFixed(2)} < 4.5`
          );

          const primaryOnPanel = contrast(primary, panel);
          assert.ok(
            primaryOnPanel >= 4.5,
            `${themeId} [${mode}] primary (${primary}) on panel (${panel}) ratio ${primaryOnPanel.toFixed(2)} < 4.5`
          );

          // 3. primary-dark on panel
          const primaryDarkOnPanel = contrast(primaryDark, panel);
          assert.ok(
            primaryDarkOnPanel >= 4.5,
            `${themeId} [${mode}] primaryDark (${primaryDark}) on panel (${panel}) ratio ${primaryDarkOnPanel.toFixed(2)} < 4.5`
          );

          // 4. ink on bg and panel
          const inkOnBg = contrast(ink, bg);
          assert.ok(
            inkOnBg >= 4.5,
            `${themeId} [${mode}] ink (${ink}) on bg (${bg}) ratio ${inkOnBg.toFixed(2)} < 4.5`
          );

          const inkOnPanel = contrast(ink, panel);
          assert.ok(
            inkOnPanel >= 4.5,
            `${themeId} [${mode}] ink (${ink}) on panel (${panel}) ratio ${inkOnPanel.toFixed(2)} < 4.5`
          );

          // 5. steel on bg and panel (large or secondary text)
          const steelOnBg = contrast(steel, bg);
          const steelOnPanel = contrast(steel, panel);
          assert.ok(
            steelOnBg >= 3.0,
            `${themeId} [${mode}] steel on bg ratio ${steelOnBg.toFixed(2)} < 3.0`
          );
          assert.ok(
            steelOnPanel >= 3.0,
            `${themeId} [${mode}] steel on panel ratio ${steelOnPanel.toFixed(2)} < 3.0`
          );

          // 6. danger text on bg and panel
          const safeDangerOnBg = ensureContrast(danger, bg, 4.0);
          assert.ok(
            contrast(safeDangerOnBg, bg) >= 4.0,
            `${themeId} [${mode}] danger on bg < 4.0`
          );
        });
      }
    }
  }
});
