import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import WrongPortalNotice from '../components/WrongPortalNotice.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // A staff credential (admin/trainer/super_admin) submitted here — show
  // WrongPortalNotice inline rather than navigating, so a gym owner who
  // bookmarked the wrong link gets a helpful message instead of a dead route.
  const [wrongPortalRole, setWrongPortalRole] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
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

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bone md:grid-cols-2">
      {/* Left: brand panel — pinned to fixed dark colors (marketing surface,
          not page chrome) with Apex's radial-glow tint. Member-facing copy
          only — no "4 roles, one login" staff messaging in this bundle. */}
      <div className="card--tint relative hidden flex-col justify-between overflow-hidden bg-[#0b0c10] p-12 text-[#f6f6f8] md:flex">
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4e1f] shadow-soft">
            <svg className="icon !h-5 !w-5 text-white">
              <use href="#i-zap" />
            </svg>
          </div>
          <span className="font-display text-lg tracking-wide">IRONLINE</span>
        </div>

        <div className="relative">
          <span className="chip mb-6 border-white/15 bg-white/5 text-[#9a9ba5]">
            <svg className="icon !h-3.5 !w-3.5">
              <use href="#i-dumbbell" />
            </svg>
            Member app
          </span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#f6f6f8]">
            Your training.
            <br />
            Your progress.
            <br />
            <span className="text-[#ff4e1f]">All in one place.</span>
          </h1>
          <p className="mt-6 max-w-sm text-[#9a9ba5]">
            Log workouts, track meals and water, watch your weight trend, and
            stay on top of fees and streaks — all from your own dashboard.
          </p>
        </div>

        <div className="relative flex gap-3 text-sm text-[#9a9ba5]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="font-display text-2xl text-[#f6f6f8]">1</div>
            app, your gym
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="panel w-full max-w-sm px-7 py-8 shadow-soft">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember">
              <svg className="icon !h-4 !w-4 text-white">
                <use href="#i-zap" />
              </svg>
            </div>
            <span className="font-display text-lg tracking-wide text-ink">IRONLINE</span>
          </div>

          <h2 className="mb-1 font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">Log in to your gym</h2>
          <p className="mb-8 text-sm text-steel">
            Enter your member username and password.
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
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
