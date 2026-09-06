import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import WrongPortalNotice from './WrongPortalNotice.jsx';

// BUG #1 FIX: Use an explicit map instead of role.replace('_', '') which was
// fragile (only removes the first underscore, works for 'super_admin' by
// accident). Now any new role just needs an entry in this map.
// Customer accounts never reach this bundle — they log into the separate
// customer app — so this only lists the three staff roles.
const roleHome = {
  trainer: '/trainer',
  admin: '/admin',
  super_admin: '/superadmin',
};

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bone text-steel">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // A member session opened a staff bookmark — there's no home for that
    // role in this bundle, so show the notice instead of bouncing to
    // /login (which would just show the form again for an already
    // logged-in user).
    if (!roleHome[user.role]) return <WrongPortalNotice />;
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return children;
}
