import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [customers, setCustomers] = useState([]);
  // BUG #7 FIX: Maintain a separate all-fees totals object that is never
  // affected by the status filter, so the summary cards always show real totals.
  const [allTotals, setAllTotals] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: '', amount: '', dueDate: '', isRecurring: false });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function load() {
    const params = {};
    if (status) params.status = status;
    // BUG #7 FIX: Also fetch all fees (no status filter) to compute correct totals
    const [feesRes, customersRes, allFeesRes] = await Promise.all([
      api.get('/admin/fees', { params }),
      api.get('/admin/customers'),
      api.get('/admin/fees'), // unfiltered — for totals cards
    ]);
    setFees(feesRes.data);
    setCustomers(customersRes.data);

    // Compute totals from the unfiltered list
    const totals = allFeesRes.data.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + f.amount;
      return acc;
    }, {});
    setAllTotals(totals);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load fees.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleExport(format) {
    setExporting(true);
    try {
      const params = { format };
      if (status) params.status = status;
      const res = await api.get('/admin/fees/export', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fees-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Failed to export fees as ${format.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/fees', { ...form, amount: Number(form.amount) });
      setShowCreate(false);
      setForm({ customerId: '', amount: '', dueDate: '', isRecurring: false });
      await load();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not add fee.');
    } finally {
      setCreating(false);
    }
  }

  async function setFeeStatus(fee, newStatus) {
    try {
      await api.put(`/admin/fees/${fee._id}`, { status: newStatus });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update fee status.');
    }
  }

  const statusColor = { paid: 'text-chalk-dark', unpaid: 'text-steel', overdue: 'text-ember-dark' };

  // BUG #14 FIX: Format amounts with 2 decimal places and thousands separator
  function fmtAmount(amount) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Fees</h1>
          <p className="text-sm text-steel">Track dues, mark payments and keep an eye on overdue accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn-secondary text-xs"
            title="Download fee records as CSV"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn-secondary text-xs"
            title="Download formatted PDF report"
          >
            Export PDF
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Add fee
          </button>
        </div>
      </div>

      {/* BUG #7 FIX: Summary cards use allTotals (unfiltered), not the filtered list */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Paid</div>
          <div className="stat-number mt-1 text-chalk-dark">${fmtAmount(allTotals.paid || 0)}</div>
        </div>
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Unpaid</div>
          <div className="stat-number mt-1">${fmtAmount(allTotals.unpaid || 0)}</div>
        </div>
        <div className="panel px-5 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-steel">Overdue</div>
          <div className="stat-number mt-1 text-ember-dark">${fmtAmount(allTotals.overdue || 0)}</div>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <select className="field-input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-ink/[0.02] text-left text-xs font-medium uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee._id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{fee.customer?.name || '—'}</td>
                {/* BUG #14 FIX: Format amount properly */}
                <td className="px-4 py-3 text-ink/70">${fmtAmount(fee.amount)}</td>
                <td className="px-4 py-3 text-ink/70">{new Date(fee.dueDate).toLocaleDateString()}</td>
                <td className={`px-4 py-3 font-medium capitalize ${statusColor[fee.status]}`}>{fee.status}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  {fee.status !== 'paid' && (
                    <button onClick={() => setFeeStatus(fee, 'paid')} className="text-xs font-medium text-chalk-dark hover:underline">
                      Mark paid
                    </button>
                  )}
                  {fee.status !== 'overdue' && fee.status !== 'paid' && (
                    <button onClick={() => setFeeStatus(fee, 'overdue')} className="text-xs font-medium text-ember-dark hover:underline">
                      Mark overdue
                    </button>
                  )}
                  {fee.status === 'paid' && (
                    <button onClick={() => setFeeStatus(fee, 'unpaid')} className="text-xs font-medium text-steel hover:underline">
                      Undo
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">No fee records match this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal title="Add fee" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="field-label">Customer</label>
              <select className="field-input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="field-label">Amount</label>
              <input type="number" step="0.01" min="0" className="field-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="field-label">Due date</label>
              <input type="date" className="field-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
                Recurring billing
              </label>
            </div>
            {createError && <div className="mb-3 text-sm text-ember-dark">{createError}</div>}
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Adding…' : 'Add fee'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
