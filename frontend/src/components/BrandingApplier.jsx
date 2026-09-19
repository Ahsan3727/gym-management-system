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

  // T9.1 Version Check: On window focus, refresh /auth/me if branding version incremented
  useEffect(() => {
    if (!user || user.role === 'super_admin') return;

    async function checkVersionOnFocus() {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await api.get('/auth/me');
        const freshUser = res.data;
        if (freshUser?.branding?.version && freshUser.branding.version !== lastVersionRef.current) {
          lastVersionRef.current = freshUser.branding.version;
          if (typeof updateUser === 'function') {
            updateUser(freshUser);
          }
        }
      } catch {}
    }

    window.addEventListener('focus', checkVersionOnFocus);
    document.addEventListener('visibilitychange', checkVersionOnFocus);

    return () => {
      window.removeEventListener('focus', checkVersionOnFocus);
      document.removeEventListener('visibilitychange', checkVersionOnFocus);
    };
  }, [user, updateUser]);

  return null;
}
