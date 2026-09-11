import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function SuperAdminBilling() {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [gymFilter, setGymFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    adminId: '',
    title: 'Monthly Platform Subscription',
    feeType: 'subscription',
    billingCycle: '',
    amount: '',
    dueDate: '',
    paymentInstructions: '',
    notes: '',
    status: 'unpaid',
    paymentMethod: 'bank_transfer',
    transactionReference: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Bulk Invoicing Modal
  const [showBulk, setShowBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    billingCycle: '',
    dueDate: '',
    title: 'Monthly Platform Subscription',
    defaultAmount: '',
  });
  const [bulking, setBulking] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Mark Paid Modal
  const [payingFee, setPayingFee] = useState(null);
  const [payForm, setPayForm] = useState({
    paymentMethod: 'bank_transfer',
    transactionReference: '',
    paidOn: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [savingPay, setSavingPay] = useState(false);
  const [payError, setPayError] = useState('');

  // Edit Fee Modal
  const [editingFee, setEditingFee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // View Invoice Modal
  const [viewingFee, setViewingFee] = useState(null);

  const { showToast } = useToast();

  async function loadData() {
    try {
      const [feesRes, statsRes, adminsRes, settingsRes] = await Promise.all([
        api.get('/superadmin/gym-fees', {
          params: {
            adminId: gymFilter || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: search || undefined,
          },
        }),
        api.get('/superadmin/gym-fees/stats'),
        api.get('/superadmin/admins'),
        api.get('/superadmin/settings'),
      ]);

      setFees(feesRes.data);
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      setError('Could not load platform billing data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, gymFilter, search]);

  function openCreateModal(preselectedGymId = '') {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    const dueDateStr = nextMonth.toISOString().split('T')[0];
    const monthCycle = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const targetGym = admins.find((a) => a._id === preselectedGymId);
    const amountVal = targetGym?.customMonthlyFee != null
      ? targetGym.customMonthlyFee
      : settings?.defaultMonthlyFee || 5000;

    setCreateForm({
      adminId: preselectedGymId || (admins[0]?._id || ''),
      title: `Monthly Platform Subscription — ${monthCycle}`,
      feeType: 'subscription',
      billingCycle: monthCycle,
      amount: amountVal,
      dueDate: dueDateStr,
      paymentInstructions: '',
      notes: '',
      status: 'unpaid',
      paymentMethod: 'bank_transfer',
      transactionReference: '',
    });
    setCreateError('');
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/superadmin/gym-fees', {
        ...createForm,
        amount: Number(createForm.amount),
      });
      setShowCreate(false);
      showToast('Gym platform fee created successfully.', { type: 'success' });
      await loadData();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create fee.');
    } finally {
      setCreating(false);
    }
  }

  function openBulkModal() {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    const monthCycle = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    setBulkForm({
      billingCycle: monthCycle,
      dueDate: nextMonth.toISOString().split('T')[0],
      title: `Monthly Platform Subscription — ${monthCycle}`,
      defaultAmount: settings?.defaultMonthlyFee || 5000,
    });
    setBulkError('');
    setShowBulk(true);
  }

  async function handleBulkGenerate(e) {
    e.preventDefault();
    setBulking(true);
    setBulkError('');
    try {
      const { data } = await api.post('/superadmin/gym-fees/bulk', {
        ...bulkForm,
        defaultAmount: Number(bulkForm.defaultAmount) || undefined,
      });
      setShowBulk(false);
      showToast(data.message, { type: 'success' });
      await loadData();
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk generation failed.');
    } finally {
      setBulking(false);
    }
  }

  function openPayModal(fee) {
    setPayingFee(fee);
    setPayForm({
      paymentMethod: fee.paymentMethod || 'bank_transfer',
      transactionReference: fee.paymentProof?.reference || fee.transactionReference || '',
      paidOn: new Date().toISOString().split('T')[0],
      notes: fee.paymentProof?.note ? `Verified from proof: ${fee.paymentProof.note}` : '',
    });
    setPayError('');
  }

  async function handleMarkPaid(e) {
    e.preventDefault();
    setSavingPay(true);
    setPayError('');
    try {
      await api.put(`/superadmin/gym-fees/${payingFee._id}/mark-paid`, payForm);
      setPayingFee(null);
      showToast(`Invoice ${payingFee.invoiceNumber} marked as Paid.`, { type: 'success' });
      await loadData();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Could not mark fee as paid.');
    } finally {
      setSavingPay(false);
    }
  }

  async function handleWaive(fee) {
    if (!window.confirm(`Waive invoice ${fee.invoiceNumber} for ${fee.admin?.gymName}?`)) return;
    try {
      await api.put(`/superadmin/gym-fees/${fee._id}/waive`);
      showToast(`Invoice ${fee.invoiceNumber} waived.`, { type: 'success' });
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not waive invoice.', { type: 'error' });
    }
  }

  async function handleDelete(fee) {
    if (!window.confirm(`Delete invoice ${fee.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/superadmin/gym-fees/${fee._id}`);
      showToast(`Invoice ${fee.invoiceNumber} removed.`, { type: 'success' });
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete invoice.', { type: 'error' });
    }
  }

  async function handleRemind(fee) {
    try {
      const { data } = await api.post(`/superadmin/gym-fees/${fee._id}/remind`);
      showToast(data.message, { type: 'success' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not send reminder.', { type: 'error' });
    }
  }

  function openEditModal(fee) {
    setEditingFee(fee);
    setEditForm({
      title: fee.title,
      feeType: fee.feeType,
      billingCycle: fee.billingCycle,
      amount: fee.amount,
      dueDate: new Date(fee.dueDate).toISOString().split('T')[0],
      paymentInstructions: fee.paymentInstructions || '',
      notes: fee.notes || '',
    });
    setEditError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/superadmin/gym-fees/${editingFee._id}`, {
        ...editForm,
        amount: Number(editForm.amount),
      });
      setEditingFee(null);
      showToast(`Invoice ${editingFee.invoiceNumber} updated.`, { type: 'success' });
      await loadData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not update invoice.');
    } finally {
      setSavingEdit(false);
    }
  }

  function printInvoiceSlip(fee) {
    const win = window.open('', '_blank');
    const currency = settings?.currency || 'PKR';
    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${fee.invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 750px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 800; color: #111; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .paid { background: #dcfce7; color: #15803d; }
            .unpaid { background: #fef9c3; color: #854d0e; }
            .overdue { background: #fee2e2; color: #b91c1c; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
            .box h4 { margin: 0 0 8px 0; font-size: 13px; color: #64748b; text-transform: uppercase; }
            .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            .table th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 13px; border-bottom: 1px solid #cbd5e1; }
            .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total { text-align: right; font-size: 18px; font-weight: 800; margin-top: 16px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">IRONLINE PLATFORM</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">SaaS Platform Subscription Invoice</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 20px;">${fee.invoiceNumber}</h2>
              <div style="margin-top: 6px;"><span class="badge ${fee.status}">${fee.status}</span></div>
            </div>
          </div>

          <div class="details-grid">
            <div class="box">
              <h4>Billed To (Gym Tenant)</h4>
              <strong>${fee.admin?.gymName}</strong><br/>
              ${fee.admin?.address ? `${fee.admin.address}<br/>` : ''}
              ${fee.admin?.contact ? `Contact: ${fee.admin.contact}<br/>` : ''}
              Tenant Slug: <code>${fee.admin?.slug}</code>
            </div>
            <div class="box">
              <h4>Invoice Meta</h4>
              Billing Period: <strong>${fee.billingCycle || 'N/A'}</strong><br/>
              Issue Date: <strong>${new Date(fee.created_at).toLocaleDateString()}</strong><br/>
              Due Date: <strong>${new Date(fee.dueDate).toLocaleDateString()}</strong><br/>
              ${fee.paidOn ? `Paid On: <strong>${new Date(fee.paidOn).toLocaleDateString()}</strong><br/>Method: <strong>${fee.paymentMethod}</strong>` : ''}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Period</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${fee.title}</strong></td>
                <td style="text-transform: capitalize;">${fee.feeType}</td>
                <td>${fee.billingCycle || '—'}</td>
                <td style="text-align: right; font-weight: 700;">${currency} ${fee.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Dues: ${currency} ${fee.amount.toLocaleString()}
          </div>

          ${fee.paymentInstructions ? `
            <div style="margin-top: 24px; padding: 14px; background: #fafafa; border-radius: 8px; font-size: 13px;">
              <strong>Payment Instructions:</strong><br/>
              <pre style="font-family: inherit; margin: 6px 0 0 0; white-space: pre-wrap;">${fee.paymentInstructions}</pre>
            </div>
          ` : ''}

          <div class="footer">
            Thank you for partnering with Ironline Platform. For billing inquiries, contact platform administration.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  if (loading && !stats) return <div className="text-sm text-steel">Loading platform billing…</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Gym Platform Billing</h1>
          <p className="mt-1 text-sm text-steel">
            Manage SaaS subscription dues, invoice gym owners manually, verify payment proofs, and issue receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={openBulkModal} className="btn-secondary">
            <svg className="icon !h-4 !w-4"><use href="#i-sliders" /></svg>
            Bulk Monthly Billing
          </button>
          <button type="button" onClick={() => openCreateModal()} className="btn-primary">
            <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
            Add Gym Fee
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-ember-dark">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon="card"
          label="Platform Revenue Collected"
          value={`Rs. ${(stats?.totalPaidRevenue || 0).toLocaleString()}`}
          sub={`${stats?.paidCount || 0} invoices cleared`}
          accent="text-chalk-dark"
        />
        <StatCard
          icon="calendar"
          label="Outstanding Dues"
          value={`Rs. ${(stats?.totalUnpaidAmount || 0).toLocaleString()}`}
          sub={`${stats?.unpaidCount || 0} pending invoices`}
          accent="text-iron"
        />
        <StatCard
          icon="flame"
          label="Overdue Invoices"
          value={stats?.overdueCount || 0}
          sub="Past due date"
          accent="text-ember-dark"
        />
        <StatCard
          icon="bell"
          label="Awaiting Verification"
          value={stats?.awaitingProofCount || 0}
          sub="Proofs submitted by gym owners"
          accent="text-amber-500"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['all', 'unpaid', 'overdue', 'paid', 'waived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-ink text-paper'
                  : 'bg-ink/5 text-steel hover:bg-ink/10 hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={gymFilter}
            onChange={(e) => setGymFilter(e.target.value)}
            className="field-input !py-1.5 !text-xs max-w-[200px]"
          >
            <option value="">All Gyms</option>
            {admins.map((g) => (
              <option key={g._id} value={g._id}>{g.gymName}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search invoice # or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input !py-1.5 !text-xs max-w-[220px]"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-ink/[0.02] text-xs font-semibold text-steel uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Gym</th>
                <th className="px-5 py-3.5">Fee Details</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-steel">
                    No platform invoices found matching the current filters.
                  </td>
                </tr>
              ) : (
                fees.map((f) => {
                  const hasProof = Boolean(f.paymentProof?.reference);
                  const isPaid = f.status === 'paid';
                  const isOverdue = f.status === 'overdue';

                  return (
                    <tr key={f._id} className="hover:bg-ink/[0.015] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-ink">
                        {f.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 font-medium text-ink">
                        <div>{f.admin?.gymName || 'Unknown Gym'}</div>
                        <div className="text-[11px] text-steel font-mono">/g/{f.admin?.slug}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-ink">{f.title}</div>
                        <div className="text-xs text-steel capitalize">
                          {f.feeType} {f.billingCycle ? `· ${f.billingCycle}` : ''}
                        </div>
                        {hasProof && !isPaid && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 border border-amber-500/20">
                            Proof: Ref #{f.paymentProof.reference} ({f.paymentProof.bankName || 'Bank'})
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-ink whitespace-nowrap">
                        Rs. {f.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap text-steel">
                        {new Date(f.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            isPaid
                              ? 'bg-chalk/15 text-chalk-dark border border-chalk/30'
                              : isOverdue
                              ? 'bg-ember/15 text-ember-dark border border-ember/30'
                              : f.status === 'waived'
                              ? 'bg-steel/15 text-steel'
                              : 'bg-iron/10 text-iron border border-iron/20'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 text-xs font-semibold">
                          {!isPaid && f.status !== 'waived' && (
                            <button
                              onClick={() => openPayModal(f)}
                              className="rounded bg-chalk-dark px-2.5 py-1 text-paper hover:brightness-110 transition-all"
                            >
                              {hasProof ? 'Verify & Pay' : 'Mark Paid'}
                            </button>
                          )}
                          <button
                            onClick={() => printInvoiceSlip(f)}
                            className="text-steel hover:text-ink transition-colors p-1"
                            title="Print Invoice"
                          >
                            <svg className="icon !h-4 !w-4"><use href="#i-note" /></svg>
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => handleRemind(f)}
                              className="text-steel hover:text-ink transition-colors p-1"
                              title="Send Reminder Alert"
                            >
                              <svg className="icon !h-4 !w-4"><use href="#i-bell" /></svg>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(f)}
                            className="text-steel hover:text-ink transition-colors p-1"
                            title="Edit Invoice"
                          >
                            <svg className="icon !h-4 !w-4"><use href="#i-pencil" /></svg>
                          </button>
                          {!isPaid && f.status !== 'waived' && (
                            <button
                              onClick={() => handleWaive(f)}
                              className="text-xs text-steel hover:text-ember-dark transition-colors"
                            >
                              Waive
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(f)}
                            className="text-xs text-steel hover:text-ember-dark transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Gym Fee */}
      {showCreate && (
        <Modal title="Add Gym Platform Fee" onClose={() => setShowCreate(false)} width="max-w-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="field-label">Gym Account</label>
              <select
                className="field-input"
                value={createForm.adminId}
                onChange={(e) => {
                  const gym = admins.find((a) => a._id === e.target.value);
                  const newAmt = gym?.customMonthlyFee != null ? gym.customMonthlyFee : settings?.defaultMonthlyFee || 5000;
                  setCreateForm({ ...createForm, adminId: e.target.value, amount: newAmt });
                }}
                required
              >
                <option value="">Select gym...</option>
                {admins.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.gymName} {g.customMonthlyFee ? `(Custom: Rs. ${g.customMonthlyFee})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Fee Type</label>
                <select
                  className="field-input"
                  value={createForm.feeType}
                  onChange={(e) => setCreateForm({ ...createForm, feeType: e.target.value })}
                >
                  <option value="subscription">Monthly Subscription</option>
                  <option value="setup">Initial Setup Fee</option>
                  <option value="maintenance">Platform Maintenance</option>
                  <option value="custom">Custom Module / Feature</option>
                  <option value="hardware">Hardware / Turnstile Support</option>
                </select>
              </div>
              <div>
                <label className="field-label">Billing Period</label>
                <input
                  className="field-input"
                  value={createForm.billingCycle}
                  onChange={(e) => setCreateForm({ ...createForm, billingCycle: e.target.value })}
                  placeholder="e.g. Sep 2026"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Invoice Title</label>
              <input
                className="field-input"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Amount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  className="field-input font-mono"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Due Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Initial Status</label>
              <div className="flex gap-4 pt-1 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={createForm.status === 'unpaid'}
                    onChange={() => setCreateForm({ ...createForm, status: 'unpaid' })}
                  />
                  Unpaid (Issue Invoice)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={createForm.status === 'paid'}
                    onChange={() => setCreateForm({ ...createForm, status: 'paid' })}
                  />
                  Paid Immediately (Cash / Received)
                </label>
              </div>
            </div>

            <div>
              <label className="field-label">Custom Payment Instructions (Optional)</label>
              <textarea
                className="field-input"
                rows={2}
                value={createForm.paymentInstructions}
                onChange={(e) => setCreateForm({ ...createForm, paymentInstructions: e.target.value })}
                placeholder="Leave blank to use default bank accounts from Platform Settings."
              />
            </div>

            {createError && <div className="text-sm text-ember-dark">{createError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Bulk Invoicing */}
      {showBulk && (
        <Modal title="Batch Invoice All Active Gyms" onClose={() => setShowBulk(false)} width="max-w-md">
          <form onSubmit={handleBulkGenerate} className="space-y-4">
            <p className="text-xs text-steel">
              Generates a monthly subscription invoice for every active, non-suspended gym. Gyms with custom fees will be billed their custom amount; all others use the default amount below.
            </p>

            <div>
              <label className="field-label">Billing Period / Cycle</label>
              <input
                className="field-input"
                value={bulkForm.billingCycle}
                onChange={(e) => setBulkForm({ ...bulkForm, billingCycle: e.target.value })}
                placeholder="e.g. Oct 2026"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Default Amount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  className="field-input font-mono"
                  value={bulkForm.defaultAmount}
                  onChange={(e) => setBulkForm({ ...bulkForm, defaultAmount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Due Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={bulkForm.dueDate}
                  onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Invoice Title Format</label>
              <input
                className="field-input"
                value={bulkForm.title}
                onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                required
              />
            </div>

            {bulkError && <div className="text-sm text-ember-dark">{bulkError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowBulk(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={bulking} className="btn-primary">
                {bulking ? 'Generating...' : 'Generate All Invoices'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Mark Paid */}
      {payingFee && (
        <Modal title={`Record Payment — ${payingFee.invoiceNumber}`} onClose={() => setPayingFee(null)} width="max-w-md">
          <form onSubmit={handleMarkPaid} className="space-y-4">
            <div className="rounded-lg bg-ink/[0.03] p-3 text-sm border border-ink/10">
              <div className="font-semibold text-ink">{payingFee.admin?.gymName}</div>
              <div className="text-xs text-steel">{payingFee.title}</div>
              <div className="mt-1 font-mono font-bold text-ink">Amount: Rs. {payingFee.amount.toLocaleString()}</div>
              {payingFee.paymentProof?.reference && (
                <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-500/10 p-2 rounded">
                  Submitted Proof: Ref #{payingFee.paymentProof.reference} ({payingFee.paymentProof.bankName})
                  {payingFee.paymentProof.note && <div className="font-normal mt-0.5 text-steel">{payingFee.paymentProof.note}</div>}
                </div>
              )}
            </div>

            <div>
              <label className="field-label">Payment Method</label>
              <select
                className="field-input"
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                required
              >
                <option value="bank_transfer">Bank Transfer / IBAN</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="cash">Cash in Hand</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Card Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Transaction Reference #</label>
                <input
                  className="field-input font-mono"
                  value={payForm.transactionReference}
                  onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                  placeholder="e.g. UTR / Ref ID"
                />
              </div>
              <div>
                <label className="field-label">Paid On Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={payForm.paidOn}
                  onChange={(e) => setPayForm({ ...payForm, paidOn: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Verification Notes (Optional)</label>
              <textarea
                className="field-input"
                rows={2}
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="e.g. Verified on bank app statement."
              />
            </div>

            {payError && <div className="text-sm text-ember-dark">{payError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPayingFee(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={savingPay} className="btn-primary">
                {savingPay ? 'Saving...' : 'Confirm & Mark Paid'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Fee */}
      {editingFee && (
        <Modal title={`Edit Invoice — ${editingFee.invoiceNumber}`} onClose={() => setEditingFee(null)} width="max-w-md">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="field-label">Invoice Title</label>
              <input
                className="field-input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Amount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  className="field-input font-mono"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Due Date</label>
                <input
                  type="date"
                  className="field-input"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Billing Cycle</label>
              <input
                className="field-input"
                value={editForm.billingCycle}
                onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Internal Notes</label>
              <textarea
                className="field-input"
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            {editError && <div className="text-sm text-ember-dark">{editError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingFee(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={savingEdit} className="btn-primary">
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
