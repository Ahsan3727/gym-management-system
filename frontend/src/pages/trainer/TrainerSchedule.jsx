import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios.js';
import ListCard from '../../components/ListCard.jsx';
import Modal from '../../components/Modal.jsx';
import SegmentedControl from '../../components/SegmentedControl.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function TrainerSchedule() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'scheduled' | 'completed' | 'cancelled'
  const [error, setError] = useState('');

  // Book Session Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookForm, setBookForm] = useState({
    customerId: searchParams.get('client') || '',
    title: 'Personal Training Session',
    scheduledAt: '',
    durationMinutes: 60,
    notes: '',
  });

  async function loadData() {
    try {
      const [sessionsRes, clientsRes] = await Promise.all([
        api.get('/trainer/sessions'),
        api.get('/trainer/clients'),
      ]);
      setSessions(sessionsRes.data);
      setClients(clientsRes.data);
      if (!bookForm.customerId && clientsRes.data.length > 0) {
        setBookForm((prev) => ({ ...prev, customerId: clientsRes.data[0]._id }));
      }
    } catch {
      setError('Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Default scheduledAt to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const tzOffset = nextHour.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextHour.getTime() - tzOffset).toISOString().slice(0, 16);
    setBookForm((prev) => ({ ...prev, scheduledAt: localISOTime }));
  }, []);

  async function handleBookSession(e) {
    e.preventDefault();
    if (!bookForm.customerId || !bookForm.scheduledAt) {
      showToast('Client and date/time are required.', 'error');
      return;
    }
    setBooking(true);
    try {
      await api.post('/trainer/sessions', bookForm);
      showToast('Session booked successfully!', 'success');
      setShowBookModal(false);
      setBookForm((prev) => ({
        ...prev,
        title: 'Personal Training Session',
        notes: '',
      }));
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to book session.', 'error');
    } finally {
      setBooking(false);
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      await api.put(`/trainer/sessions/${id}`, { status: newStatus });
      showToast(`Session marked as ${newStatus}.`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update session.', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this scheduled session?')) return;
    try {
      await api.delete(`/trainer/sessions/${id}`);
      showToast('Session removed.', 'info');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete session.', 'error');
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const now = new Date();
  const upcomingToday = sessions.filter(
    (s) =>
      s.status === 'scheduled' &&
      new Date(s.scheduledAt).toDateString() === now.toDateString()
  );

  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  if (loading) return <div className="text-sm text-steel">Loading session schedule…</div>;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Training Schedule & Sessions</h1>
          <p className="text-sm text-steel">Book 1-on-1 personal coaching slots, manage client sessions, and log completions.</p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          disabled={clients.length === 0}
          className="btn-primary"
        >
          <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
          Book Session
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      {/* Metric Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Today's Sessions</div>
          <div className="mt-2 text-2xl font-bold text-ink">{upcomingToday.length}</div>
          <div className="mt-1 text-xs text-steel">Scheduled for today</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Total Booked</div>
          <div className="mt-2 text-2xl font-bold text-iron">{sessions.filter((s) => s.status === 'scheduled').length}</div>
          <div className="mt-1 text-xs text-steel">Active upcoming slots</div>
        </div>
        <div className="panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-steel">Completed Sessions</div>
          <div className="mt-2 text-2xl font-bold text-chalk-dark">{completedCount}</div>
          <div className="mt-1 text-xs text-steel">Coached successfully</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl
          accent="iron"
          options={[
            { value: 'all', label: `All (${sessions.length})` },
            { value: 'scheduled', label: `Scheduled (${sessions.filter((s) => s.status === 'scheduled').length})` },
            { value: 'completed', label: `Completed (${completedCount})` },
            { value: 'cancelled', label: `Cancelled (${sessions.filter((s) => s.status === 'cancelled').length})` },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* Sessions List */}
      <ListCard>
        {filteredSessions.map((s) => {
          const sessionDate = new Date(s.scheduledAt);
          const isUpcoming = sessionDate > new Date() && s.status === 'scheduled';
          return (
            <div
              key={s._id}
              className="flex flex-col gap-3 border-b border-ink/5 p-4 transition-colors last:border-0 hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                    s.status === 'completed'
                      ? 'bg-chalk/20 text-chalk-dark'
                      : s.status === 'cancelled'
                      ? 'bg-ember/15 text-ember-dark'
                      : 'bg-iron/15 text-iron'
                  }`}
                >
                  <svg className="icon !h-5 !w-5">
                    <use href={s.status === 'completed' ? '#i-check' : '#i-dumbbell'} />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        s.status === 'completed'
                          ? 'bg-chalk/20 text-chalk-dark'
                          : s.status === 'cancelled'
                          ? 'bg-ember/15 text-ember-dark'
                          : 'bg-iron/15 text-iron'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-steel">
                    Client: <strong className="text-ink">{s.customer?.name || 'Unknown'}</strong>
                    {s.customer?.phone ? ` · ${s.customer.phone}` : ''}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-steel">
                    <span>
                      🗓️ {sessionDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>
                      ⏰ {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.durationMinutes} min)
                    </span>
                  </div>
                  {s.notes && (
                    <div className="mt-1.5 rounded-lg bg-ink/5 px-2.5 py-1 text-xs text-steel italic">
                      "{s.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {s.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'completed')}
                      className="rounded-lg bg-chalk/10 px-2.5 py-1 text-xs font-semibold text-chalk-dark hover:bg-chalk/20 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(s._id, 'cancelled')}
                      className="rounded-lg bg-ink/5 px-2.5 py-1 text-xs font-medium text-steel hover:text-ember-dark transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(s._id)}
                  className="rounded-lg p-1 text-xs text-steel hover:text-ember-dark transition-colors"
                  title="Delete Session"
                >
                  <svg className="icon !h-4 !w-4"><use href="#i-trash" /></svg>
                </button>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="p-8 text-center text-sm text-steel">
            No {filter !== 'all' ? filter : ''} sessions found.
          </div>
        )}
      </ListCard>

      {/* Book Session Modal */}
      {showBookModal && (
        <Modal title="Book Training Session" onClose={() => setShowBookModal(false)}>
          <form onSubmit={handleBookSession}>
            <div className="mb-4">
              <label className="field-label">Select Client</label>
              <select
                className="field-input"
                value={bookForm.customerId}
                onChange={(e) => setBookForm({ ...bookForm, customerId: e.target.value })}
                required
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">Session Title</label>
              <input
                className="field-input"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                placeholder="e.g. Hypertrophy Check-in, 1-on-1 PT"
                required
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={bookForm.scheduledAt}
                  onChange={(e) => setBookForm({ ...bookForm, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Duration (Minutes)</label>
                <select
                  className="field-input"
                  value={bookForm.durationMinutes}
                  onChange={(e) => setBookForm({ ...bookForm, durationMinutes: Number(e.target.value) })}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="field-label">Preparation / Notes (Optional)</label>
              <textarea
                className="field-input"
                rows={2}
                placeholder="e.g. Focus on squat form, bring knee wraps"
                value={bookForm.notes}
                onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" disabled={booking} className="btn-primary w-full">
              {booking ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
