import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext.jsx';

const roleHome = {
  customer: '/customer',
  admin: '/admin',
  super_admin: '/superadmin',
  trainer: '/trainer',
};

export default function Login({ staffOnly = false }) {
  const { login } = useAuth();
  const { tenant, clearTenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaffRoute = staffOnly || location.pathname.startsWith('/staff');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PWA install state
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

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
      // In Member mode (when tenant is active and not on staff route), pass gymSlug
      const slugToPass = !isStaffRoute && tenant?.slug ? tenant.slug : undefined;
      const user = await login(username.trim(), password, slugToPass);

      // If a customer attempts to log into the staff portal
      if (isStaffRoute && user.role === 'customer') {
        setError('This portal is reserved for Gym Staff & Trainers. Please use your Member app.');
        return;
      }

      const dest = location.state?.from || roleHome[user.role] || '/';
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

  // Determine appearance
  const isMemberMode = !isStaffRoute && Boolean(tenant?.gymName);
  const gymName = isMemberMode ? tenant.gymName : 'Ironline';
  const gymLogo = isMemberMode ? tenant.gymLogoUrl : null;

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bone md:grid-cols-2">
      {/* Left: Brand panel */}
      <div className="card--tint relative hidden flex-col justify-between overflow-hidden bg-[#0b0c10] p-12 text-[#f6f6f8] md:flex">
        <div className="relative flex items-center gap-3">
          {gymLogo ? (
            <img src={gymLogo} alt={gymName} className="h-10 w-10 rounded-2xl object-cover border border-white/20" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4e1f] shadow-soft">
              <svg className="icon !h-5 !w-5 text-white">
                <use href={isStaffRoute ? '#i-shield' : '#i-zap'} />
              </svg>
            </div>
          )}
          <span className="font-display text-lg tracking-wide uppercase">
            {isMemberMode ? gymName : isStaffRoute ? 'Ironline Staff' : 'Ironline'}
          </span>
        </div>

        <div className="relative">
          <span className="chip mb-6 border-white/15 bg-white/5 text-[#9a9ba5]">
            <svg className="icon !h-3.5 !w-3.5">
              <use href={isMemberMode ? '#i-dumbbell' : isStaffRoute ? '#i-briefcase' : '#i-shield'} />
            </svg>
            {isMemberMode ? 'Member App' : isStaffRoute ? 'Operations & Studio' : 'Multi-Gym Platform'}
          </span>

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#f6f6f8]">
            {isMemberMode ? (
              <>
                Welcome to
                <br />
                <span className="text-[#ff4e1f]">{tenant.gymName}.</span>
                <br />
                Your fitness home.
              </>
            ) : isStaffRoute ? (
              <>
                Gym Operations.
                <br />
                Trainer Studio.
                <br />
                <span className="text-[#ff4e1f]">One Command Center.</span>
              </>
            ) : (
              <>
                Every gym.
                <br />
                One system.
                <br />
                <span className="text-[#ff4e1f]">Zero crossover.</span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-sm text-[#9a9ba5]">
            {isMemberMode
              ? `Log workouts, track nutrition, monitor streaks and BMI, and manage dues directly with ${tenant.gymName}.`
              : isStaffRoute
              ? 'Complete gym administration: manage client rosters, attendance check-ins, fee collections, and trainer schedules.'
              : 'Members log their own training and progress. Owners run fees, plans and rosters. Cryptographically walled tenant data.'}
          </p>
        </div>

        <div className="relative flex gap-3 text-sm text-[#9a9ba5]">
          {isStaffRoute ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="font-display text-2xl text-[#f6f6f8]">Admin</div>
                Gym management
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="font-display text-2xl text-[#f6f6f8]">Trainer</div>
                Client studio
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="font-display text-2xl text-[#f6f6f8]">1</div>
                {isMemberMode ? 'dedicated member app' : 'unified platform'}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="font-display text-2xl text-[#f6f6f8]">100%</div>
                isolated gym data
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-col items-center justify-center p-6 md:p-8">
        <form onSubmit={handleSubmit} className="panel w-full max-w-sm px-7 py-8 shadow-soft">
          {/* Header Badge */}
          <div className="mb-6 flex items-center gap-3">
            {gymLogo ? (
              <img src={gymLogo} alt={gymName} className="h-12 w-12 rounded-2xl object-cover border border-ink/10 shadow-sm" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember shadow-soft text-white">
                <svg className="icon !h-6 !w-6">
                  <use href={isMemberMode ? '#i-dumbbell' : isStaffRoute ? '#i-briefcase' : '#i-zap'} />
                </svg>
              </div>
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ember">
                {isMemberMode ? 'Member Portal' : isStaffRoute ? 'Staff Operations' : 'Gym Platform'}
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                {isMemberMode ? gymName : isStaffRoute ? 'Staff Portal' : 'Ironline'}
              </h2>
            </div>
          </div>

          {/* PWA Install Guidance Banner */}
          {!isStandalone && (
            <div className="mb-6 rounded-2xl border border-chalk/30 bg-chalk/10 p-3.5 text-xs text-ink/80">
              <div className="flex items-center gap-2 font-semibold text-chalk-dark mb-1">
                <span>📲</span>
                <span>Install on your phone or tablet</span>
              </div>
              {installPrompt ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="mt-1 w-full rounded-xl bg-chalk-dark py-1.5 px-3 text-white font-medium text-xs hover:bg-chalk transition"
                >
                  Install {isMemberMode ? `${gymName} App` : 'Staff App'}
                </button>
              ) : isIos ? (
                <p className="text-[11px] leading-relaxed text-steel">
                  Tap the Safari <strong>Share</strong> button <span className="font-mono text-xs">⎋</span> and choose <strong>"Add to Home Screen" ➕</strong>.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-steel">
                  Tap browser menu <strong>⋮</strong> and choose <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              )}
            </div>
          )}

          <p className="mb-6 text-sm text-steel">
            {isMemberMode
              ? `Sign in with your ${gymName} member credentials.`
              : isStaffRoute
              ? 'Gym Admins, Trainers, and SuperAdmins sign in here.'
              : 'Sign in to access your dashboard.'}
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
                placeholder={isMemberMode ? 'e.g. ahsan' : 'username'}
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
            {submitting ? 'Signing in…' : `Sign in to ${isMemberMode ? gymName : isStaffRoute ? 'Staff Portal' : 'Ironline'}`}
          </button>

          {/* Contextual navigation / switcher links */}
          <div className="mt-6 pt-4 border-t border-ink/10 text-center text-xs text-steel space-y-2">
            {isMemberMode && (
              <div>
                Not at {gymName}?{' '}
                <button
                  type="button"
                  onClick={() => {
                    clearTenant();
                    navigate('/login', { replace: true });
                  }}
                  className="font-medium text-ember hover:underline"
                >
                  Switch gym or Staff sign in
                </button>
              </div>
            )}

            {!isStaffRoute && !isMemberMode && (
              <div>
                Staff or Trainer?{' '}
                <Link to="/staff" className="font-medium text-ember hover:underline">
                  Open Staff Operations App
                </Link>
              </div>
            )}

            {isStaffRoute && (
              <div>
                Are you a gym member?{' '}
                <Link to="/login" className="font-medium text-ember hover:underline">
                  Member sign in
                </Link>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

