import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import ListCard from '../../components/ListCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function CustomerCheckin() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [profileRes, streakRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/streak'),
      ]);
      setProfile(profileRes.data);
      setStreak(streakRes.data);
    } catch {
      setError('Could not load check-in details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckin(e) {
    if (e) e.preventDefault();
    setCheckingIn(true);
    setError('');
    try {
      const { data } = await api.post('/customer/checkin', { qrToken: qrToken.trim() });
      setStreak(data);
      setQrToken('');
      showToast(`Checked in successfully! Streak is now ${data.currentStreak} day(s)! 🔥`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed. Please verify the reception QR code.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setCheckingIn(false);
    }
  }

  if (loading) return <div className="text-sm text-steel">Loading check-in hub…</div>;

  const checkedInToday = streak?.lastCheckin
    ? new Date(streak.lastCheckin).toDateString() === new Date().toDateString()
    : false;

  const gymRequiresQr = !!profile?.gym?.checkinTokenRequired;

  const milestones = [
    { days: 7, label: '7-Day Warrior', unlocked: (streak?.longestStreak || 0) >= 7 },
    { days: 30, label: '30-Day Iron', unlocked: (streak?.longestStreak || 0) >= 30 },
    { days: 100, label: '100-Day Century', unlocked: (streak?.longestStreak || 0) >= 100 },
    { days: 365, label: '365-Day Legend', unlocked: (streak?.longestStreak || 0) >= 365 },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Gym Floor Check-In</h1>
        <p className="mt-1 text-sm text-steel">
          Verify your physical visit at {profile?.gym?.gymName || 'Ironline Gym'} and build your training streak.
        </p>
      </div>

      {error && <div className="rounded-2xl bg-ember/10 p-4 text-sm text-ember-dark">{error}</div>}

      {/* Main Check-In Hero Card */}
      <div className="panel p-8 text-center relative overflow-hidden">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-ember/15 text-ember shadow-soft">
          <svg className="icon !h-10 !w-10">
            <use href={checkedInToday ? '#i-check-circle' : '#i-zap'} />
          </svg>
        </div>

        {checkedInToday ? (
          <div>
            <span className="inline-flex rounded-full bg-chalk/15 px-3 py-1 text-xs font-semibold text-chalk-dark mb-2">
              Verified Today ✅
            </span>
            <h2 className="text-2xl font-bold text-ink">You're Checked In!</h2>
            <p className="mt-1 text-sm text-steel max-w-md mx-auto">
              Great work showing up today. Your visit has been logged and your attendance streak is active.
            </p>

            <div className="mt-6 flex justify-center items-center gap-6">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-steel font-medium">Active Streak</div>
                <div className="text-3xl font-extrabold text-ember mt-0.5">{streak?.currentStreak || 1} Days</div>
              </div>
              <div className="h-8 w-px bg-ink/10" />
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-steel font-medium">Total Check-Ins</div>
                <div className="text-3xl font-extrabold text-ink mt-0.5">{streak?.totalCheckins || 1}</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-ink">Ready to Train?</h2>
            <p className="mt-1 text-sm text-steel max-w-md mx-auto">
              {gymRequiresQr
                ? 'Scan the QR code displayed at reception or enter the daily check-in code below.'
                : 'Confirm your arrival at the gym floor to keep your streak going.'}
            </p>

            {gymRequiresQr ? (
              <form onSubmit={handleCheckin} className="mt-6 max-w-sm mx-auto space-y-3">
                <input
                  type="text"
                  placeholder="Paste QR token or reception passcode…"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  className="field-input font-mono text-center text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={checkingIn || !qrToken.trim()}
                  className="btn-primary w-full"
                >
                  {checkingIn ? 'Verifying with Reception…' : 'Verify & Check In'}
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <button
                  onClick={() => handleCheckin()}
                  disabled={checkingIn}
                  className="btn-primary px-8 py-3 text-base shadow-soft"
                >
                  {checkingIn ? 'Checking In…' : 'Check In to Gym'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Streak & Attendance Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="flame"
          hi
          label="Current Streak"
          value={`${streak?.currentStreak || 0} Days`}
          accent="text-ember"
          sub="Consecutive training days"
        />
        <StatCard
          icon="trend"
          label="Best Streak Record"
          value={`${streak?.longestStreak || 0} Days`}
          sub="All-time personal best"
        />
        <StatCard
          icon="card"
          label="Lifetime Visits"
          value={streak?.totalCheckins || 0}
          sub="Total gym sessions"
        />
      </div>

      {/* Milestone Badges */}
      <div className="panel p-6">
        <h3 className="font-semibold text-ink mb-1">Consistency Milestones</h3>
        <p className="text-xs text-steel mb-4">Unlock legendary badges as your gym commitment grows</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 text-center transition-all ${
                m.unlocked
                  ? 'border-chalk/30 bg-chalk/10 text-chalk-dark'
                  : 'border-ink/10 bg-ink/[0.02] text-steel opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{m.unlocked ? '🏆' : '🔒'}</div>
              <div className="text-xs font-semibold">{m.label}</div>
              <div className="text-[10px] mt-0.5">{m.days} days streak</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
