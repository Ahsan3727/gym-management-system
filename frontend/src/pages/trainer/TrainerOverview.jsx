import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
import ListRow from '../../components/ListRow.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TrainerOverview() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [profileRes, clientsRes] = await Promise.all([
        api.get('/trainer/profile'),
        api.get('/trainer/clients'),
      ]);
      setProfileData(profileRes.data);
      setClients(clientsRes.data);
    } catch {
      setError('Could not load trainer dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="text-sm text-steel">Loading trainer dashboard…</div>;
  if (error) return <div className="text-sm text-danger">{error}</div>;

  const trainer = profileData?.trainer;
  const gym = profileData?.gym;

  const totalStreakDays = clients.reduce((acc, c) => acc + (c.streak || 0), 0);
  const activeClientsCount = clients.length;

  return (
    <div className="page-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline text-ink">Trainer Dashboard</h1>
          <p className="text-caption mt-0.5">
            Coaching at <strong className="text-ink">{gym?.gymName || 'your gym'}</strong> &middot; {trainer?.specialty || 'Fitness Specialist'}
          </p>
        </div>
        {gym?.gymLogoUrl && (
          <img src={gym.gymLogoUrl} alt="Gym Logo" className="h-12 w-12 rounded-[10px] object-cover border border-ink/10" />
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon="user" hi label="Assigned Clients" value={activeClientsCount} />
        <StatCard icon="flame" label="Combined Streaks" value={`${totalStreakDays}d`} accent="text-ember" />
        <StatCard icon="sliders" label="Specialty" value={trainer?.specialty || 'General'} />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="text-title text-ink">My Client Roster</h2>
            <p className="text-caption">Members assigned to your training sessions</p>
          </div>
          <Link to="/trainer/clients" className="btn-secondary btn-sm">
            Training Studio
            <svg className="icon !h-4 !w-4"><use href="#i-arrow-r" /></svg>
          </Link>
        </div>
        <div className="divide-y divide-ink/10">
          {clients.map((c) => {
            const initials = (c.name || '?').trim().charAt(0).toUpperCase();
            return (
              <div key={c._id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink/[0.02] transition-colors">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold text-on-primary"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--c-ember-light)), rgb(var(--c-ember)))' }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{c.name}</span>
                    {c.streak > 0 && <span className="badge-warning">🔥 {c.streak}d</span>}
                  </div>
                  <p className="text-xs text-steel truncate">{c.phone || 'No phone'} &middot; {c.plan?.planName || 'No plan'}</p>
                </div>
                <Link to={`/trainer/clients?client=${c._id}`} className="btn-primary btn-sm shrink-0">Prescribe</Link>
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-ink/10 bg-panel-2">
                <svg className="icon !h-6 !w-6 text-steel"><use href="#i-users" /></svg>
              </div>
              <h3 className="text-title text-ink mb-1">No clients assigned</h3>
              <p className="text-caption max-w-xs">Your gym administrator can assign members from the Admin Trainers console.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
