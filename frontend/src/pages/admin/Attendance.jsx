import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import ListCard from '../../components/ListCard.jsx';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminAttendance() {
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Check-In Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [checkingInManual, setCheckingInManual] = useState(false);

  async function loadAttendance() {
    try {
      const { data } = await api.get('/admin/attendance', {
        params: { date: selectedDate, search: search.trim() || undefined },
      });
      setAttendance(data.attendance || []);
      setTotalToday(data.totalToday || 0);
    } catch {
      showToast('Could not load attendance records.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const { data } = await api.get('/admin/customers');
      setCustomers(data || []);
      if (!selectedCustomerId && data.length > 0) {
        setSelectedCustomerId(data[0]._id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadAttendance();
  }

  async function handleManualCheckin(e) {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setCheckingInManual(true);
    try {
      const { data } = await api.post('/admin/attendance/manual', {
        customerId: selectedCustomerId,
        notes: manualNote || 'Manual check-in at reception',
      });
      showToast(data.message || 'Member checked in!', 'success');
      setShowManualModal(false);
      setManualNote('');
      await loadAttendance();
    } catch (err) {
      showToast(err.response?.data?.message || 'Manual check-in failed.', 'error');
    } finally {
      setCheckingInManual(false);
    }
  }

  const qrCount = attendance.filter((a) => a.method === 'qr').length;
  const manualCount = attendance.filter((a) => a.method === 'manual').length;

  if (loading) return <div className="text-sm text-steel">Loading reception attendance…</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Member Attendance & Check-Ins</h1>
          <p className="mt-1 text-sm text-steel">
            Monitor daily gym floor traffic, QR verifications, and manual front-desk check-ins.
          </p>
        </div>
        <button onClick={() => setShowManualModal(true)} className="btn-primary">
          <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
          Manual Check-In
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon="zap"
          hi
          label="Total Check-Ins"
          value={totalToday}
          accent="text-iron"
          sub={selectedDate === new Date().toISOString().split('T')[0] ? 'Recorded today' : `On ${selectedDate}`}
        />
        <StatCard
          icon="camera"
          label="QR Code Scans"
          value={qrCount}
          sub={`${totalToday > 0 ? Math.round((qrCount / totalToday) * 100) : 0}% automated`}
        />
        <StatCard
          icon="user"
          label="Manual Reception Entry"
          value={manualCount}
          sub="Front-desk verified"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            className="field-input py-1.5 text-xs font-mono"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <input
            className="field-input py-1.5 text-xs"
            placeholder="Search member name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary text-xs">Filter</button>
        </form>

        <button
          onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setSearch(''); }}
          className="text-xs font-medium text-iron hover:underline"
        >
          Jump to Today
        </button>
      </div>

      {/* Attendance Log Table */}
      <ListCard>
        {attendance.map((record) => {
          const timeStr = new Date(record.checkedInAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <div
              key={record._id}
              className="flex items-center justify-between border-b border-ink/5 p-4 last:border-0 hover:bg-ink/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    record.method === 'qr' ? 'bg-iron/15 text-iron' : 'bg-chalk/15 text-chalk-dark'
                  }`}
                >
                  <svg className="icon !h-5 !w-5">
                    <use href={record.method === 'qr' ? '#i-zap' : '#i-user'} />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{record.customer?.name || 'Unknown Member'}</h3>
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        record.method === 'qr' ? 'bg-iron/10 text-iron' : 'bg-chalk/10 text-chalk-dark'
                      }`}
                    >
                      {record.method === 'qr' ? 'QR Scan' : 'Reception'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-steel">
                    {record.customer?.phone || 'No phone'} • Plan:{' '}
                    <strong>{record.customer?.plan?.planName || 'General Membership'}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-ink">{timeStr}</div>
                <div className="text-[11px] text-steel">
                  {new Date(record.checkedInAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          );
        })}

        {attendance.length === 0 && (
          <div className="p-8 text-center text-sm text-steel">
            No check-in records found for this date.
          </div>
        )}
      </ListCard>

      {/* Manual Check-In Modal */}
      {showManualModal && (
        <Modal
          title="Manual Reception Check-In"
          onClose={() => setShowManualModal(false)}
        >
          <form onSubmit={handleManualCheckin}>
            <p className="mb-4 text-xs text-steel">
              Manually check in a gym member who forgot their phone or scanned reception QR offline.
            </p>

            <div className="mb-4">
              <label className="field-label">Select Member</label>
              <select
                className="field-input"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="field-label">Reception Note (Optional)</label>
              <input
                className="field-input"
                placeholder="e.g. Phone battery died, Front desk verified"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
              />
            </div>

            <button type="submit" disabled={checkingInManual} className="btn-primary w-full">
              {checkingInManual ? 'Checking In…' : 'Confirm Check-In'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
