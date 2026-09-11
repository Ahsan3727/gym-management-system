import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function printReceiptSlip({ gymName, memberName, phone, receiptNumber, title, billingMonth, amount, admissionFee, discount, totalPaid, paymentMethod, paidOn, validUntil }) {
  const win = window.open('', '_blank', 'width=600,height=700');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${receiptNumber || 'Membership Fee'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 28px; color: #111; max-width: 460px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
          .gym-name { font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; }
          .receipt-title { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; letter-spacing: 1px; }
          .receipt-num { font-size: 13px; font-family: monospace; font-weight: 700; color: #0284c7; margin-top: 6px; }
          .details { margin-bottom: 16px; font-size: 13px; line-height: 1.6; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .label { color: #64748b; }
          .val { font-weight: 600; text-align: right; color: #0f172a; }
          .divider { border-top: 1px solid #e2e8f0; margin: 12px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 2px dashed #94a3b8; padding-top: 12px; margin-top: 12px; color: #0f172a; }
          .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="gym-name">${gymName || 'GYM MEMBERSHIP'}</h1>
          <div class="receipt-title">OFFICIAL PAYMENT RECEIPT</div>
          <div class="receipt-num">${receiptNumber || 'N/A'}</div>
        </div>
        <div class="details">
          <div class="row"><span class="label">Date:</span><span class="val">${new Date(paidOn || Date.now()).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          <div class="row"><span class="label">Member:</span><span class="val">${memberName}</span></div>
          ${phone ? `<div class="row"><span class="label">Phone:</span><span class="val">${phone}</span></div>` : ''}
          <div class="row"><span class="label">Description:</span><span class="val">${title || 'Monthly Fee'}</span></div>
          ${billingMonth ? `<div class="row"><span class="label">Billing Month:</span><span class="val">${billingMonth}</span></div>` : ''}
          <div class="divider"></div>
          <div class="row"><span class="label">Subscription Fee:</span><span class="val">Rs. ${Number(amount || 0).toLocaleString()}</span></div>
          ${Number(admissionFee || 0) > 0 ? `<div class="row"><span class="label">Admission / Reg. Fee:</span><span class="val">Rs. ${Number(admissionFee).toLocaleString()}</span></div>` : ''}
          ${Number(discount || 0) > 0 ? `<div class="row"><span class="label">Discount Applied:</span><span class="val" style="color: #dc2626;">- Rs. ${Number(discount).toLocaleString()}</span></div>` : ''}
          <div class="total-row"><span>Total Paid:</span><span>Rs. ${Number(totalPaid || amount || 0).toLocaleString()}</span></div>
          <div class="divider"></div>
          <div class="row"><span class="label">Payment Method:</span><span class="val" style="text-transform: uppercase;">${paymentMethod || 'Cash'}</span></div>
          ${validUntil ? `<div class="row"><span class="label">Membership Valid Until:</span><span class="val" style="color: #059669;">${new Date(validUntil).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>` : ''}
        </div>
        <div class="footer">
          <p>Thank you for training with us!</p>
          <p style="font-size: 10px; margin-top: 4px;">Computer generated slip • Keep for your records</p>
        </div>
        <script>
          window.print();
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

function getWhatsAppReceiptLink({ phone, gymName, memberName, receiptNumber, title, billingMonth, totalPaid, paymentMethod, validUntil }) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
  const text = `🏋️ *${gymName || 'Gym'} - Fee Payment Receipt*
----------------------------------
Hello *${memberName}*, thank you for your payment!

📄 *Receipt No:* ${receiptNumber || 'N/A'}
📌 *Description:* ${title || 'Monthly Subscription'}
🗓️ *Month:* ${billingMonth || 'Current'}
💰 *Amount Paid:* Rs. ${Number(totalPaid || 0).toLocaleString()}
💳 *Method:* ${(paymentMethod || 'Cash').toUpperCase()}
${validUntil ? `📅 *Membership Valid Until:* ${new Date(validUntil).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
----------------------------------
Thank you for training with us! 💪`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

function getWhatsAppReminderLink({ phone, gymName, memberName, title, billingMonth, amount, dueDate }) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
  const text = `⚠️ *${gymName || 'Gym'} - Membership Fee Reminder*
----------------------------------
Dear *${memberName}*,
This is a gentle reminder regarding your pending monthly gym fee.

📌 *Fee:* ${title || 'Monthly Subscription'} (${billingMonth || 'Current'})
💰 *Amount Due:* Rs. ${Number(amount || 0).toLocaleString()}
📅 *Due Date:* ${new Date(dueDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}

Kindly clear your dues at the gym counter to avoid membership disruption.
Thank you! 💪`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export default function Fees() {
  const { showToast } = useToast();
  const [fees, setFees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [gymProfile, setGymProfile] = useState(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [billingMonthFilter, setBillingMonthFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Manual Add Fee Modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: '',
    title: '',
    feeType: 'subscription',
    billingMonth: '',
    amount: '',
    admissionFee: 0,
    discount: 0,
    dueDate: '',
    status: 'paid',
    paymentMethod: 'cash',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Bulk Invoicing Modal
  const [showBulk, setShowBulk] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    billingMonth: '',
    dueDate: '',
    title: '',
    defaultAmount: '',
    feeType: 'subscription',
  });
  const [bulking, setBulking] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Mark Paid Modal
  const [payingFee, setPayingFee] = useState(null);
  const [payForm, setPayForm] = useState({
    paymentMethod: 'cash',
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

  async function load() {
    try {
      const params = {};
      if (status) params.status = status;
      if (search) params.search = search;
      if (billingMonthFilter) params.billingMonth = billingMonthFilter;

      const [feesRes, customersRes, statsRes, profileRes] = await Promise.all([
        api.get('/admin/fees', { params }),
        api.get('/admin/customers'),
        api.get('/admin/fees/stats').catch(() => ({ data: null })),
        api.get('/admin/profile').catch(() => ({ data: null })),
      ]);

      setFees(feesRes.data);
      setCustomers(customersRes.data);
      if (statsRes.data) setStats(statsRes.data);
      if (profileRes.data) setGymProfile(profileRes.data);
    } catch (err) {
      setError('Could not load fees data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, billingMonthFilter]);

  // ── Open Create Fee Modal ──────────────────────────────────────────────────
  function openCreateModal(preselectedCustomerId = '') {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const targetCustomer = customers.find((c) => c._id === preselectedCustomerId) || customers[0];
    const feeAmount = targetCustomer?.monthlyFee ?? gymProfile?.defaultMemberMonthlyFee ?? 3000;

    const dueDay = gymProfile?.defaultFeeDueDay || 10;
    const nextDue = new Date();
    nextDue.setDate(dueDay);
    if (nextDue < new Date()) nextDue.setMonth(nextDue.getMonth() + 1);

    setCreateForm({
      customerId: targetCustomer?._id || '',
      title: `Monthly Subscription — ${currentMonth}`,
      feeType: 'subscription',
      billingMonth: currentMonth,
      amount: feeAmount,
      admissionFee: 0,
      discount: 0,
      dueDate: nextDue.toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'cash',
      notes: '',
    });
    setCreateError('');
    setShowCreate(true);
  }

  // Handle customer selection in Create Fee Form
  function handleCustomerSelect(customerId) {
    const cust = customers.find((c) => c._id === customerId);
    setCreateForm((prev) => ({
      ...prev,
      customerId,
      amount: cust?.monthlyFee ?? prev.amount,
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/admin/fees', {
        ...createForm,
        amount: Number(createForm.amount),
        admissionFee: Number(createForm.admissionFee) || 0,
        discount: Number(createForm.discount) || 0,
      });
      setShowCreate(false);
      showToast('Fee recorded successfully!', 'success');
      await load();

      // Offer receipt slip popup
      if (createForm.status === 'paid') {
        const cust = customers.find((c) => c._id === createForm.customerId);
        if (cust) {
          printReceiptSlip({
            gymName: gymProfile?.gymName,
            memberName: cust.name,
            phone: cust.phone,
            receiptNumber: data.invoiceNumber || data.receiptNumber,
            title: data.title,
            billingMonth: data.billingMonth,
            amount: data.amount,
            admissionFee: data.admissionFee,
            discount: data.discount,
            totalPaid: data.amount,
            paymentMethod: data.paymentMethod,
            paidOn: data.paidOn,
            validUntil: cust.membershipExpiresAt,
          });
        }
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not record fee.');
    } finally {
      setCreating(false);
    }
  }

  // ── Open Bulk Invoicing Modal ──────────────────────────────────────────────
  function openBulkModal() {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const dueDay = gymProfile?.defaultFeeDueDay || 10;
    const nextDue = new Date();
    nextDue.setDate(dueDay);
    if (nextDue < new Date()) nextDue.setMonth(nextDue.getMonth() + 1);

    setBulkForm({
      billingMonth: currentMonth,
      dueDate: nextDue.toISOString().split('T')[0],
      title: `Monthly Subscription — ${currentMonth}`,
      defaultAmount: gymProfile?.defaultMemberMonthlyFee || 3000,
      feeType: 'subscription',
    });
    setBulkError('');
    setShowBulk(true);
  }

  async function handleBulkGenerate(e) {
    e.preventDefault();
    setBulking(true);
    setBulkError('');
    try {
      const { data } = await api.post('/admin/fees/bulk', {
        ...bulkForm,
        defaultAmount: Number(bulkForm.defaultAmount) || undefined,
      });
      setShowBulk(false);
      showToast(data.message || 'Bulk invoices created!', 'success');
      await load();
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Bulk generation failed.');
    } finally {
      setBulking(false);
    }
  }

  // ── Mark Paid ──────────────────────────────────────────────────────────────
  function openPayModal(fee) {
    setPayingFee(fee);
    setPayForm({
      paymentMethod: fee.paymentMethod || 'cash',
      paidOn: new Date().toISOString().split('T')[0],
      notes: fee.notes || '',
    });
    setPayError('');
  }

  async function handleMarkPaid(e) {
    e.preventDefault();
    setSavingPay(true);
    setPayError('');
    try {
      const { data } = await api.put(`/admin/fees/${payingFee._id}`, {
        status: 'paid',
        paymentMethod: payForm.paymentMethod,
        paidOn: payForm.paidOn,
        notes: payForm.notes,
      });
      setPayingFee(null);
      showToast(`Fee marked as Paid (Receipt: ${data.invoiceNumber || data.receiptNumber})`, 'success');
      await load();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Could not mark fee as paid.');
    } finally {
      setSavingPay(false);
    }
  }

  // ── Edit Fee ────────────────────────────────────────────────────────────────
  function openEditModal(fee) {
    setEditingFee(fee);
    setEditForm({
      title: fee.title || 'Monthly Subscription',
      billingMonth: fee.billingMonth || '',
      feeType: fee.feeType || 'subscription',
      amount: fee.amount,
      admissionFee: fee.admissionFee || 0,
      discount: fee.discount || 0,
      dueDate: new Date(fee.dueDate).toISOString().split('T')[0],
      notes: fee.notes || '',
    });
    setEditError('');
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/admin/fees/${editingFee._id}`, {
        ...editForm,
        amount: Number(editForm.amount),
        admissionFee: Number(editForm.admissionFee) || 0,
        discount: Number(editForm.discount) || 0,
      });
      setEditingFee(null);
      showToast('Fee details updated.', 'success');
      await load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not update fee.');
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Delete Fee ──────────────────────────────────────────────────────────────
  async function handleDelete(fee) {
    if (!window.confirm(`Delete fee record for ${fee.customer?.name || 'this member'}?`)) return;
    try {
      await api.delete(`/admin/fees/${fee._id}`);
      showToast('Fee record removed.', 'info');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete fee.', 'error');
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────
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
      a.download = `member-fees-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast(`Failed to export fees as ${format.toUpperCase()}.`, 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Member Fees & Billing</h1>
          <p className="text-sm text-steel">
            Control member monthly subscription fees, batch invoice all members, issue receipt slips, and send WhatsApp receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn-secondary text-xs"
            title="Export CSV"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn-secondary text-xs"
            title="Export PDF"
          >
            Export PDF
          </button>
          <button onClick={openBulkModal} className="btn-secondary text-xs">
            <svg className="icon !h-4 !w-4"><use href="#i-refresh" /></svg>
            Bulk Monthly Invoicing
          </button>
          <button onClick={() => openCreateModal()} className="btn-primary text-xs">
            <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
            Add Member Fee
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={`Rs. ${(stats?.totalCollected || 0).toLocaleString()}`}
          sub={`${stats?.paidCount || 0} paid records`}
          icon="card"
          iconColor="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          title="Pending Dues"
          value={`Rs. ${(stats?.pendingDues || 0).toLocaleString()}`}
          sub={`${stats?.unpaidCount || 0} unpaid members`}
          icon="clock"
          iconColor="text-amber-600 bg-amber-500/10"
        />
        <StatCard
          title="Overdue Dues"
          value={`Rs. ${(stats?.overdueDues || 0).toLocaleString()}`}
          sub={`${stats?.overdueCount || 0} overdue invoices`}
          icon="alert-circle"
          iconColor="text-rose-600 bg-rose-500/10"
        />
        <StatCard
          title="Total Active Members"
          value={customers.filter((c) => c.isActive).length}
          sub={`Rate: Rs. ${Number(gymProfile?.defaultMemberMonthlyFee || 3000).toLocaleString()}/mo`}
          icon="user"
          iconColor="text-sky-600 bg-sky-500/10"
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          className="field-input max-w-xs"
          placeholder="Search member or receipt #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-input max-w-[11rem]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="paid">🟢 Paid</option>
          <option value="unpaid">🟡 Unpaid</option>
          <option value="overdue">🔴 Overdue</option>
        </select>
        <input
          className="field-input max-w-[11rem]"
          placeholder="Filter month (e.g. Sep 2026)"
          value={billingMonthFilter}
          onChange={(e) => setBillingMonthFilter(e.target.value)}
        />
        {(status || search || billingMonthFilter) && (
          <button
            onClick={() => { setStatus(''); setSearch(''); setBillingMonthFilter(''); }}
            className="text-xs text-steel hover:text-ink underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      {/* Fees List / Table */}
      <div className="panel overflow-hidden border border-ink/10 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-ink/[0.02] text-xs font-semibold uppercase tracking-wider text-steel">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-4 py-3.5">Fee & Month</th>
                <th className="px-4 py-3.5">Receipt #</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {fees.map((f) => {
                const member = f.customer;
                const isPaid = f.status === 'paid';
                const isOverdue = f.status === 'overdue';

                return (
                  <tr key={f._id} className="hover:bg-ink/[0.01] transition-colors">
                    {/* Member */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{member?.name || '—'}</div>
                      <div className="text-xs text-steel font-mono">
                        {member?.phone ? `📞 ${member.phone}` : 'No phone'}
                      </div>
                    </td>

                    {/* Fee & Month */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-ink">{f.title || 'Monthly Subscription'}</div>
                      <div className="text-xs text-steel">
                        Month: <strong className="text-ink">{f.billingMonth || '—'}</strong>
                      </div>
                    </td>

                    {/* Receipt # */}
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs font-bold text-sky-700">
                        {f.invoiceNumber || f.receiptNumber || '—'}
                      </div>
                      {isPaid && f.paymentMethod && (
                        <div className="text-[11px] text-steel uppercase font-medium">
                          via {f.paymentMethod}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4">
                      <div className="font-bold text-ink">Rs. {Number(f.amount || 0).toLocaleString()}</div>
                      {(f.admissionFee > 0 || f.discount > 0) && (
                        <div className="text-[11px] text-steel">
                          {f.admissionFee > 0 && `+Rs. ${f.admissionFee} adm `}
                          {f.discount > 0 && `-Rs. ${f.discount} disc`}
                        </div>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-4 text-xs">
                      <div>{new Date(f.dueDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      {isPaid && f.paidOn && (
                        <div className="text-emerald-600 font-medium">
                          Paid {new Date(f.paidOn).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {isPaid ? (
                        <span className="chip border-emerald-500/20 bg-emerald-500/10 text-emerald-600 font-semibold">
                          Paid
                        </span>
                      ) : isOverdue ? (
                        <span className="chip border-rose-500/25 bg-rose-500/15 text-rose-700 font-semibold">
                          Overdue
                        </span>
                      ) : (
                        <span className="chip border-amber-500/20 bg-amber-500/10 text-amber-700 font-semibold">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Mark Paid button */}
                        {!isPaid && (
                          <button
                            onClick={() => openPayModal(f)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}

                        {/* Print Receipt button */}
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() =>
                              printReceiptSlip({
                                gymName: gymProfile?.gymName,
                                memberName: member?.name,
                                phone: member?.phone,
                                receiptNumber: f.invoiceNumber || f.receiptNumber,
                                title: f.title,
                                billingMonth: f.billingMonth,
                                amount: f.amount,
                                admissionFee: f.admissionFee,
                                discount: f.discount,
                                totalPaid: f.amount,
                                paymentMethod: f.paymentMethod,
                                paidOn: f.paidOn,
                                validUntil: member?.membershipExpiresAt,
                              })
                            }
                            className="rounded-lg border border-ink/15 bg-panel px-2 py-1 text-xs font-medium text-ink hover:bg-ink/5 transition-colors"
                            title="Print thermal receipt slip"
                          >
                            🖨️ Slip
                          </button>
                        )}

                        {/* WhatsApp Link */}
                        {member?.phone && (
                          <a
                            href={
                              isPaid
                                ? getWhatsAppReceiptLink({
                                    phone: member.phone,
                                    gymName: gymProfile?.gymName,
                                    memberName: member.name,
                                    receiptNumber: f.invoiceNumber || f.receiptNumber,
                                    title: f.title,
                                    billingMonth: f.billingMonth,
                                    totalPaid: f.amount,
                                    paymentMethod: f.paymentMethod,
                                    validUntil: member?.membershipExpiresAt,
                                  })
                                : getWhatsAppReminderLink({
                                    phone: member.phone,
                                    gymName: gymProfile?.gymName,
                                    memberName: member.name,
                                    title: f.title,
                                    billingMonth: f.billingMonth,
                                    amount: f.amount,
                                    dueDate: f.dueDate,
                                  })
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                              isPaid
                                ? 'text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20'
                                : 'text-amber-700 bg-amber-500/10 hover:bg-amber-500/20'
                            }`}
                            title={isPaid ? 'Send Receipt on WhatsApp' : 'Send Due Reminder on WhatsApp'}
                          >
                            💬 {isPaid ? 'Receipt' : 'Remind'}
                          </a>
                        )}

                        {/* Edit & Delete */}
                        <button
                          onClick={() => openEditModal(f)}
                          className="text-xs text-steel hover:text-ink"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(f)}
                          className="text-xs text-steel hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {fees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-steel">
                    No fee records found. Use "Bulk Monthly Invoicing" or "Add Member Fee" above to create fees.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Member Fee Modal ────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Add Member Fee" onClose={() => setShowCreate(false)} width="max-w-lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="field-label">Select Member *</label>
              <select
                className="field-input"
                value={createForm.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                required
              >
                <option value="">-- Choose Member --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} — Rs. {Number(c.monthlyFee || 3000).toLocaleString()}/mo
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">Fee Type</label>
                <select
                  className="field-input"
                  value={createForm.feeType}
                  onChange={(e) => setCreateForm({ ...createForm, feeType: e.target.value })}
                >
                  <option value="subscription">Monthly Subscription</option>
                  <option value="admission">Admission / Reg. Fee</option>
                  <option value="personal_training">Personal Training</option>
                  <option value="locker">Locker Fee</option>
                  <option value="custom">Custom Fee</option>
                </select>
              </div>
              <div>
                <label className="field-label">Billing Month *</label>
                <input
                  className="field-input"
                  placeholder="e.g. Sep 2026"
                  value={createForm.billingMonth}
                  onChange={(e) => setCreateForm({ ...createForm, billingMonth: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Fee Description / Title *</label>
              <input
                className="field-input"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">Monthly Rate (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Admission Fee (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={createForm.admissionFee}
                  onChange={(e) => setCreateForm({ ...createForm, admissionFee: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Discount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={createForm.discount}
                  onChange={(e) => setCreateForm({ ...createForm, discount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">Due Date *</label>
                <input
                  type="date"
                  className="field-input"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Status *</label>
                <select
                  className="field-input"
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                >
                  <option value="paid">Paid (Collected)</option>
                  <option value="unpaid">Unpaid (Due)</option>
                </select>
              </div>
            </div>

            {createForm.status === 'paid' && (
              <div>
                <label className="field-label">Payment Method</label>
                <select
                  className="field-input"
                  value={createForm.paymentMethod}
                  onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className="field-label">Notes (Optional)</label>
              <input
                className="field-input"
                placeholder="Internal notes or remarks"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>

            {createError && <div className="rounded-xl bg-ember/10 p-3 text-sm text-ember-dark">{createError}</div>}

            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Recording Fee…' : 'Record Fee & Generate Receipt'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Bulk Monthly Invoicing Modal ────────────────────────────────────── */}
      {showBulk && (
        <Modal title="Bulk Monthly Invoicing" onClose={() => setShowBulk(false)} width="max-w-md">
          <form onSubmit={handleBulkGenerate} className="space-y-4">
            <p className="text-xs text-steel">
              Generate monthly subscription dues for all active members in 1 click. Uses each member's individual monthly subscription rate.
            </p>

            <div>
              <label className="field-label">Billing Month *</label>
              <input
                className="field-input"
                value={bulkForm.billingMonth}
                onChange={(e) => setBulkForm({ ...bulkForm, billingMonth: e.target.value })}
                placeholder="e.g. Sep 2026"
                required
              />
            </div>

            <div>
              <label className="field-label">Invoice Title</label>
              <input
                className="field-input"
                value={bulkForm.title}
                onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">Due Date *</label>
                <input
                  type="date"
                  className="field-input"
                  value={bulkForm.dueDate}
                  onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Fallback Fee (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={bulkForm.defaultAmount}
                  onChange={(e) => setBulkForm({ ...bulkForm, defaultAmount: e.target.value })}
                  placeholder="3000"
                />
              </div>
            </div>

            {bulkError && <div className="rounded-xl bg-ember/10 p-3 text-sm text-ember-dark">{bulkError}</div>}

            <button type="submit" disabled={bulking} className="btn-primary w-full">
              {bulking ? 'Generating Invoices…' : 'Generate Monthly Invoices'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Mark Paid Modal ─────────────────────────────────────────────────── */}
      {payingFee && (
        <Modal title={`Record Payment — ${payingFee.customer?.name || 'Member'}`} onClose={() => setPayingFee(null)}>
          <form onSubmit={handleMarkPaid} className="space-y-4">
            <div className="rounded-xl bg-ink/5 p-3 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold text-ink">{payingFee.title}</div>
                <div className="text-steel">Month: {payingFee.billingMonth || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-steel">Amount Due</div>
                <div className="text-base font-bold text-iron">Rs. {Number(payingFee.amount || 0).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <label className="field-label">Payment Method *</label>
              <select
                className="field-input"
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Debit / Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="field-label">Payment Date</label>
              <input
                type="date"
                className="field-input"
                value={payForm.paidOn}
                onChange={(e) => setPayForm({ ...payForm, paidOn: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="field-label">Notes (Optional)</label>
              <input
                className="field-input"
                placeholder="e.g. Paid in cash at reception"
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              />
            </div>

            {payError && <div className="rounded-xl bg-ember/10 p-3 text-sm text-ember-dark">{payError}</div>}

            <button type="submit" disabled={savingPay} className="btn-primary w-full">
              {savingPay ? 'Saving…' : 'Confirm Payment & Issue Receipt'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Edit Fee Modal ──────────────────────────────────────────────────── */}
      {editingFee && (
        <Modal title="Edit Fee Record" onClose={() => setEditingFee(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="field-label">Fee Title</label>
              <input
                className="field-input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">Billing Month</label>
                <input
                  className="field-input"
                  value={editForm.billingMonth}
                  onChange={(e) => setEditForm({ ...editForm, billingMonth: e.target.value })}
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

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field-label">Amount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label">Admission (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={editForm.admissionFee}
                  onChange={(e) => setEditForm({ ...editForm, admissionFee: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Discount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={editForm.discount}
                  onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="field-label">Notes</label>
              <input
                className="field-input"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            {editError && <div className="rounded-xl bg-ember/10 p-3 text-sm text-ember-dark">{editError}</div>}

            <button type="submit" disabled={savingEdit} className="btn-primary w-full">
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
