import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

const TYPE_CONFIG = {
  fee_due: {
    label: 'Fee Due',
    bg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '💳',
  },
  streak_reminder: {
    label: 'Streak',
    bg: 'bg-orange-100 text-orange-900 border-orange-300',
    icon: '🔥',
  },
  admin_alert: {
    label: 'Announcement',
    bg: 'bg-red-100 text-red-900 border-red-300',
    icon: '📢',
  },
  general: {
    label: 'Update',
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: 'ℹ️',
  },
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
          <h1 className="text-3xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-steel">
            Stay up to date with fee notices, workout streak reminders, and gym announcements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary text-xs"
            >
              Mark all read ({unreadCount})
            </button>
          )}
          <button
            onClick={loadNotifications}
            className="btn-secondary text-xs"
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-ink/10 pb-2 gap-4 text-sm font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`pb-1 transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-ember font-semibold text-ink'
              : 'text-steel hover:text-ink'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-1 transition-colors ${
            filter === 'unread'
              ? 'border-b-2 border-ember font-semibold text-ink'
              : 'text-steel hover:text-ink'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {error && (
        <div className="rounded-sm border border-ember/30 bg-ember/5 px-4 py-3 text-sm text-ember-dark">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <div className="panel p-8 text-center text-steel">Loading notifications…</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bone text-2xl">
            🔔
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
                    ? 'border-l-4 border-l-ember bg-white shadow-sm cursor-pointer hover:bg-bone/40'
                    : 'bg-bone/30 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{config.icon}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold border ${config.bg}`}
                        >
                          {config.label}
                        </span>
                        {isUnread && (
                          <span className="inline-block h-2 w-2 rounded-full bg-ember" title="Unread" />
                        )}
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
                      className="shrink-0 text-xs text-steel hover:text-ember transition-colors"
                      title="Mark as read"
                    >
                      ✓ Mark read
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
