import React from 'react';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function CoachingSessionsBlock() {
  const { sessions } = useMemberDashboard();
  const scheduled = (sessions || []).filter((s) => s.status === 'scheduled');

  if (scheduled.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-2 text-sm font-medium text-steel">Upcoming Coaching Sessions</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {scheduled.slice(0, 4).map((s) => {
          const sDate = new Date(s.scheduledAt);
          return (
            <div key={s._id} className="panel p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember/15 text-ember">
                  <svg className="icon !h-5 !w-5">
                    <use href="#i-dumbbell" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{s.title}</div>
                  <div className="text-xs text-steel mt-0.5">
                    Coach {s.trainer?.name || 'Assigned Trainer'}
                  </div>
                  <div className="text-xs text-steel mt-1 font-medium">
                    🗓️ {sDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                    {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.durationMinutes}m)
                  </div>
                  {s.notes && <div className="mt-1 text-xs text-steel italic">"{s.notes}"</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
