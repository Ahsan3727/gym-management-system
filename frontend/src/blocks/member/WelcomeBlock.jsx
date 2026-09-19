import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function WelcomeBlock() {
  const { user } = useAuth();
  const { profile } = useMemberDashboard();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-ink page-header">
          Welcome back{user?.username ? `, ${user.username}` : ''}
        </h1>
        <p className="text-sm text-steel">Here's where things stand today at {profile?.gym?.gymName || 'your gym'}.</p>
      </div>
      {profile?.gym?.gymLogoUrl && (
        <img
          src={profile.gym.gymLogoUrl}
          alt="Gym Logo"
          className="h-12 w-12 rounded-2xl object-cover border border-ink/10"
        />
      )}
    </div>
  );
}
