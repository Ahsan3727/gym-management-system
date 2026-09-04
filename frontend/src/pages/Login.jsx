import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleHome = { customer: '/customer', admin: '/admin', super_admin: '/superadmin', trainer: '/trainer' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      const dest = location.state?.from || roleHome[user.role] || '/login';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-bone md:flex">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 bg-ember" />
          <span className="font-display text-lg tracking-wide">IRONLINE</span>
        </div>

        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] text-bone">
            Every gym.
            <br />
            One system.
            <br />
            <span className="text-ember">Zero crossover.</span>
          </h1>
          <p className="mt-6 max-w-sm text-steel-light">
            Members log their own training and progress. Owners run fees, plans and
            rosters. Each gym's data stays walled off from every other gym on the platform.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-steel-light">
          <div>
            <div className="font-display text-2xl text-bone">4</div>
            roles, one login
          </div>
          <div>
            <div className="font-display text-2xl text-bone">1</div>
            codebase, many gyms
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center bg-bone p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 bg-ember" />
              <span className="font-display text-lg tracking-wide text-ink">IRONLINE</span>
            </div>
          </div>

          <h2 className="mb-1 text-2xl font-semibold text-ink">Log in</h2>
          <p className="mb-8 text-sm text-steel">
            Members, gym owners and platform admins all sign in here.
          </p>

          {error && (
            <div className="mb-4 rounded-sm border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember-dark">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
