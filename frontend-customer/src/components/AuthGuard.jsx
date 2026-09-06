import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import WrongPortalNotice from './WrongPortalNotice.jsx';

/**
 * Replaces ProtectedRoute for the customer app. No `role` prop needed —
 * there's only one role in this bundle (see IMPLEMENTATION_PLAN.md Phase 2).
 */
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bone text-steel">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'customer') {
    // A staff credential landed here — bounce with a clear message rather
    // than silently redirecting into a dashboard that doesn't exist in
    // this bundle.
    return <WrongPortalNotice role={user.role} />;
  }

  return children;
}
