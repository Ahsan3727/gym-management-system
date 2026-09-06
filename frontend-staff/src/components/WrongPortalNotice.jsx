import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Shown when a member credential lands in the staff console — either
 * because ProtectedRoute caught an already-logged-in customer session, or
 * because Login.jsx caught it right after a successful login. Bounces with
 * a clear message rather than a dead redirect (see
 * IMPLEMENTATION_PLAN.md Phase 6 testing checklist).
 */
export default function WrongPortalNotice() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-4">
      <div className="panel w-full max-w-sm px-7 py-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-iron/10 text-iron">
          <svg className="icon !h-6 !w-6">
            <use href="#i-shield" />
          </svg>
        </div>
        <h2 className="mb-2 font-display text-xl font-extrabold tracking-[-0.02em] text-ink">
          Wrong portal
        </h2>
        <p className="mb-6 text-sm text-steel">
          This is a member login. This console is for admins, trainers, and
          the platform team — head to the member app instead.
        </p>
        <button onClick={() => logout()} className="btn-primary w-full">
          Log out
        </button>
      </div>
    </div>
  );
}
