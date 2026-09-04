import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import StatCard from '../../components/StatCard.jsx';
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
  if (error) return <div className="text-sm text-ember-dark">{error}</div>;

  const trainer = profileData?.trainer;
  const gym = profileData?.gym;

  const totalStreakDays = clients.reduce((acc, c) => acc + (c.streak || 0), 0);
  const activeClientsCount = clients.length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">
            Trainer Dashboard — Coach {trainer?.name || user?.username}
          </h1>
          <p className="text-sm text-steel">
            Managing clients at <strong className="text-ink">{gym?.gymName || 'Ironline Gym'}</strong> ({trainer?.specialty || 'Fitness Specialist'}).
          </p>
        </div>
        {gym?.gymLogoUrl && (
          <img src={gym.gymLogoUrl} alt="Gym Logo" className="h-12 w-12 rounded-lg object-cover border border-ink/10" />
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Assigned Clients" value={activeClientsCount} />
        <StatCard label="Combined Streaks" value={`${totalStreakDays}d`} accent="text-ember" />
        <StatCard label="Specialty" value={trainer?.specialty || 'General'} />
      </div>

      <div className="panel mb-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">My Client Roster</h2>
            <p className="text-xs text-steel">Members assigned to your training sessions and fitness tracking.</p>
          </div>
          <Link to="/trainer/clients" className="btn-secondary text-xs">
            Open Training Studio →
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Streak</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-xs text-ink/70">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-xs text-ink/70">{c.plan?.planName || 'No plan'}</td>
                <td className="px-4 py-3 font-semibold text-ember">
                  {c.streak > 0 ? `${c.streak} days 🔥` : '0 days'}
                </td>
                <td className="px-4 py-3 text-xs text-ink/70">
                  {c.lastWorkoutDate ? new Date(c.lastWorkoutDate).toLocaleDateString() : 'No recent log'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/trainer/clients?client=${c._id}`}
                    className="btn-primary py-1 px-2.5 text-xs inline-block"
                  >
                    View & Prescribe
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-steel">
                  No clients currently assigned. Your gym administrator can assign members from the Admin Trainers console.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
