/**
 * Offline Check-In Manager
 * Handles local persistence of check-ins when in dead zones / offline basements,
 * and automatic synchronization when network connectivity is re-established.
 */

const STORAGE_KEY = 'gym_pending_offline_checkin';

export function saveOfflineCheckin({ token, scannedAt = new Date().toISOString() }) {
  const record = {
    token,
    scannedAt,
    queuedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return record;
  } catch (err) {
    console.error('[offlineCheckin] Failed to persist offline check-in:', err);
    return record;
  }
}

export function getPendingCheckin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingCheckin() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function syncPendingCheckin(api) {
  const pending = getPendingCheckin();
  if (!pending || !pending.token) return null;

  try {
    const { data } = await api.post('/customer/checkin', {
      qrToken: pending.token,
      offlineScannedAt: pending.scannedAt,
    });
    clearPendingCheckin();
    return { success: true, streak: data };
  } catch (err) {
    console.error('[offlineCheckin] Sync failed:', err);
    // If the error indicates invalid token or already checked in, clear to avoid loop
    if (err.response?.status === 400 && err.response?.data?.message?.includes('already')) {
      clearPendingCheckin();
    }
    throw err;
  }
}

export function initBackgroundSync(api, onSyncSuccess, onSyncError) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    const pending = getPendingCheckin();
    if (!pending) return;

    try {
      const res = await syncPendingCheckin(api);
      if (res?.success && onSyncSuccess) {
        onSyncSuccess(res.streak);
      }
    } catch (err) {
      if (onSyncError) {
        onSyncError(err.response?.data?.message || 'Sync failed.');
      }
    }
  };

  window.addEventListener('online', handleOnline);

  // If already online right now, attempt immediate sync of any lingering queue
  if (navigator.onLine) {
    handleOnline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
