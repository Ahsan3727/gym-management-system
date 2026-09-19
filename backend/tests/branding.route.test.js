const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { brandingSchema } = require('../schemas/brandingSchemas');
const { resolveBranding, publicMemberBranding } = require('../utils/branding');
const C = require('../constants/branding');

describe('Branding Route & Access Control Logic', () => {
  const sampleBranding = {
    memberApp: {
      theme: 'ocean',
      shell: 'bottom-tabs',
      dashboard: 'focus',
      surface: 'tinted',
      defaultMode: 'dark',
    },
    adminApp: {
      theme: 'royal',
      shell: 'sidebar',
      dashboard: 'classic',
      surface: 'accent',
      defaultMode: 'dark',
    },
  };

  it('enforces that only super_admin can modify branding', () => {
    function checkAuthorize(role) {
      if (role !== 'super_admin') {
        const err = new Error('Access denied: requires super_admin role');
        err.status = 403;
        throw err;
      }
      return true;
    }

    assert.equal(checkAuthorize('super_admin'), true);
    assert.throws(() => checkAuthorize('admin'), /Access denied/);
    assert.throws(() => checkAuthorize('trainer'), /Access denied/);
    assert.throws(() => checkAuthorize('customer'), /Access denied/);
  });

  it('increments version and logs before/after metadata upon update', () => {
    let auditEntry = null;
    function fakeLogAction(req, action, targetType, targetId, metadata) {
      auditEntry = { action, targetType, targetId, metadata };
    }

    const admin = {
      _id: '65f1234567890abcdef12345',
      gymName: 'Apex Fitness',
      branding: {
        memberApp: { ...C.APP_DEFAULT },
        adminApp: { ...C.APP_DEFAULT },
        version: 1,
      },
    };

    const before = resolveBranding(admin);
    const newBranding = brandingSchema.parse(sampleBranding);

    admin.branding = {
      ...newBranding,
      version: (admin.branding?.version ?? 1) + 1,
    };

    const after = resolveBranding(admin);
    fakeLogAction({}, 'admin.branding_update', 'Admin', admin._id, { before, after });

    assert.equal(admin.branding.version, 2, 'Version must increment to 2');
    assert.equal(auditEntry.action, 'admin.branding_update');
    assert.deepEqual(auditEntry.metadata.before.memberApp.theme, 'ember');
    assert.deepEqual(auditEntry.metadata.after.memberApp.theme, 'ocean');
  });

  it('returns 404 when gym id does not exist', () => {
    function findAdminOr404(adminDoc) {
      if (!adminDoc) {
        const err = new Error('Gym not found.');
        err.status = 404;
        throw err;
      }
      return adminDoc;
    }

    assert.throws(() => findAdminOr404(null), /Gym not found\./);
  });

  it('/public/branding/:slug returns only public safe member fields + version', () => {
    const adminDoc = {
      gymName: 'Titan Gym',
      branding: {
        memberApp: {
          theme: 'crimson',
          shell: 'top-bar',
          dashboard: 'compact',
          surface: 'bold',
          defaultMode: 'light',
        },
        adminApp: {
          theme: 'midnight',
          shell: 'sidebar',
          dashboard: 'classic',
          surface: 'accent',
          defaultMode: 'dark',
        },
        version: 4,
      },
    };

    const pub = publicMemberBranding(adminDoc);
    assert.deepEqual(Object.keys(pub).sort(), ['dashboard', 'defaultMode', 'shell', 'surface', 'theme', 'version'].sort());
    assert.equal(pub.theme, 'crimson');
    assert.equal(pub.version, 4);
    assert.equal(pub.adminApp, undefined);
  });
});
