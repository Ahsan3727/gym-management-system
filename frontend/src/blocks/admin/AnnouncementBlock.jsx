import React, { useState } from 'react';
import { useAdminDashboard } from '../useAdminDashboardData.jsx';

export default function AnnouncementBlock() {
  const { announcing, sendAnnouncement } = useAdminDashboard();
  const [announcement, setAnnouncement] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!announcement.trim()) return;
    const success = await sendAnnouncement(announcement);
    if (success) {
      setAnnouncement('');
    }
  }

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-ink">Broadcast Gym Announcement</h3>
        <span className="text-xs text-steel">Instant in-app alert to all active members</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={4}
          className="field-input resize-none"
          placeholder="e.g. Schedule update: Gym opens at 6:00 AM this bank holiday. New spin class starting Tuesday!"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          required
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-steel">Members receive this on their dashboard alerts immediately.</span>
          <button
            type="submit"
            disabled={announcing || !announcement.trim()}
            className="btn-primary text-xs"
          >
            <svg className="icon !h-4 !w-4">
              <use href="#i-bell" />
            </svg>
            {announcing ? 'Broadcasting…' : 'Broadcast to Members'}
          </button>
        </div>
      </form>
    </div>
  );
}
