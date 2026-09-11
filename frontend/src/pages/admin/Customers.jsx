import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import ListCard from '../../components/ListCard.jsx';
import ListRow from '../../components/ListRow.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function printReceiptSlip({ gymName, memberName, phone, receiptNumber, amount, admissionFee, totalPaid, paymentMethod, validUntil, date }) {
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
          <div class="receipt-num">${receiptNumber || 'REC-' + Date.now()}</div>
        </div>
        <div class="details">
          <div class="row"><span class="label">Date:</span><span class="val">${new Date(date || Date.now()).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          <div class="row"><span class="label">Member:</span><span class="val">${memberName}</span></div>
          ${phone ? `<div class="row"><span class="label">Phone:</span><span class="val">${phone}</span></div>` : ''}
          <div class="divider"></div>
          <div class="row"><span class="label">Monthly Subscription:</span><span class="val">Rs. ${Number(amount || 0).toLocaleString()}</span></div>
          ${Number(admissionFee || 0) > 0 ? `<div class="row"><span class="label">Admission / Reg. Fee:</span><span class="val">Rs. ${Number(admissionFee).toLocaleString()}</span></div>` : ''}
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

function getWhatsAppReceiptUrl({ phone, gymName, memberName, username, password, receiptNumber, totalPaid, paymentMethod, validUntil }) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
  const text = `🏋️ *${gymName || 'Gym'} - Payment Receipt*
----------------------------------
Hello *${memberName}*, thank you for your payment!

📄 *Receipt No:* ${receiptNumber || 'N/A'}
💰 *Amount Paid:* Rs. ${Number(totalPaid || 0).toLocaleString()}
💳 *Payment Method:* ${(paymentMethod || 'Cash').toUpperCase()}
📅 *Membership Valid Until:* ${validUntil ? new Date(validUntil).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 days'}
${username ? `\n🔑 *Your Member Account:*
Username: ${username}
${password ? `Password: ${password}` : ''}` : ''}
----------------------------------
See you on the floor! Stay consistent! 💪`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

const defaultFormData = {
  name: '',
  username: '',
  password: '',
  phone: '',
  monthlyFee: 3000,
  admissionFee: 0,
  collectNow: true,
  paymentMethod: 'cash',
};

export default function Customers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [gymProfile, setGymProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(defaultFormData);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // Edit
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Progress
  const [progressFor, setProgressFor] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressError, setProgressError] = useState('');

  // Password Reset
  const [resetFor, setResetFor] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  // Quick Fee / Payment collection modal
  const [quickFeeMember, setQuickFeeMember] = useState(null);
  const [quickFeeForm, setQuickFeeForm] = useState({
    title: '',
    billingMonth: '',
    amount: 3000,
    feeType: 'subscription',
    status: 'paid',
    paymentMethod: 'cash',
    notes: '',
  });
  const [savingQuickFee, setSavingQuickFee] = useState(false);
  const [quickFeeSuccess, setQuickFeeSuccess] = useState(null);

  // Bulk Actions
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('activate');
  const [bulkMessage, setBulkMessage] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  // CSV Import
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('name,username,phone\nAlex Morgan,alex.m,03001234567\nChris Evans,chris.e,03219876543');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function load() {
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;
    const [customersRes, profileRes] = await Promise.all([
      api.get('/admin/customers', { params }),
      api.get('/admin/profile').catch(() => ({ data: null })),
    ]);
    setCustomers(customersRes.data);
    if (profileRes.data) {
      setGymProfile(profileRes.data);
      if (profileRes.data.defaultMemberMonthlyFee && createForm.monthlyFee === 3000) {
        setCreateForm((prev) => ({
          ...prev,
          monthlyFee: profileRes.data.defaultMemberMonthlyFee,
        }));
      }
    }
    setSelected(new Set());
  }

  useEffect(() => {
    load().catch(() => setError('Could not load customers.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load().catch(() => setError('Could not load customers.'));
  }

  // ── Open Create Modal with Fresh Defaults ──────────────────────────────────
  function openCreateModal() {
    setCreateForm({
      ...defaultFormData,
      monthlyFee: gymProfile?.defaultMemberMonthlyFee ?? 3000,
    });
    setCreateError('');
    setCreatedResult(null);
    setShowCreate(true);
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        name: createForm.name.trim(),
        username: createForm.username.trim(),
        password: createForm.password ? createForm.password.trim() : undefined,
        phone: createForm.phone ? createForm.phone.trim() : '',
        monthlyFee: Number(createForm.monthlyFee) || (gymProfile?.defaultMemberMonthlyFee ?? 3000),
        admissionFee: Number(createForm.admissionFee) || 0,
      };

      if (createForm.collectNow) {
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
        payload.initialFee = {
          collectNow: true,
          title: `Initial Subscription - ${currentMonth}`,
          billingMonth: currentMonth,
          amount: payload.monthlyFee,
          admissionFee: payload.admissionFee,
          status: 'paid',
          paymentMethod: createForm.paymentMethod || 'cash',
        };
      }

      const { data } = await api.post('/admin/customers', payload);
      await load();

      setCreatedResult({
        customer: data,
        generatedPassword: data.generatedPassword,
        initialFee: data.initialFee,
        rawPassword: createForm.password || data.generatedPassword,
      });
      showToast(`${createForm.name} registered successfully!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create customer.';
      const fieldErrors = err.response?.data?.errors;
      setCreateError(fieldErrors ? Object.values(fieldErrors).flat().join(' · ') : msg);
    } finally {
      setCreating(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      await api.put(`/admin/customers/${editing._id}`, {
        name: editing.name,
        phone: editing.phone,
        monthlyFee: Number(editing.monthlyFee) || 3000,
        admissionFee: Number(editing.admissionFee) || 0,
        isActive: editing.isActive,
      });
      setEditing(null);
      await load();
      showToast('Member changes saved.', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Could not save changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(customer) {
    if (!window.confirm(`Remove ${customer.name}? This deletes their login and logged data.`)) return;
    try {
      await api.delete(`/admin/customers/${customer._id}`);
      await load();
      showToast(`${customer.name} removed.`, 'info');
    } catch (err) {
      setError(err.response?.data?.message || `Could not remove ${customer.name}.`);
      showToast('Failed to remove customer.', 'error');
    }
  }

  // ── Quick Fee Handler ───────────────────────────────────────────────────────
  function openQuickFee(customer) {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    setQuickFeeMember(customer);
    setQuickFeeSuccess(null);
    setQuickFeeForm({
      title: `Monthly Subscription - ${currentMonth}`,
      billingMonth: currentMonth,
      amount: customer.monthlyFee || gymProfile?.defaultMemberMonthlyFee || 3000,
      feeType: 'subscription',
      status: 'paid',
      paymentMethod: 'cash',
      notes: '',
    });
  }

  async function handleSaveQuickFee(e) {
    e.preventDefault();
    if (!quickFeeMember) return;
    setSavingQuickFee(true);
    try {
      const payload = {
        customerId: quickFeeMember._id,
        title: quickFeeForm.title || `Monthly Fee - ${quickFeeForm.billingMonth}`,
        billingMonth: quickFeeForm.billingMonth,
        feeType: quickFeeForm.feeType,
        amount: Number(quickFeeForm.amount) || 0,
        admissionFee: 0,
        discount: 0,
        status: quickFeeForm.status,
        paymentMethod: quickFeeForm.status === 'paid' ? quickFeeForm.paymentMethod : null,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: quickFeeForm.notes,
      };

      const { data } = await api.post('/admin/fees', payload);
      await load();
      showToast('Fee recorded successfully!', 'success');
      setQuickFeeSuccess(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not record fee.', 'error');
    } finally {
      setSavingQuickFee(false);
    }
  }

  // ── Progress ────────────────────────────────────────────────────────────────
  async function openProgress(customer) {
    setProgressFor(customer);
    setProgress(null);
    setProgressError('');
    try {
      const { data } = await api.get(`/admin/customers/${customer._id}/progress`);
      setProgress(data);
    } catch {
      setProgressError('Could not load progress data.');
    }
  }

  // ── Password Reset ──────────────────────────────────────────────────────────
  function openReset(customer) {
    setResetFor(customer);
    setResetPassword('');
    setResetResult(null);
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetting(true);
    try {
      const { data } = await api.put(`/admin/customers/${resetFor._id}/reset-password`, {
        newPassword: resetPassword || undefined,
      });
      setResetResult(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Password reset failed.', 'error');
    } finally {
      setResetting(false);
    }
  }

  // ── Bulk Actions ────────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === customers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(customers.map((c) => c._id)));
    }
  }

  async function handleBulkApply() {
    if (selected.size === 0) return;
    if (bulkAction === 'send-announcement' && !bulkMessage.trim()) {
      showToast('Please enter an announcement message.', 'warning');
      return;
    }
    setApplyingBulk(true);
    try {
      const { data } = await api.post('/admin/customers/bulk-action', {
        ids: Array.from(selected),
        action: bulkAction,
        message: bulkAction === 'send-announcement' ? bulkMessage : undefined,
      });
      showToast(data.message, 'success');
      setBulkMessage('');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk action failed.', 'error');
    } finally {
      setApplyingBulk(false);
    }
  }

  // ── CSV Import ──────────────────────────────────────────────────────────────
  async function handleImport(e) {
    e.preventDefault();
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const { data } = await api.post('/admin/customers/import', { csvData: csvText });
      setImportResult(data);
      await load();
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result || '');
    };
    reader.readAsText(file);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-ink">Members</h1>
          <p className="text-sm text-steel">
            Direct monthly subscription fee model. Register members, collect monthly fees, and track dues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowImport(true); setImportResult(null); }} className="btn-secondary">
            <svg className="icon !h-4 !w-4"><use href="#i-clipboard" /></svg>
            Import CSV
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <svg className="icon !h-4 !w-4"><use href="#i-plus" /></svg>
            Add member
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="field-input max-w-xs"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="field-input max-w-[11rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active members</option>
          <option value="inactive">Inactive members</option>
          <option value="overdue">⚠️ Overdue fees</option>
        </select>
        <button type="submit" className="btn-secondary">Search</button>
        {gymProfile?.defaultMemberMonthlyFee && (
          <span className="text-xs text-steel ml-auto hidden md:inline">
            Default rate: <strong className="text-ink">Rs. {Number(gymProfile.defaultMemberMonthlyFee).toLocaleString()}/mo</strong> · Due day: <strong className="text-ink">{gymProfile.defaultFeeDueDay || 10}th</strong>
          </span>
        )}
      </form>

      {/* Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-chalk/20 bg-chalk/5 px-4 py-3">
          <span className="text-sm font-semibold text-ink">{selected.size} selected</span>
          <select
            className="field-input max-w-[14rem] py-1.5 text-sm"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="activate">Activate all</option>
            <option value="deactivate">Deactivate all</option>
            <option value="send-announcement">Send announcement</option>
          </select>
          {bulkAction === 'send-announcement' && (
            <input
              className="field-input flex-1 py-1.5 text-sm"
              placeholder="Announcement message…"
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
            />
          )}
          <button
            onClick={handleBulkApply}
            disabled={applyingBulk}
            className="btn-primary py-1.5 text-sm"
          >
            {applyingBulk ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-steel hover:text-ink"
          >
            Clear selection
          </button>
        </div>
      )}

      {error && <div className="mb-4 text-sm text-ember-dark">{error}</div>}

      <ListCard>
        {/* Select-all header */}
        {customers.length > 0 && (
          <div className="flex items-center gap-3 border-b border-ink/5 px-4 py-2 bg-ink/[0.01]">
            <input
              type="checkbox"
              checked={selected.size === customers.length && customers.length > 0}
              onChange={toggleSelectAll}
              className="rounded"
              id="select-all-customers"
              title="Select all"
            />
            <label htmlFor="select-all-customers" className="text-xs font-medium text-steel cursor-pointer">
              Select all members ({customers.length})
            </label>
          </div>
        )}

        {customers.map((c) => {
          // Compute fee status badge
          let feePill = null;
          if (c.feeStatus === 'paid') {
            const exp = c.membershipExpiresAt ? new Date(c.membershipExpiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'Active';
            feePill = <span className="chip border-emerald-500/20 bg-emerald-500/10 text-emerald-600">🟢 Paid · exp {exp}</span>;
          } else if (c.feeStatus === 'due_soon') {
            const exp = c.membershipExpiresAt ? new Date(c.membershipExpiresAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'Soon';
            feePill = <span className="chip border-amber-500/25 bg-amber-500/15 text-amber-700 font-semibold">🟡 Due Soon · exp {exp}</span>;
          } else if (c.feeStatus === 'overdue') {
            feePill = <span className="chip border-rose-500/25 bg-rose-500/15 text-rose-700 font-semibold">🔴 Overdue</span>;
          } else if (c.feeStatus === 'unpaid') {
            feePill = <span className="chip border-amber-500/20 bg-amber-500/10 text-amber-600">🔴 Unpaid</span>;
          } else {
            feePill = <span className="chip border-ink/10 bg-ink/5 text-steel">⚪ No Fee</span>;
          }

          return (
            <div key={c._id} className="flex items-center gap-3 pr-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.01]">
              <div className="pl-4">
                <input
                  type="checkbox"
                  checked={selected.has(c._id)}
                  onChange={() => toggleSelect(c._id)}
                  className="rounded"
                />
              </div>
              <div className="flex-1 py-1">
                <ListRow
                  icon="user"
                  iconBg={c.isActive ? 'bg-chalk/15 text-chalk-dark' : 'bg-ink/5 text-steel'}
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="text-xs text-steel font-mono">@{c.user?.username || '—'}</span>
                      {feePill}
                    </div>
                  }
                  subtitle={
                    <div className="flex items-center gap-2 text-xs text-steel flex-wrap mt-0.5">
                      <span>{c.phone ? `📞 ${c.phone}` : 'No phone'}</span>
                      <span>·</span>
                      <span className="font-medium text-ink">Rs. {Number(c.monthlyFee ?? 3000).toLocaleString()}/month</span>
                      <span>·</span>
                      <span className={c.isActive ? 'text-chalk-dark font-medium' : 'text-steel'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  }
                  trailing={
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                      <button
                        onClick={() => openQuickFee(c)}
                        className="rounded-lg bg-iron/10 px-2.5 py-1 text-xs font-semibold text-iron hover:bg-iron/20 transition-colors"
                        title="Collect or Add Fee"
                      >
                        + Collect Fee
                      </button>
                      <button onClick={() => openProgress(c)} className="text-xs font-medium text-steel hover:text-ink">
                        Progress
                      </button>
                      <button onClick={() => setEditing({ ...c })} className="text-xs font-medium text-steel hover:text-ink">
                        Edit
                      </button>
                      <button onClick={() => openReset(c)} className="text-xs font-medium text-steel hover:text-ink">
                        Reset PW
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-xs font-medium text-steel hover:text-ember-dark">
                        Remove
                      </button>
                    </div>
                  }
                />
              </div>
            </div>
          );
        })}

        {customers.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-steel">
            No members found matching your search.
          </div>
        )}
      </ListCard>

      {/* ── Create Modal ───────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal
          title={!createdResult ? 'Register New Member' : 'Member Registered'}
          onClose={() => { setShowCreate(false); setCreatedResult(null); }}
          width="max-w-lg"
        >
          {!createdResult ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label">Full Name *</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Usman Ali"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Username (Member Login) *</label>
                  <input
                    className="field-input font-mono"
                    placeholder="e.g. usman.ali"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">
                    Phone Number <span className="text-steel font-normal">(for WhatsApp)</span>
                  </label>
                  <input
                    className="field-input font-mono"
                    placeholder="03001234567"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">
                  Temporary Password <span className="font-normal text-steel">(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  className="field-input font-mono"
                  placeholder="Auto-generates if empty"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  minLength={createForm.password ? 8 : undefined}
                />
              </div>

              {/* Monthly Subscription Rate Setup */}
              <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">
                  Monthly Subscription & Admission
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Monthly Fee Rate (Rs.) *</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="field-input"
                      value={createForm.monthlyFee}
                      onChange={(e) => setCreateForm({ ...createForm, monthlyFee: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Admission / Reg. Fee (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="field-input"
                      value={createForm.admissionFee}
                      onChange={(e) => setCreateForm({ ...createForm, admissionFee: e.target.value })}
                    />
                  </div>
                </div>

                {/* Collect 1st Month Fee Toggle */}
                <div className="pt-2 border-t border-ink/10">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.collectNow}
                      onChange={(e) => setCreateForm({ ...createForm, collectNow: e.target.checked })}
                      className="rounded text-iron focus:ring-iron"
                    />
                    <span>Collect 1st Month Fee Now</span>
                  </label>

                  {createForm.collectNow && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <label className="field-label">Payment Method</label>
                        <select
                          className="field-input text-xs"
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
                      <div className="text-right pt-4">
                        <div className="text-xs text-steel">Total to collect:</div>
                        <div className="text-base font-bold text-iron">
                          Rs. {(Number(createForm.monthlyFee || 0) + Number(createForm.admissionFee || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {createError && <div className="rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember-dark">{createError}</div>}

              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? 'Registering Member…' : 'Register Member & Generate Receipt'}
              </button>
            </form>
          ) : (
            /* ── Registration Success Dialog with Credentials & Print/WhatsApp ── */
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-ink">Member Onboarded Successfully!</h3>
              <p className="mb-4 text-xs text-steel">
                Member account created for <strong>{createdResult.customer.name}</strong>.
              </p>

              {/* Credentials Card */}
              <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4 text-left mb-4">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide text-steel">Login Username</span>
                  <span className="font-mono text-sm font-bold text-ink select-all">{createdResult.customer.user?.username || createdResult.customer.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide text-steel">Password</span>
                  <span className="font-mono text-base font-bold text-iron select-all">{createdResult.rawPassword || '••••••••'}</span>
                </div>
              </div>

              {/* Fee Receipt Summary if collected */}
              {createdResult.initialFee && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Paid Receipt Generated</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">{createdResult.initialFee.invoiceNumber || createdResult.initialFee.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-steel">Total Paid:</span>
                    <span className="font-bold text-ink">Rs. {Number(createdResult.initialFee.amount || 0).toLocaleString()} ({createdResult.initialFee.paymentMethod?.toUpperCase()})</span>
                  </div>
                  <div className="flex justify-between text-xs text-steel mt-1">
                    <span>Valid until:</span>
                    <span className="font-semibold text-emerald-600">
                      {new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Print Slip & WhatsApp */}
              <div className="grid gap-2 sm:grid-cols-2 mb-3">
                {createdResult.initialFee && (
                  <button
                    type="button"
                    onClick={() =>
                      printReceiptSlip({
                        gymName: gymProfile?.gymName,
                        memberName: createdResult.customer.name,
                        phone: createdResult.customer.phone,
                        receiptNumber: createdResult.initialFee.invoiceNumber || createdResult.initialFee.receiptNumber,
                        amount: createdResult.customer.monthlyFee,
                        admissionFee: createdResult.initialFee.admissionFee,
                        totalPaid: createdResult.initialFee.amount,
                        paymentMethod: createdResult.initialFee.paymentMethod,
                        validUntil: new Date(Date.now() + 30 * 86400000),
                        date: new Date(),
                      })
                    }
                    className="btn-secondary text-xs flex items-center justify-center gap-2"
                  >
                    <svg className="icon !h-4 !w-4"><use href="#i-clipboard" /></svg>
                    Print Receipt Slip
                  </button>
                )}

                {createdResult.customer.phone && (
                  <a
                    href={getWhatsAppReceiptUrl({
                      phone: createdResult.customer.phone,
                      gymName: gymProfile?.gymName,
                      memberName: createdResult.customer.name,
                      username: createdResult.customer.user?.username,
                      password: createdResult.rawPassword,
                      receiptNumber: createdResult.initialFee?.invoiceNumber || createdResult.initialFee?.receiptNumber,
                      totalPaid: createdResult.initialFee?.amount || createdResult.customer.monthlyFee,
                      paymentMethod: createdResult.initialFee?.paymentMethod || 'cash',
                      validUntil: new Date(Date.now() + 30 * 86400000),
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  >
                    <span>💬</span>
                    Send WhatsApp Receipt
                  </a>
                )}
              </div>

              <button
                onClick={() => { setShowCreate(false); setCreatedResult(null); }}
                className="btn-secondary w-full text-xs"
              >
                Close & Return to Members
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ── Quick Fee / Add Fee Modal ───────────────────────────────────────── */}
      {quickFeeMember && (
        <Modal
          title={!quickFeeSuccess ? `Collect Fee — ${quickFeeMember.name}` : 'Fee Recorded!'}
          onClose={() => { setQuickFeeMember(null); setQuickFeeSuccess(null); }}
          width="max-w-md"
        >
          {!quickFeeSuccess ? (
            <form onSubmit={handleSaveQuickFee} className="space-y-4">
              <div className="rounded-xl bg-ink/5 p-3 text-xs flex justify-between items-center">
                <div>
                  <div className="font-semibold text-ink">{quickFeeMember.name}</div>
                  <div className="text-steel">📞 {quickFeeMember.phone || 'No phone'}</div>
                </div>
                <div className="text-right">
                  <div className="text-steel">Rate</div>
                  <div className="font-bold text-ink">Rs. {Number(quickFeeMember.monthlyFee || 3000).toLocaleString()}/mo</div>
                </div>
              </div>

              <div>
                <label className="field-label">Fee Title</label>
                <input
                  className="field-input"
                  value={quickFeeForm.title}
                  onChange={(e) => setQuickFeeForm({ ...quickFeeForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Billing Month</label>
                  <input
                    className="field-input"
                    value={quickFeeForm.billingMonth}
                    onChange={(e) => setQuickFeeForm({ ...quickFeeForm, billingMonth: e.target.value })}
                    placeholder="e.g. Sep 2026"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Amount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="field-input"
                    value={quickFeeForm.amount}
                    onChange={(e) => setQuickFeeForm({ ...quickFeeForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Status</label>
                  <select
                    className="field-input"
                    value={quickFeeForm.status}
                    onChange={(e) => setQuickFeeForm({ ...quickFeeForm, status: e.target.value })}
                  >
                    <option value="paid">Paid (Collected)</option>
                    <option value="unpaid">Unpaid (Pending)</option>
                  </select>
                </div>
                {quickFeeForm.status === 'paid' && (
                  <div>
                    <label className="field-label">Payment Method</label>
                    <select
                      className="field-input"
                      value={quickFeeForm.paymentMethod}
                      onChange={(e) => setQuickFeeForm({ ...quickFeeForm, paymentMethod: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">EasyPaisa</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="field-label">Notes (Optional)</label>
                <input
                  className="field-input"
                  placeholder="e.g. Paid at reception counter"
                  value={quickFeeForm.notes}
                  onChange={(e) => setQuickFeeForm({ ...quickFeeForm, notes: e.target.value })}
                />
              </div>

              <button type="submit" disabled={savingQuickFee} className="btn-primary w-full">
                {savingQuickFee ? 'Recording Fee…' : 'Record Payment & Generate Slip'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-1 text-base font-semibold text-ink">Fee Successfully Recorded!</h3>
              <p className="mb-4 text-xs text-steel">
                Recorded for <strong>{quickFeeMember.name}</strong> · Receipt: <strong>{quickFeeSuccess.invoiceNumber || quickFeeSuccess.receiptNumber}</strong>
              </p>

              <div className="grid gap-2 sm:grid-cols-2 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    printReceiptSlip({
                      gymName: gymProfile?.gymName,
                      memberName: quickFeeMember.name,
                      phone: quickFeeMember.phone,
                      receiptNumber: quickFeeSuccess.invoiceNumber || quickFeeSuccess.receiptNumber,
                      amount: quickFeeSuccess.amount,
                      admissionFee: 0,
                      totalPaid: quickFeeSuccess.amount,
                      paymentMethod: quickFeeSuccess.paymentMethod,
                      validUntil: quickFeeMember.membershipExpiresAt || new Date(Date.now() + 30 * 86400000),
                      date: quickFeeSuccess.paidOn || new Date(),
                    })
                  }
                  className="btn-secondary text-xs flex items-center justify-center gap-2"
                >
                  <svg className="icon !h-4 !w-4"><use href="#i-clipboard" /></svg>
                  Print Slip
                </button>

                {quickFeeMember.phone && (
                  <a
                    href={getWhatsAppReceiptUrl({
                      phone: quickFeeMember.phone,
                      gymName: gymProfile?.gymName,
                      memberName: quickFeeMember.name,
                      receiptNumber: quickFeeSuccess.invoiceNumber || quickFeeSuccess.receiptNumber,
                      totalPaid: quickFeeSuccess.amount,
                      paymentMethod: quickFeeSuccess.paymentMethod || 'cash',
                      validUntil: quickFeeMember.membershipExpiresAt || new Date(Date.now() + 30 * 86400000),
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  >
                    <span>💬</span>
                    WhatsApp Receipt
                  </a>
                )}
              </div>

              <button
                onClick={() => { setQuickFeeMember(null); setQuickFeeSuccess(null); }}
                className="btn-secondary w-full text-xs"
              >
                Close
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="field-label">Full Name</label>
              <input
                className="field-input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                className="field-input font-mono"
                value={editing.phone || ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label">Monthly Subscription (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="field-input"
                  value={editing.monthlyFee ?? 3000}
                  onChange={(e) => setEditing({ ...editing, monthlyFee: e.target.value })}
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
                  value={editing.admissionFee ?? 0}
                  onChange={(e) => setEditing({ ...editing, admissionFee: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-ink/90 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="rounded text-iron focus:ring-iron"
                />
                <span>Active Member</span>
              </label>
            </div>
            {editError && <div className="rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember-dark">{editError}</div>}
            <button type="submit" disabled={savingEdit} className="btn-primary w-full">
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}

      {/* ── Password Reset Modal ────────────────────────────────────────────── */}
      {resetFor && (
        <Modal title={`Reset Password — ${resetFor.name}`} onClose={() => { setResetFor(null); setResetResult(null); }}>
          {!resetResult ? (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-xs text-steel">
                Set a new password for <strong className="text-ink">{resetFor.name}</strong> (username: <code className="rounded bg-ink/5 px-1">{resetFor.user?.username || '—'}</code>).
                Leave blank to auto-generate a random secure password.
              </p>
              <div>
                <label className="field-label">New Password (optional)</label>
                <input
                  type="text"
                  className="field-input font-mono"
                  placeholder="Leave blank to auto-generate"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  minLength={resetPassword ? 8 : undefined}
                  autoComplete="off"
                />
              </div>
              <button type="submit" disabled={resetting} className="btn-primary w-full">
                {resetting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-1 font-semibold text-ink">Password Updated</h3>
              <p className="mb-4 text-xs text-steel">
                Share these credentials with <strong>{resetResult.memberName}</strong>.
              </p>

              <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4 text-left mb-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-xs text-steel">Username:</span>
                  <span className="font-mono text-xs font-bold text-ink select-all">{resetResult.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-steel">New Password:</span>
                  <span className="font-mono text-base font-bold text-iron select-all">{resetResult.newPassword}</span>
                </div>
              </div>

              <button onClick={() => { setResetFor(null); setResetResult(null); }} className="btn-primary w-full">
                Done
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ── Progress Modal ──────────────────────────────────────────────────── */}
      {progressFor && (
        <Modal title={`${progressFor.name} — Progress & Stats`} onClose={() => setProgressFor(null)} width="max-w-2xl">
          {progressError ? (
            <div className="py-8 text-center text-sm text-ember-dark">{progressError}</div>
          ) : !progress ? (
            <div className="py-8 text-center text-sm text-steel">Loading member progress…</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="panel px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-steel">Current Streak</div>
                  <div className="stat-number mt-1 text-xl font-bold text-iron">{progress.streak?.currentStreak ?? 0} days</div>
                </div>
                <div className="panel px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-steel">Longest Streak</div>
                  <div className="stat-number mt-1 text-xl font-bold text-ink">{progress.streak?.longestStreak ?? 0} days</div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">Recent Body Weight</div>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  {progress.weight.slice(0, 5).map((w) => (
                    <li key={w._id} className="flex justify-between border-b border-ink/5 py-1">
                      <span>{new Date(w.date).toLocaleDateString()}</span>
                      <strong className="text-ink">{w.weightKg} kg</strong>
                    </li>
                  ))}
                  {progress.weight.length === 0 && <li className="text-steel">No weight logged yet.</li>}
                </ul>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">Recent Workouts</div>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  {progress.workouts.slice(0, 5).map((w) => (
                    <li key={w._id} className="flex justify-between border-b border-ink/5 py-1">
                      <span>{new Date(w.date).toLocaleDateString()}</span>
                      <span className="font-medium text-ink">{w.isRestDay ? '😴 Rest Day' : w.exercise}</span>
                    </li>
                  ))}
                  {progress.workouts.length === 0 && <li className="text-steel">No workouts logged yet.</li>}
                </ul>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">Recent Diet Meals</div>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  {progress.diet.slice(0, 5).map((d) => (
                    <li key={d._id} className="flex justify-between border-b border-ink/5 py-1">
                      <span>{new Date(d.date).toLocaleDateString()}</span>
                      <span>{d.meal} {d.calories ? `(${d.calories} kcal)` : ''}</span>
                    </li>
                  ))}
                  {progress.diet.length === 0 && <li className="text-steel">No meals logged yet.</li>}
                </ul>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── CSV Import Modal ──────────────────────────────────────────────── */}
      {showImport && (
        <Modal
          title="Bulk Import Members (CSV)"
          onClose={() => { setShowImport(false); setImportResult(null); }}
        >
          {!importResult ? (
            <form onSubmit={handleImport} className="space-y-3">
              <p className="text-xs text-steel">
                Upload or paste member details. Columns: <code className="rounded bg-ink/5 px-1 font-mono">name,username,phone,password</code>.
                Password is optional (auto-generated if omitted).
              </p>

              <div>
                <label className="field-label">Upload .csv file (optional)</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="field-input text-xs"
                />
              </div>

              <div>
                <label className="field-label">CSV Content</label>
                <textarea
                  rows={6}
                  className="field-input font-mono text-xs"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={importing || !csvText.trim()} className="btn-primary w-full">
                {importing ? 'Importing Members…' : 'Start Import'}
              </button>
            </form>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <svg className="icon !h-5 !w-5"><use href="#i-check-circle" /></svg>
                {importResult.message}
              </div>

              {importResult.created?.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-ink/10 bg-ink/5 p-3 text-xs">
                  <div className="mb-2 font-semibold text-ink">Created Members & Passwords:</div>
                  {importResult.created.map((c, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-ink/5 last:border-0">
                      <span><strong>{c.name}</strong> ({c.username})</span>
                      <span className="font-mono text-iron select-all">{c.password}</span>
                    </div>
                  ))}
                </div>
              )}

              {importResult.skipped?.length > 0 && (
                <div className="mb-4 rounded-xl border border-ember/20 bg-ember/5 p-3 text-xs text-ember-dark">
                  <div className="mb-1 font-semibold">Skipped ({importResult.skipped.length}):</div>
                  {importResult.skipped.map((s, idx) => (
                    <div key={idx}>{s.name} ({s.username}): {s.reason}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setShowImport(false); setImportResult(null); }}
                className="btn-primary w-full"
              >
                Done
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
