import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';

const roleHome = {
  customer: '/customer',
  admin: '/admin',
  super_admin: '/superadmin',
  trainer: '/trainer',
};

export default function Login() {
  const { login } = useAuth();
  const { tenant, setTenant, clearTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gymSlug = params.get('gym');
    if (gymSlug && tenant?.slug !== gymSlug) {
      fetch(`/api/public/branding/${gymSlug}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.gymName) {
            setTenant({ slug: gymSlug, ...data });
          }
        })
        .catch(() => {});
    }
  }, [location.search, tenant]);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua) && !window.MSStream);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const slugToPass = isMemberMode ? tenant.slug : undefined;
      const user = await login(username.trim(), password, slugToPass);
      const searchParams = new URLSearchParams(location.search);
      const redirectParam = searchParams.get('redirect');
      const dest = redirectParam || location.state?.from || roleHome[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the server. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Could not sign in. Check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isMemberMode = Boolean(tenant?.gymName);
  const gymName = isMemberMode ? tenant.gymName : 'Ironline';
  const gymLogo = isMemberMode ? tenant.gymLogoUrl : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone p-4">
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm px-7 py-8 shadow-soft">

        <div className="mb-6 flex items-center gap-3">
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="h-12 w-12 rounded-2xl object-cover border border-ink/10 shadow-sm" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember shadow-soft text-white">
              <svg className="icon !h-6 !w-6"><use href="#i-zap" /></svg>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ember">
              {isMemberMode ? gymName : 'Ironline'}
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-ink">Sign In</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-ember/30 bg-ember/5 px-3.5 py-3 text-sm text-ember-dark">
            <svg className="icon !h-4 !w-4 mt-0.5 shrink-0"><use href="#i-close" /></svg>
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="field-label" htmlFor="login-username">Username</label>
          <div className="relative">
            <svg className="icon pointer-events-none absolute left-3.5 top-1/2 !h-[18px] !w-[18px] -translate-y-1/2 text-steel-light">
              <use href="#i-user" />
            </svg>
            <input
              id="login-username"
              className="field-input pl-10"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="your username"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="field-label" htmlFor="login-password">Password</label>
          <div className="relative">
            <svg className="icon pointer-events-none absolute left-3.5 top-1/2 !h-[18px] !w-[18px] -translate-y-1/2 text-steel-light">
              <use href="#i-lock" />
            </svg>
            <input
              id="login-password"
              type="password"
              className="field-input pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" id="login-submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
