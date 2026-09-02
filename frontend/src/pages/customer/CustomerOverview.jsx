import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CustomerOverview() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);
  const [membership, setMembership] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    const [streakRes, membershipRes, weightRes] = await Promise.all([
      api.get('/customer/streak'),
      api.get('/customer/membership'),
      api.get('/customer/weight'),
    ]);
    setStreak(streakRes.data);
    setMembership(membershipRes.data);
    setWeightLogs(weightRes.data);
  }

  useEffect(() => {
    loadAll().catch(() => setError('Could not load your dashboard.'));
  }, []);

  async function handleCheckin() {
    setCheckingIn(true);
    try {
      const { data } = await api.post('/customer/streak/checkin');
      setStreak(data);
    } catch {
      setError('Check-in failed. Try again.');
    } finally {
      setCheckingIn(false);
    }
  }

  const latestWeight = weightLogs[0];
  const checkedInToday = streak?.lastCheckin
    ? new Date(streak.lastCheckin).toDateString() === new Date().toDateString()
    : false;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">
        Welcome back{user?.username ? `, ${user.username}` : ''}
      </h1>
      <p className="mb-8 text-sm text-steel">Here's where things stand today.</p>

      {error && <div className="mb-6 text-sm text-ember-dark">{error}</div>}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Current streak" value={streak ? `${streak.currentStreak}d` : '—'} accent="text-ember" />
        <StatCard label="Longest streak" value={streak ? `${streak.longestStreak}d` : '—'} />
        <StatCard label="Latest weight" value={latestWeight ? `${latestWeight.weightKg} kg` : '—'} />
        <StatCard
          label="Membership"
          value={membership?.plan?.planName || 'No plan'}
          sub={membership?.nextDue ? `Due ${new Date(membership.nextDue.dueDate).toLocaleDateString()}` : 'No fee due'}
        />
      </div>

      <div className="panel mb-8 flex items-center justify-between px-6 py-5">
        <div>
          <div className="text-sm font-medium text-steel">Daily check-in</div>
          <div className="mt-0.5 text-sm text-ink/80">
            {checkedInToday ? "You're checked in for today. Nice work." : "You haven't checked in today."}
          </div>
        </div>
        <button onClick={handleCheckin} disabled={checkingIn || checkedInToday} className="btn-primary">
          {checkedInToday ? 'Checked in' : checkingIn ? 'Checking in…' : 'Check in'}
        </button>
      </div>

      {streak?.badges?.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 text-sm font-medium text-steel">Badges</div>
          <div className="flex flex-wrap gap-2">
            {streak.badges.map((b) => (
              <span key={b} className="rounded-sm bg-chalk/15 px-3 py-1 text-xs font-medium text-chalk-dark">
                {b.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link to="/customer/workouts" className="btn-secondary">Log a workout</Link>
        <Link to="/customer/diet" className="btn-secondary">Log a meal</Link>
        <Link to="/customer/weight" className="btn-secondary">Log weight</Link>
      </div>
    </div>
  );
}
