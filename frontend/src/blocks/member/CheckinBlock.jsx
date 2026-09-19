import React, { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useMemberDashboard } from '../useMemberDashboardData.jsx';

export default function CheckinBlock() {
  const { profile, streak, checkingIn, performCheckin } = useMemberDashboard();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [localError, setLocalError] = useState('');

  const checkedInToday = streak?.lastCheckin
    ? new Date(streak.lastCheckin).toDateString() === new Date().toDateString()
    : false;

  async function handleConfirm() {
    if (!qrInput.trim()) return;
    setLocalError('');
    const result = await performCheckin(qrInput.trim());
    if (result.success) {
      setShowQrModal(false);
      setQrInput('');
    } else {
      setLocalError(result.error);
    }
  }

  function handleCheckinClick() {
    if (profile?.gym?.checkinTokenRequired) {
      setShowQrModal(true);
    } else {
      performCheckin();
    }
  }

  return (
    <>
      <div className="panel card--tint mb-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember/15 text-ember">
            <svg className="icon !h-5 !w-5">
              <use href="#i-zap" />
            </svg>
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Daily check-in</div>
            <div className="mt-0.5 text-sm text-steel">
              {checkedInToday
                ? "You're checked in for today. Nice work!"
                : profile?.gym?.checkinTokenRequired
                ? 'Scan reception QR code or enter token to check in.'
                : "You haven't checked in today."}
            </div>
          </div>
        </div>
        <button
          onClick={handleCheckinClick}
          disabled={checkingIn || checkedInToday}
          className="btn-primary relative"
        >
          {checkedInToday ? 'Checked in' : checkingIn ? 'Checking in…' : profile?.gym?.checkinTokenRequired ? 'QR Check-in' : 'Check in'}
        </button>
      </div>

      {showQrModal && (
        <Modal
          title="Reception QR Verification"
          onClose={() => {
            setShowQrModal(false);
            setQrInput('');
            setLocalError('');
          }}
          width="max-w-sm"
        >
          <p className="mb-4 text-xs text-steel">
            Enter the passcode or paste the scanned token displayed at your gym's front desk.
          </p>
          <input
            type="text"
            placeholder="Paste token or reception passcode…"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className="field-input mb-4 font-mono text-xs"
            autoFocus
          />
          {localError && <div className="mb-3 text-xs text-danger">{localError}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!qrInput.trim() || checkingIn}
              className="btn-primary flex-1 text-xs"
            >
              {checkingIn ? 'Verifying…' : 'Confirm Check-In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                setQrInput('');
                setLocalError('');
              }}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
