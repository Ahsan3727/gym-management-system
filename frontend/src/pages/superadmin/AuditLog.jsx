import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Timeline from '../../components/Timeline.jsx';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/superadmin/audit-log')
      .then((res) => setLogs(res.data))
      .catch(() => setError('Could not load the audit log.'))
      .finally(() => setLoading(false));
  }, []);

  const items = logs.map((log) => ({
    id: log._id,
    title: log.action,
    time: new Date(log.created_at).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    description: `${log.actor?.username || 'Unknown actor'}${log.targetType ? ` → ${log.targetType}` : ''}`,
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Audit log</h1>
      <p className="mb-8 text-sm text-steel">Every super-admin action, most recent first.</p>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel p-6">
        {loading ? (
          <div className="py-8 text-center text-sm text-steel">Loading audit log…</div>
        ) : items.length > 0 ? (
          <Timeline accent="iron" items={items} />
        ) : (
          <div className="py-8 text-center text-sm text-steel">No actions logged yet.</div>
        )}
      </div>
    </div>
  );
}
