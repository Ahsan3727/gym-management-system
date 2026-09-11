import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  saveOfflineCheckin,
  getPendingCheckin,
  clearPendingCheckin,
  initBackgroundSync,
} from '../../utils/offlineCheckin.js';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CustomerCheckin() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');

  // Offline state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePending, setOfflinePending] = useState(Boolean(getPendingCheckin()));
  const [restDayNotice, setRestDayNotice] = useState(false);

  // In-app QR scanner modal
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  const autoCheckedRef = useRef(false);

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

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize background sync for any queued offline check-ins
    const unsubscribeSync = initBackgroundSync(
      api,
      (syncedStreak) => {
        setStreak(syncedStreak);
        setOfflinePending(false);
        showToast('Offline check-in successfully synced with gym servers! 🔥', 'success');
      },
      (errMessage) => {
        console.warn('[Checkin] Auto-sync attempt:', errMessage);
      }
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeSync) unsubscribeSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto Check-In from URL (?token=...) ─────────────────────────────────────
  const urlToken = searchParams.get('token');

  useEffect(() => {
    if (urlToken && !autoCheckedRef.current && !checkingIn) {
      autoCheckedRef.current = true;
      executeCheckin(urlToken.trim());
      // Clean query param from URL bar
      navigate('/customer/checkin', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  // ── Core Check-In Function (Handles Online & Offline) ───────────────────────
  async function executeCheckin(rawToken) {
    let token = (rawToken || '').trim();

    // Extract token if user scanned/passed full URL
    if (token.includes('token=')) {
      try {
        const u = new URL(token, 'http://localhost');
        token = u.searchParams.get('token') || token;
      } catch {
        const match = token.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) token = match[1];
      }
    }

    if (!token && profile?.gym?.checkinTokenRequired) {
      setError('Please provide a check-in token.');
      return;
    }

    setCheckingIn(true);
    setError('');
    setRestDayNotice(false);

    // ── If Device is Offline: Queue Check-In Locally ──
    if (!navigator.onLine) {
      saveOfflineCheckin({ token });
      setOfflinePending(true);
      setStreak((prev) => ({
        ...prev,
        currentStreak: (prev?.currentStreak || 0) + 1,
        totalCheckins: (prev?.totalCheckins || 0) + 1,
        lastCheckin: new Date().toISOString(),
        isOfflineOptimistic: true,
      }));
      setQrToken('');
      setCheckingIn(false);
      showToast('Checked in locally! Will automatically sync when you connect to internet.', 'info');
      return;
    }

    // ── If Online: Submit to Server ──
    try {
      const { data } = await api.post('/customer/checkin', { qrToken: token });
      setStreak(data);
      setQrToken('');
      setOfflinePending(false);
      clearPendingCheckin();

      if (data.restDayApplied) {
        setRestDayNotice(true);
        showToast(`Streak saved! 1 weekly rest day applied. Streak is now ${data.currentStreak} day(s)! 🛡️🔥`, 'success');
      } else {
        showToast(`Checked in successfully! Streak is now ${data.currentStreak} day(s)! 🔥`, 'success');
      }
    } catch (err) {
      // If network connection drop occurred during request
      if (!err.response) {
        saveOfflineCheckin({ token });
        setOfflinePending(true);
        setStreak((prev) => ({
          ...prev,
          currentStreak: (prev?.currentStreak || 0) + 1,
          totalCheckins: (prev?.totalCheckins || 0) + 1,
          lastCheckin: new Date().toISOString(),
          isOfflineOptimistic: true,
        }));
        setQrToken('');
        showToast('Network dropped. Check-in queued and will sync automatically!', 'warning');
      } else {
        const msg = err.response?.data?.message || 'Check-in failed. Please verify the reception QR code.';
        setError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setCheckingIn(false);
    }
  }

  function handleManualSubmit(e) {
    if (e) e.preventDefault();
    executeCheckin(qrToken);
  }

  // ── In-App Camera Scanner Lifecycle ─────────────────────────────────────────
  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      // Small timeout to ensure DOM container is mounted
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          'qr-reader-view',
          { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
          false
        );
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            // Scan succeeded!
            scanner.clear().catch(() => {});
            setShowScanner(false);
            executeCheckin(decodedText);
          },
          () => {
            // Scan frame ignored / no QR found
          }
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [showScanner]);

  if (loading) return <div className="text-sm text-steel">Loading check-in hub…</div>;

  const checkedInToday = streak?.lastCheckin
    ? new Date(streak.lastCheckin).toDateString() === new Date().toDateString()
    : false;

  const gymRequiresQr = !!profile?.gym?.checkinTokenRequired;

  // Calculate Rest Day status
  let restDayStatusText = 'Available (1/week)';
  let restDayAvailable = true;
  if (streak?.lastRestDayUsed) {
    const daysSinceRest = Math.round((Date.now() - new Date(streak.lastRestDayUsed).getTime()) / 86400000);
    if (daysSinceRest < 7) {
      restDayAvailable = false;
      restDayStatusText = `Used ${daysSinceRest}d ago (recharges in ${7 - daysSinceRest}d)`;
    }
  }

  const milestones = [
    { days: 7, label: '7-Day Warrior', unlocked: (streak?.longestStreak || 0) >= 7 },
    { days: 30, label: '30-Day Iron', unlocked: (streak?.longestStreak || 0) >= 30 },
    { days: 100, label: '100-Day Century', unlocked: (streak?.longestStreak || 0) >= 100 },
    { days: 365, label: '365-Day Legend', unlocked: (streak?.longestStreak || 0) >= 365 },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Gym Floor Check-In</h1>
          <p className="mt-1 text-sm text-steel">
            Scan desk QR or tap check-in at {profile?.gym?.gymName || 'your gym'} to build your training streak.
          </p>
        </div>

        {/* Network indicator pill */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/15 text-amber-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {isOnline ? 'Online' : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Offline Pending Sync Banner */}
      {offlinePending && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🟡</span>
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Check-In Queued (Offline)
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                Your visit has been recorded locally. It will sync automatically to gym records the moment your phone connects to internet.
              </div>
            </div>
          </div>
          <button
            onClick={() => executeCheckin(getPendingCheckin()?.token || '')}
            disabled={!isOnline || checkingIn}
            className="btn-secondary text-xs shrink-0 py-1.5 px-3"
          >
            {checkingIn ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Rest Day Applied Celebration Alert */}
      {restDayNotice && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wide">
              Weekly Rest Day Protection Applied!
            </div>
            <div className="text-xs text-sky-700 mt-0.5">
              You took 1 rest day, so your training streak was protected and continues without resetting. (1 rest day allowed per 7-day period).
            </div>
          </div>
        </div>
      )}

      {error && <div className="rounded-2xl bg-ember/10 p-4 text-sm text-ember-dark">{error}</div>}

      {/* Main Check-In Hero Card */}
      <div className="panel p-8 text-center relative overflow-hidden shadow-soft">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-ember/15 text-ember shadow-soft">
          <svg className="icon !h-10 !w-10">
            <use href={checkedInToday ? '#i-check-circle' : '#i-zap'} />
          </svg>
        </div>

        {checkedInToday ? (
          <div>
            <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 mb-2">
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
                ? 'Scan the QR code at reception with your phone camera or tap below to scan inside the app.'
                : 'Confirm your arrival at the gym floor to keep your streak going.'}
            </p>

            {gymRequiresQr ? (
              <div className="mt-6 max-w-sm mx-auto space-y-3">
                {/* 1-Click In-App Scanner Button */}
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  disabled={checkingIn}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-soft"
                >
                  <svg className="icon !h-5 !w-5"><use href="#i-shield" /></svg>
                  📷 Scan Reception QR Code
                </button>

                <div className="flex items-center gap-2 my-2">
                  <div className="h-px flex-1 bg-ink/10" />
                  <span className="text-[11px] text-steel uppercase font-medium">or enter code manually</span>
                  <div className="h-px flex-1 bg-ink/10" />
                </div>

                {/* Manual Code Input */}
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter desk passcode or paste link…"
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    className="field-input font-mono text-center text-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={checkingIn || !qrToken.trim()}
                    className="btn-secondary w-full text-xs"
                  >
                    {checkingIn ? 'Verifying Check-In…' : 'Submit Check-In'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={() => executeCheckin('')}
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

      {/* Streak & Rest Day Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          icon="flame"
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
        <div className="panel px-4 py-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-steel font-medium">Weekly Rest Day</span>
            <span className={`h-2 w-2 rounded-full ${restDayAvailable ? 'bg-emerald-500' : 'bg-steel'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-sm font-bold ${restDayAvailable ? 'text-emerald-700' : 'text-steel'}`}>
              {restDayStatusText}
            </div>
            <div className="text-[11px] text-steel mt-0.5">
              1 rest day/week protected without streak loss
            </div>
          </div>
        </div>
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
                  ? 'border-chalk/30 bg-chalk/10 text-chalk-dark shadow-sm'
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

      {/* In-App Camera Scanner Modal */}
      {showScanner && (
        <Modal title="Scan Reception QR Code" onClose={() => setShowScanner(false)} width="max-w-md">
          <div className="text-center">
            <p className="text-xs text-steel mb-3">
              Point your camera at the QR code displayed on the reception desk.
            </p>
            <div
              id="qr-reader-view"
              className="overflow-hidden rounded-2xl border border-ink/10 bg-black max-w-full mx-auto"
            />
            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="btn-secondary w-full text-xs mt-4"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
