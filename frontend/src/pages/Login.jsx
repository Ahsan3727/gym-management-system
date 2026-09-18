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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bone p-4">

      {/* Animated background orbs */}
      <div
        className="login-orb-1 pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-ember)) 0%, transparent 70%)' }}
      />
      <div
        className="login-orb-2 pointer-events-none absolute -bottom-52 -right-52 h-[600px] w-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-ember-light)) 0%, transparent 65%)' }}
      />

      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--c-ink)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-ink)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="login-card panel relative z-10 w-full max-w-sm px-7 py-9 shadow-soft"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          {gymLogo ? (
            <img
              src={gymLogo}
              alt={gymName}
              className="login-logo mb-4 h-16 w-16 rounded-2xl object-cover border border-ink/10"
            />
          ) : (
            <div className="login-logo mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ember text-white">
              <svg className="icon !h-8 !w-8"><use href="#i-zap" /></svg>
            </div>
          )}

          {/* Brand name with gradient */}
          <span className="brand-gradient mb-1 font-display text-2xl font-extrabold tracking-tight">
            {isMemberMode ? gymName : 'Ironline'}
          </span>

          {/* Eyebrow divider */}
          <div className="mb-1 flex items-center gap-2 w-full">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-steel-light">
              {isMemberMode ? 'Member Portal' : 'Gym Platform'}
            </span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-steel">Sign in to access your dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-2xl border border-ember/30 bg-ember/5 px-3.5 py-3 text-sm text-ember-dark">
            <svg className="icon !h-4 !w-4 mt-0.5 shrink-0"><use href="#i-close" /></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Username */}
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

        {/* Password */}
        <div className="mb-7">
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

        {/* Submit */}
        <button type="submit" id="login-submit" disabled={submitting} className="btn-primary w-full gap-2">
          {submitting ? (
            <>
              <span className="login-spinner" />
              Signing in…
            </>
          ) : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

