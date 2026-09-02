import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/audit-log').then((res) => setLogs(res.data)).catch(() => setError('Could not load the audit log.'));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Audit log</h1>
      <p className="mb-8 text-sm text-steel">Every super-admin action, most recent first.</p>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink/70">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-ink/70">{log.actor?.username || '—'}</td>
                <td className="px-4 py-3 font-medium text-ink">{log.action}</td>
                <td className="px-4 py-3 text-ink/70">{log.targetType || '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-steel">No actions logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
