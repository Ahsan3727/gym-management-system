import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SHELL_IDS, DEFAULT_APP } from '../themes.js';
import { resolveBranding } from '../branding.js';

describe('Shell Layout Invariants & Branding Resolution', () => {
  it('contains expected shell IDs', () => {
    assert.deepEqual(SHELL_IDS, ['sidebar', 'bottom-tabs', 'top-bar']);
  });

  it('defaults to sidebar for fallback and superadmin', () => {
    assert.equal(DEFAULT_APP.shell, 'sidebar');
    const sa = resolveBranding('super_admin', null, null);
    assert.equal(sa.settings.shell, 'sidebar');
  });

  it('resolves configured bottom-tabs shell for member', () => {
    const tenant = { branding: { memberApp: { shell: 'bottom-tabs', theme: 'ocean' } } };
    const resolved = resolveBranding('customer', tenant, null);
    assert.equal(resolved.app, 'memberApp');
    assert.equal(resolved.settings.shell, 'bottom-tabs');
    assert.equal(resolved.settings.theme, 'ocean');
  });

  it('resolves configured top-bar shell for admin', () => {
    const user = { branding: { adminApp: { shell: 'top-bar' } } };
    const resolved = resolveBranding('admin', null, user);
    assert.equal(resolved.app, 'adminApp');
    assert.equal(resolved.settings.shell, 'top-bar');
  });
});
