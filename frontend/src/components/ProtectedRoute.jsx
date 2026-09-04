import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// BUG #1 FIX: Use an explicit map instead of role.replace('_', '') which was
// fragile (only removes the first underscore, works for 'super_admin' by
// accident). Now any new role just needs an entry in this map.
const roleHome = {
  customer: '/customer',
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
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
  }

  return children;
}
