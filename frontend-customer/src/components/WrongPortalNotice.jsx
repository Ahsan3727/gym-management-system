import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const roleLabel = {
  admin: 'gym admin',
  trainer: 'trainer',
  super_admin: 'super admin',
};

/**
 * Shown when a staff credential (admin/trainer/super_admin) lands in the
 * member-only customer app — either because ProtectedRoute (AuthGuard)
 * caught an already-logged-in staff session, or because Login.jsx caught it
 * right after a successful login. Bounces with a clear message instead of
 * silently redirecting into a dashboard that doesn't exist in this bundle
 * (see IMPLEMENTATION_PLAN.md Phase 2).
 */
export default function WrongPortalNotice({ role }) {
  const { logout } = useAuth();
  const label = roleLabel[role] || 'staff';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-4">
      <div className="panel w-full max-w-sm px-7 py-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ember/10 text-ember">
          <svg className="icon !h-6 !w-6">
            <use href="#i-shield" />
          </svg>
        </div>
        <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-0.02em] text-ink">
          Wrong portal
        </h2>
        <p className="mb-6 text-sm text-steel">
          This account is a {label} login. This app is for gym members —
          head to the staff console instead.
        </p>
        <button onClick={() => logout()} className="btn-primary w-full">
          Log out
        </button>
      </div>
    </div>
  );
}
