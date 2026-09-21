import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { resolveBranding } from '../theme/branding.js';
import { applyTheme } from '../theme/applyTheme.js';
import api from '../api/axios.js';

export default function BrandingApplier() {
  const { user, updateUser } = useAuth();
  const { tenant } = useTenant();
  const { theme, setDefaultMode } = useTheme();
  const lastVersionRef = useRef(user?.branding?.version);

  useEffect(() => {
    const { app, settings } = resolveBranding(user?.role, tenant, user);
    applyTheme({ ...settings, mode: theme }, app);

    if (settings.defaultMode && typeof setDefaultMode === 'function') {
      setDefaultMode(settings.defaultMode);
    }
  }, [user?.branding?.version, user?.role, tenant?.branding, theme, setDefaultMode]);

  return null;
}
