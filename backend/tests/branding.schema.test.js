const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { brandingSchema, appSchema } = require('../schemas/brandingSchemas');
const { resolveBranding, publicMemberBranding, sanitizeAppConfig } = require('../utils/branding');
const C = require('../constants/branding');

describe('Branding Zod Schemas & Resolution', () => {
  const validApp = {
    theme: 'ocean',
    shell: 'bottom-tabs',
    dashboard: 'focus',
    surface: 'tinted',
    defaultMode: 'dark',
  };

  const validBranding = {
    memberApp: validApp,
    adminApp: {
      theme: 'ember',
      shell: 'sidebar',
      dashboard: 'classic',
      surface: 'accent',
      defaultMode: 'light',
    },
  };

  it('validates a correct branding configuration', () => {
    const parsed = brandingSchema.parse(validBranding);
    assert.deepEqual(parsed, validBranding);
  });

  it('rejects unknown theme in appSchema', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, theme: 'neon-purple' }),
      /Invalid option|invalid_value/
    );
  });

  it('rejects unknown shell in appSchema', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, shell: 'floating-dock' }),
      /Invalid option|invalid_value/
    );
  });

  it('rejects unknown dashboard layout in appSchema', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, dashboard: 'ultra' }),
      /Invalid option|invalid_value/
    );
  });

  it('rejects unknown surface in appSchema', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, surface: 'glassmorphic' }),
      /Invalid option|invalid_value/
    );
  });

  it('rejects unknown defaultMode in appSchema', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, defaultMode: 'sepia' }),
      /Invalid option|invalid_value/
    );
  });

  it('rejects unexpected / extra properties due to strict mode', () => {
    assert.throws(
      () => appSchema.parse({ ...validApp, customCss: 'body { display: none; }' }),
      /Unrecognized key/
    );
    assert.throws(
      () => brandingSchema.parse({ ...validBranding, extraKey: 123 }),
      /Unrecognized key/
    );
  });

  it('rejects missing fields in app configuration', () => {
    const { shell, ...missingShell } = validApp;
    assert.throws(() => appSchema.parse(missingShell));
  });

  describe('resolveBranding() Utility', () => {
    it('resolves defaults when adminDoc has no branding defined', () => {
      const resolved = resolveBranding(null);
      assert.deepEqual(resolved.memberApp, C.APP_DEFAULT);
      assert.deepEqual(resolved.adminApp, C.APP_DEFAULT);
      assert.equal(resolved.version, 1);
    });

    it('replaces corrupted or unknown fields with defaults safely', () => {
      const corruptAdmin = {
        branding: {
          version: 5,
          memberApp: {
            theme: 'invalid-theme',
            shell: 'top-bar',
            dashboard: 'unknown-dash',
            surface: 'bold',
            defaultMode: 'dark',
          },
          adminApp: null,
        },
      };

      const resolved = resolveBranding(corruptAdmin);
      assert.equal(resolved.version, 5);
      assert.equal(resolved.memberApp.theme, 'ember'); // fallback
      assert.equal(resolved.memberApp.shell, 'top-bar'); // preserved
      assert.equal(resolved.memberApp.dashboard, 'classic'); // fallback
      assert.equal(resolved.memberApp.surface, 'bold'); // preserved
      assert.deepEqual(resolved.adminApp, C.APP_DEFAULT); // full fallback
    });

    it('publicMemberBranding returns only memberApp configuration with version', () => {
      const admin = {
        branding: {
          version: 3,
          memberApp: validApp,
          adminApp: { theme: 'slate', shell: 'sidebar', dashboard: 'compact', surface: 'bold', defaultMode: 'light' },
        },
      };

      const pub = publicMemberBranding(admin);
      assert.deepEqual(pub, { ...validApp, version: 3 });
      assert.equal(pub.adminApp, undefined);
    });
  });
});
