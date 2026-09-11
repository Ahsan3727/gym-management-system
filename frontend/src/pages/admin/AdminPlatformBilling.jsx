import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminPlatformBilling() {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submit proof modal
  const [proofingFee, setProofingFee] = useState(null);
  const [proofForm, setProofForm] = useState({
    paymentMethod: 'bank_transfer',
    reference: '',
    bankName: '',
    note: '',
  });
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState('');

  const { showToast } = useToast();

  async function loadData() {
    try {
      const [feesRes, summaryRes] = await Promise.all([
        api.get('/admin/platform-fees'),
        api.get('/admin/platform-fees/summary'),
      ]);
      setFees(feesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      setError('Could not load platform dues.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function copyText(text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`, { type: 'success' });
    }).catch(() => {
      showToast(`Could not copy ${label}`, { type: 'error' });
    });
  }

  function openProofModal(fee) {
    setProofingFee(fee);
    setProofForm({
      paymentMethod: fee.paymentMethod || 'bank_transfer',
      reference: fee.paymentProof?.reference || '',
      bankName: fee.paymentProof?.bankName || '',
      note: fee.paymentProof?.note || '',
    });
    setProofError('');
  }

  async function handleSubmitProof(e) {
    e.preventDefault();
    setSubmittingProof(true);
    setProofError('');
    try {
      await api.post(`/admin/platform-fees/${proofingFee._id}/submit-proof`, proofForm);
      setProofingFee(null);
      showToast('Payment proof submitted successfully! Super admin will verify shortly.', { type: 'success' });
      await loadData();
    } catch (err) {
      setProofError(err.response?.data?.message || 'Could not submit payment proof.');
    } finally {
      setSubmittingProof(false);
    }
  }

  function printInvoiceSlip(fee) {
    const win = window.open('', '_blank');
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
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Software License & Platform Subscription</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 20px;">${fee.invoiceNumber}</h2>
              <div style="margin-top: 6px;"><span class="badge ${fee.status}">${fee.status}</span></div>
            </div>
          </div>

          <div class="details-grid">
            <div class="box">
              <h4>Invoice Meta</h4>
              Billing Period: <strong>${fee.billingCycle || 'N/A'}</strong><br/>
              Issue Date: <strong>${new Date(fee.created_at).toLocaleDateString()}</strong><br/>
              Due Date: <strong>${new Date(fee.dueDate).toLocaleDateString()}</strong><br/>
              ${fee.paidOn ? `Paid On: <strong>${new Date(fee.paidOn).toLocaleDateString()}</strong><br/>Method: <strong>${fee.paymentMethod}</strong>` : ''}
              ${fee.transactionReference ? `<br/>Ref #: <strong>${fee.transactionReference}</strong>` : ''}
            </div>
            <div class="box">
              <h4>Payment Status</h4>
              Current Status: <strong>${fee.status.toUpperCase()}</strong><br/>
              Total Billed: <strong>Rs. ${fee.amount.toLocaleString()}</strong>
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
                <td style="text-align: right; font-weight: 700;">Rs. ${fee.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total Amount: Rs. ${fee.amount.toLocaleString()}
          </div>

          <div class="footer">
            Official receipt issued by Ironline Platform Administration.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  if (loading && !summary) return <div className="text-sm text-steel">Loading platform dues…</div>;

  const bank = summary?.bankDetails || {};
  const isSevere = summary?.isSeverelyOverdue;
  const isOverdue = summary?.overdueCount > 0;
  const hasDues = summary?.totalOutstanding > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Platform Subscription & Dues</h1>
        <p className="mt-1 text-sm text-steel">
          View your Ironline SaaS software subscription invoices, payment instructions, and submit transaction receipts.
        </p>
      </div>

      {error && <div className="text-sm text-ember-dark">{error}</div>}

      {/* Standing Banner */}
      <div
        className={`panel p-6 border-l-4 ${
          isSevere
            ? 'border-l-ember-dark bg-ember/5'
            : isOverdue
            ? 'border-l-ember bg-ember/5'
            : hasDues
            ? 'border-l-iron bg-iron/5'
            : 'border-l-chalk-dark bg-chalk/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  isSevere
                    ? 'bg-ember/20 text-ember-dark'
                    : isOverdue
                    ? 'bg-ember/20 text-ember-dark'
                    : hasDues
                    ? 'bg-iron/20 text-iron'
                    : 'bg-chalk/20 text-chalk-dark'
                }`}
              >
                {isSevere
                  ? 'Service Restriction Warning'
                  : isOverdue
                  ? 'Payment Overdue'
                  : hasDues
                  ? 'Payment Pending'
                  : 'Account in Good Standing'}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-bold text-ink">
              {isSevere
                ? 'Your platform fee is past the grace period. Please clear outstanding dues.'
                : isOverdue
                ? 'You have overdue platform subscription dues.'
                : hasDues
                ? 'You have an active platform invoice pending payment.'
                : 'All platform subscription dues are cleared. Thank you!'}
            </h3>
            <p className="mt-1 text-xs text-steel">
              Overdue grace period: {summary?.gracePeriodDays || 14} days. After transfer, submit your transaction ID below.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs text-steel">Outstanding Balance</span>
            <span className="text-2xl font-mono font-extrabold text-ink">
              Rs. {(summary?.totalOutstanding || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Official Receiving Accounts Card */}
      <div className="panel p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <svg className="icon !h-5 !w-5 text-iron"><use href="#i-card" /></svg>
            Official Payment Instructions & Transfer Details
          </h2>
          <p className="text-xs text-steel mt-0.5">
            Transfer your subscription dues directly to the official platform bank account or mobile wallet below:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {bank.bankName && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-steel uppercase">Bank Transfer</span>
              <div className="font-bold text-ink">{bank.bankName}</div>
              <div className="text-xs text-steel">Title: <strong className="text-ink">{bank.accountTitle}</strong></div>
              {bank.accountNumber && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/10">
                  <span className="text-xs font-mono font-semibold text-ink">{bank.accountNumber}</span>
                  <button
                    onClick={() => copyText(bank.accountNumber, 'Account Number')}
                    className="text-[11px] font-semibold text-iron hover:underline"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {bank.iban && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-1">
              <span className="text-[11px] font-semibold text-steel uppercase">IBAN Transfer</span>
              <div className="font-bold text-ink truncate" title={bank.iban}>{bank.iban}</div>
              <div className="text-xs text-steel">Title: <strong className="text-ink">{bank.accountTitle}</strong></div>
              <div className="flex items-center justify-end mt-2 pt-2 border-t border-ink/10">
                <button
                  onClick={() => copyText(bank.iban, 'IBAN')}
                  className="text-[11px] font-semibold text-iron hover:underline"
                >
                  Copy IBAN
                </button>
              </div>
            </div>
          )}

          {(bank.jazzcashNumber || bank.easypaisaNumber) && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4 space-y-2">
              <span className="text-[11px] font-semibold text-steel uppercase">Mobile Wallets</span>
              {bank.jazzcashNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span>JazzCash: <strong className="font-mono text-ink">{bank.jazzcashNumber}</strong></span>
                  <button
                    onClick={() => copyText(bank.jazzcashNumber, 'JazzCash')}
                    className="text-[11px] font-semibold text-iron hover:underline"
                  >
                    Copy
                  </button>
                </div>
              )}
              {bank.easypaisaNumber && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-ink/5">
                  <span>EasyPaisa: <strong className="font-mono text-ink">{bank.easypaisaNumber}</strong></span>
                  <button
                    onClick={() => copyText(bank.easypaisaNumber, 'EasyPaisa')}
                    className="text-[11px] font-semibold text-iron hover:underline"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {bank.note && (
          <div className="rounded-lg bg-ink/5 px-4 py-2.5 text-xs text-steel">
            <strong>Note:</strong> {bank.note}
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="panel overflow-hidden">
        <div className="border-b border-ink/10 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Invoices & Subscription History</h3>
          <span className="text-xs text-steel">{fees.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-ink/[0.02] text-xs font-semibold text-steel uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-steel">
                    No platform subscription invoices issued yet.
                  </td>
                </tr>
              ) : (
                fees.map((f) => {
                  const isPaid = f.status === 'paid';
                  const isOverdue = f.status === 'overdue';
                  const hasProof = Boolean(f.paymentProof?.reference);

                  return (
                    <tr key={f._id} className="hover:bg-ink/[0.015] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-ink">
                        {f.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{f.title}</div>
                        <div className="text-xs text-steel capitalize">{f.feeType}</div>
                        {hasProof && !isPaid && (
                          <div className="mt-1 text-[11px] font-semibold text-amber-600">
                            Proof Submitted: Ref #{f.paymentProof.reference} (Awaiting SuperAdmin Verification)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-steel whitespace-nowrap">
                        {f.billingCycle || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-ink whitespace-nowrap">
                        Rs. {f.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap text-steel">
                        {new Date(f.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                          {!isPaid && f.status !== 'waived' && (
                            <button
                              onClick={() => openProofModal(f)}
                              className="rounded bg-iron px-3 py-1 text-paper hover:brightness-110 transition-all"
                            >
                              {hasProof ? 'Update Proof' : 'Submit Proof'}
                            </button>
                          )}
                          <button
                            onClick={() => printInvoiceSlip(f)}
                            className="text-steel hover:text-ink transition-colors"
                          >
                            Print Receipt
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

      {/* Modal: Submit Proof */}
      {proofingFee && (
        <Modal
          title={`Submit Payment Proof — ${proofingFee.invoiceNumber}`}
          onClose={() => setProofingFee(null)}
          width="max-w-md"
        >
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div className="rounded-lg bg-ink/[0.03] p-3 text-sm border border-ink/10">
              <div className="font-semibold text-ink">{proofingFee.title}</div>
              <div className="mt-1 font-mono font-bold text-ink">
                Amount Due: Rs. {proofingFee.amount.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="field-label">Payment Method Used</label>
              <select
                className="field-input"
                value={proofForm.paymentMethod}
                onChange={(e) => setProofForm({ ...proofForm, paymentMethod: e.target.value })}
                required
              >
                <option value="bank_transfer">Bank Transfer (IBAN / Online)</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="cash">Cash in Hand</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="field-label">Transaction ID / Reference #</label>
              <input
                className="field-input font-mono"
                value={proofForm.reference}
                onChange={(e) => setProofForm({ ...proofForm, reference: e.target.value })}
                placeholder="e.g. UTR / Transaction Ref ID"
                required
              />
              <p className="mt-1 text-xs text-steel">Enter the reference or transaction ID shown in your banking app.</p>
            </div>

            <div>
              <label className="field-label">Your Bank / App Name</label>
              <input
                className="field-input"
                value={proofForm.bankName}
                onChange={(e) => setProofForm({ ...proofForm, bankName: e.target.value })}
                placeholder="e.g. Meezan Bank, HBL, Allied Bank"
              />
            </div>

            <div>
              <label className="field-label">Additional Note (Optional)</label>
              <textarea
                className="field-input"
                rows={2}
                value={proofForm.note}
                onChange={(e) => setProofForm({ ...proofForm, note: e.target.value })}
                placeholder="e.g. Transferred from Account #0123 on Sep 15."
              />
            </div>

            {proofError && <div className="text-sm text-ember-dark">{proofError}</div>}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setProofingFee(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submittingProof} className="btn-primary">
                {submittingProof ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
