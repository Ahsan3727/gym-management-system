const C = require('../constants/branding');

function sanitizeAppConfig(input) {
  const base = { ...C.APP_DEFAULT };
  if (!input || typeof input !== 'object') return base;

  return {
    theme: C.THEMES.includes(input.theme) ? input.theme : base.theme,
    shell: C.SHELLS.includes(input.shell) ? input.shell : base.shell,
    dashboard: C.DASHBOARDS.includes(input.dashboard) ? input.dashboard : base.dashboard,
    surface: C.SURFACES.includes(input.surface) ? input.surface : base.surface,
    defaultMode: C.MODES.includes(input.defaultMode) ? input.defaultMode : base.defaultMode,
  };
}

function resolveBranding(adminDoc) {
  const b = adminDoc?.branding;
  const version = typeof b?.version === 'number' ? b.version : 1;
  const memberApp = sanitizeAppConfig(b?.memberApp);
  const adminApp = sanitizeAppConfig(b?.adminApp);

  return {
    memberApp,
    adminApp,
    version,
  };
}

function publicMemberBranding(adminDoc) {
  const resolved = resolveBranding(adminDoc);
  return {
    ...resolved.memberApp,
    version: resolved.version,
  };
}

module.exports = {
  sanitizeAppConfig,
  resolveBranding,
  publicMemberBranding,
};
