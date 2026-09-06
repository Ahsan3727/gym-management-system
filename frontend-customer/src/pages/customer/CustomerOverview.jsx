import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import Modal from '../../components/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function CustomerOverview() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [membership, setMembership] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    const [profileRes, streakRes, membershipRes, weightRes] = await Promise.all([
      api.get('/customer/profile'),
      api.get('/customer/streak'),
      api.get('/customer/membership'),
      api.get('/customer/weight'),
    ]);
    setProfile(profileRes.data);
    setStreak(streakRes.data);
    setMembership(membershipRes.data);
    setWeightLogs(weightRes.data);
  }

  useEffect(() => {
    loadAll().catch(() => setError('Could not load your dashboard.'));
  }, []);

  async function performCheckin(qrToken) {
    setCheckingIn(true);
    setError('');
    try {
      const { data } = await api.post('/customer/streak/checkin', { qrToken });
      setStreak(data);
      showToast(`Checked in — ${data.currentStreak}d streak!`, { type: 'success' });
      setShowQrModal(false);
      setQrInput('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed. Verify the reception code.';
      setError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setCheckingIn(false);
    }
  }

  function handleCheckinClick() {
    if (profile?.gym?.checkinTokenRequired) {
      setShowQrModal(true);
    } else {
      performCheckin();
    }
  }

  const latestWeight = weightLogs[0];
  const checkedInToday = streak?.lastCheckin
    ? new Date(streak.lastCheckin).toDateString() === new Date().toDateString()
    : false;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="text-sm text-steel">Here's where things stand today at {profile?.gym?.gymName || 'your gym'}.</p>
        </div>
        {profile?.gym?.gymLogoUrl && (
          <img
            src={profile.gymLogoUrl || profile.gym.gymLogoUrl}
            alt="Gym Logo"
            className="h-12 w-12 rounded-2xl object-cover border border-ink/10"
          />
        )}
      </div>

      {error && <div className="mb-6 text-sm text-ember-dark">{error}</div>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon="flame" hi label="Current streak" value={streak ? `${streak.currentStreak}d` : '—'} accent="text-ember" />
        <StatCard icon="trend" label="Longest streak" value={streak ? `${streak.longestStreak}d` : '—'} />
        <StatCard icon="drop" label="Latest weight" value={latestWeight ? `${latestWeight.weightKg} kg` : '—'} />
        <StatCard
          icon="card"
          label="Membership"
          value={membership?.plan?.planName || 'No plan'}
          sub={membership?.nextDue ? `Due ${new Date(membership.nextDue.dueDate).toLocaleDateString()}` : 'No fee due'}
        />
      </div>

      <div className="panel card--tint mb-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember/15 text-ember">
            <svg className="icon !h-5 !w-5">
              <use href="#i-zap" />
            </svg>
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Daily check-in</div>
            <div className="mt-0.5 text-sm text-steel">
              {checkedInToday
                ? "You're checked in for today. Nice work!"
                : profile?.gym?.checkinTokenRequired
                ? 'Scan reception QR code or enter token to check in.'
                : "You haven't checked in today."}
            </div>
          </div>
        </div>
        <button
          onClick={handleCheckinClick}
          disabled={checkingIn || checkedInToday}
          className="btn-primary relative"
        >
          {checkedInToday ? 'Checked in' : checkingIn ? 'Checking in…' : profile?.gym?.checkinTokenRequired ? 'QR Check-in' : 'Check in'}
        </button>
      </div>

      {/* QR Check-In Modal for gyms requiring reception code */}
      {showQrModal && (
        <Modal
          title="Reception QR Verification"
          onClose={() => {
            setShowQrModal(false);
            setQrInput('');
          }}
          width="max-w-sm"
        >
          <p className="mb-4 text-xs text-steel">
            Enter the passcode or paste the scanned token displayed at your gym's front desk.
          </p>
          <input
            type="text"
            placeholder="Paste token or reception passcode…"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className="field-input mb-4 font-mono text-xs"
            autoFocus
          />
          {error && <div className="mb-3 text-xs text-ember-dark">{error}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => performCheckin(qrInput)}
              disabled={!qrInput.trim() || checkingIn}
              className="btn-primary flex-1 text-xs"
            >
              {checkingIn ? 'Verifying…' : 'Confirm Check-In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                setQrInput('');
              }}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {streak?.badges?.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 text-sm font-medium text-steel">Badges</div>
          <div className="flex flex-wrap gap-2">
            {streak.badges.map((b) => (
              <span key={b} className="chip border-chalk/20 bg-chalk/10 text-chalk-dark">
                <svg className="icon !h-3.5 !w-3.5">
                  <use href="#i-check-circle" />
                </svg>
                {b.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/workouts" className="btn-secondary">
          <svg className="icon !h-4 !w-4"><use href="#i-dumbbell" /></svg>
          Log a workout
        </Link>
        <Link to="/diet" className="btn-secondary">
          <svg className="icon !h-4 !w-4"><use href="#i-drop" /></svg>
          Log a meal
        </Link>
        <Link to="/weight" className="btn-secondary">
          <svg className="icon !h-4 !w-4"><use href="#i-trend" /></svg>
          Log weight & photo
        </Link>
      </div>
    </div>
  );
}
