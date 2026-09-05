import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import SegmentedControl from '../../components/SegmentedControl.jsx';

const TYPE_CONFIG = {
  fee_due: { label: 'Fee Due', icon: 'card', accent: 'ember' },
  streak_reminder: { label: 'Streak', icon: 'flame', accent: 'ember' },
  admin_alert: { label: 'Announcement', icon: 'bell', accent: 'iron' },
  general: { label: 'Update', icon: 'note', accent: 'chalk' },
};

const ACCENT_CLASSES = {
  ember: { chip: 'border-ember/25 bg-ember/10 text-ember-dark', iconBg: 'bg-ember/15 text-ember-dark', bar: 'border-l-ember' },
  iron: { chip: 'border-iron/25 bg-iron/10 text-iron', iconBg: 'bg-iron/15 text-iron', bar: 'border-l-iron' },
  chalk: { chip: 'border-chalk/25 bg-chalk/10 text-chalk-dark', iconBg: 'bg-chalk/15 text-chalk-dark', bar: 'border-l-chalk' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  async function loadNotifications() {
    try {
      setError('');
      const res = await api.get('/customer/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id) {
    try {
      await api.patch(`/customer/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch {
      // silently ignore or reload
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.patch('/customer/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    } catch {
      // fallback reload
      loadNotifications();
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.readAt;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-steel">
            Stay up to date with fee notices, workout streak reminders, and gym announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary text-xs">
              Mark all read ({unreadCount})
            </button>
          )}
          <button
            onClick={loadNotifications}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 text-steel transition-colors hover:border-ink/30 hover:text-ink"
            title="Refresh"
            aria-label="Refresh notifications"
          >
            <svg className="icon !h-4 !w-4"><use href="#i-arrow-r" /></svg>
          </button>
        </div>
      </div>

      <SegmentedControl
        options={[
          { value: 'all', label: `All (${notifications.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {error && (
        <div className="rounded-2xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember-dark">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="panel p-8 text-center text-steel">Loading notifications…</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-steel">
            <svg className="icon !h-6 !w-6"><use href="#i-bell" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-ink">No notifications</h3>
          <p className="mt-1 text-sm text-steel">
            {filter === 'unread'
              ? 'You have caught up with all your notifications!'
              : 'You have no alerts at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.readAt;
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
            const classes = ACCENT_CLASSES[config.accent];
            const formattedDate = notif.sentAt
              ? new Date(notif.sentAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Just now';

            return (
              <div
                key={notif._id}
                onClick={() => isUnread && handleMarkRead(notif._id)}
                className={`panel p-4 transition-all ${
                  isUnread
                    ? `border-l-4 ${classes.bar} cursor-pointer hover:bg-ink/[0.03]`
                    : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${classes.iconBg}`}>
                      <svg className="icon !h-[18px] !w-[18px]"><use href={`#i-${config.icon}`} /></svg>
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`chip ${classes.chip}`}>{config.label}</span>
                        {isUnread && <span className="inline-block h-2 w-2 rounded-full bg-ember" title="Unread" />}
                        <span className="text-xs text-steel">{formattedDate}</span>
                      </div>
                      <p className={`text-sm ${isUnread ? 'font-medium text-ink' : 'text-steel'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notif._id);
                      }}
                      className="shrink-0 text-xs text-steel hover:text-ink transition-colors"
                      title="Mark as read"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
