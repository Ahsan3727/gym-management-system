import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';
import WrongPortalNotice from '../components/WrongPortalNotice.jsx';

export default function Login() {
  const { login } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wrongPortalRole, setWrongPortalRole] = useState(null);

  // PWA Install prompt state
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as home-screen PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // iOS Safari detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    // Capture Android/Desktop Chrome install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password, tenant?.slug);
      if (user.role !== 'customer') {
        setWrongPortalRole(user.role);
        return;
      }
      const dest = location.state?.from || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the server. Please check that your backend is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Could not log in. Check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (wrongPortalRole) {
    return <WrongPortalNotice role={wrongPortalRole} />;
  }

  const gymName = tenant?.gymName || 'Ironline';
  const gymLogo = tenant?.gymLogoUrl;

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bone md:grid-cols-2">
      {/* Left: brand panel */}
      <div className="card--tint relative hidden flex-col justify-between overflow-hidden bg-[#0b0c10] p-12 text-[#f6f6f8] md:flex">
        <div className="relative flex items-center gap-3">
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="h-10 w-10 rounded-2xl object-cover border border-white/20" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4e1f] shadow-soft">
              <svg className="icon !h-5 !w-5 text-white">
                <use href="#i-zap" />
              </svg>
            </div>
          )}
          <span className="font-display text-lg tracking-wide uppercase">{gymName}</span>
        </div>

        <div className="relative">
          <span className="chip mb-6 border-white/15 bg-white/5 text-[#9a9ba5]">
            <svg className="icon !h-3.5 !w-3.5">
              <use href="#i-dumbbell" />
            </svg>
            Member app
          </span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#f6f6f8]">
            {tenant?.gymName ? (
              <>
                Welcome to
                <br />
                <span className="text-[#ff4e1f]">{tenant.gymName}.</span>
                <br />
                Your fitness home.
              </>
            ) : (
              <>
                Your training.
                <br />
                Your progress.
                <br />
                <span className="text-[#ff4e1f]">All in one place.</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-sm text-[#9a9ba5]">
            Log workouts, track meals and water, monitor streaks and BMI, and
            manage your membership dues directly with {gymName}.
          </p>
        </div>

        <div className="relative flex gap-3 text-sm text-[#9a9ba5]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="font-display text-2xl text-[#f6f6f8]">1</div>
            dedicated member app
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-8">
        <form onSubmit={handleSubmit} className="panel w-full max-w-sm px-7 py-8 shadow-soft">
          {/* Mobile Header / Gym Badge */}
          <div className="mb-6 flex items-center gap-3">
            {gymLogo ? (
              <img src={gymLogo} alt={gymName} className="h-12 w-12 rounded-2xl object-cover border border-ink/10 shadow-sm" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember shadow-soft text-white">
                <svg className="icon !h-6 !w-6">
                  <use href="#i-dumbbell" />
                </svg>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ember">
                {tenant?.gymName ? 'Member Portal' : 'Gym Platform'}
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                {gymName}
              </h2>
            </div>
          </div>

          {/* PWA Install Guidance Banner if opened in mobile browser instead of standalone app */}
          {!isStandalone && (
            <div className="mb-6 rounded-2xl border border-chalk/30 bg-chalk/10 p-3.5 text-xs text-ink/80">
              <div className="flex items-center gap-2 font-semibold text-chalk-dark mb-1">
                <span>📲</span>
                <span>Install on your phone</span>
              </div>
              {installPrompt ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="mt-1 w-full rounded-xl bg-chalk-dark py-1.5 px-3 text-white font-medium text-xs hover:bg-chalk transition"
                >
                  Install {gymName} App
                </button>
              ) : isIos ? (
                <p className="text-[11px] leading-relaxed text-steel">
                  Tap the Safari <strong>Share</strong> button <span className="font-mono text-xs">⎋</span> and choose <strong>"Add to Home Screen" ➕</strong>.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-steel">
                  Tap browser menu <strong>⋮</strong> and select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              )}
            </div>
          )}

          <p className="mb-6 text-sm text-steel">
            Sign in with your {tenant?.gymName ? `${tenant.gymName} ` : ''}member credentials.
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-ember/30 bg-ember/5 px-3.5 py-3 text-sm text-ember-dark">
              <svg className="icon !h-4 !w-4 mt-0.5 shrink-0">
                <use href="#i-close" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="field-label" htmlFor="username">Username</label>
            <div className="relative">
              <svg className="icon pointer-events-none absolute left-3.5 top-1/2 !h-[18px] !w-[18px] -translate-y-1/2 text-steel-light">
                <use href="#i-user" />
              </svg>
              <input
                id="username"
                className="field-input pl-10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. ahsan"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="relative">
              <svg className="icon pointer-events-none absolute left-3.5 top-1/2 !h-[18px] !w-[18px] -translate-y-1/2 text-steel-light">
                <use href="#i-lock" />
              </svg>
              <input
                id="password"
                type="password"
                className="field-input pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging in…' : `Log in to ${gymName}`}
          </button>
        </form>
      </div>
    </div>
  );
}
