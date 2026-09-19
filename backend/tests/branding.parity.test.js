const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const C = require('../constants/branding');

describe('Branding Frontend <-> Backend Parity', () => {
  it('verifies that frontend and backend constants match exactly', async () => {
    const frontendThemesPath = path.resolve(__dirname, '../../frontend/src/theme/themes.js');
    assert.ok(fs.existsSync(frontendThemesPath), 'frontend/src/theme/themes.js must exist');

    // Dynamically import ESM themes file
    const fe = await import(`file://${frontendThemesPath.replace(/\\/g, '/')}`);

    assert.deepEqual(C.THEMES, fe.THEME_IDS, 'Theme IDs must match');
    assert.deepEqual(C.SHELLS, fe.SHELL_IDS, 'Shell IDs must match');
    assert.deepEqual(C.DASHBOARDS, fe.DASHBOARD_IDS, 'Dashboard IDs must match');
    assert.deepEqual(C.SURFACES, fe.SURFACE_IDS, 'Surface IDs must match');
    assert.deepEqual(C.MODES, fe.MODE_IDS, 'Mode IDs must match');
    assert.deepEqual(C.APP_DEFAULT, fe.DEFAULT_APP, 'Default app settings must match');

    // Check all non-ember theme hexes match in THEME_MANIFEST
    for (const themeId of C.THEMES) {
      if (themeId === 'ember') continue;
      assert.ok(C.THEME_MANIFEST[themeId], `Backend THEME_MANIFEST missing theme: ${themeId}`);
      assert.ok(fe.THEME_MANIFEST[themeId], `Frontend THEME_MANIFEST missing theme: ${themeId}`);
      assert.equal(
        C.THEME_MANIFEST[themeId].primary,
        fe.THEME_MANIFEST[themeId].primary,
        `Primary hex mismatch for theme: ${themeId}`
      );
      assert.equal(
        C.THEME_MANIFEST[themeId].bg,
        fe.THEME_MANIFEST[themeId].bg,
        `Background hex mismatch for theme: ${themeId}`
      );
    }
  });
});
