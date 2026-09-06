import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

/**
 * Apex-style toast/snackbar system. Mounted once in main.jsx, alongside
 * ThemeProvider. Call useToast() from any page to fire a pill notification
 * — the first intended consumer is CustomerOverview's plain-text check-in
 * confirmation, swapped over in Phase 2's page rollout.
 *
 *   const { showToast } = useToast();
 *   showToast('Checked in — 5 day streak!', { type: 'success' });
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = 'default', duration = 3200 } = {}) => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`toast pointer-events-auto ${
              toast.type === 'success' ? 'toast--success' : toast.type === 'error' ? 'toast--error' : ''
            }`}
          >
            {toast.type === 'success' && (
              <svg className="icon !h-4 !w-4 shrink-0">
                <use href="#i-check-circle" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="icon !h-4 !w-4 shrink-0">
                <use href="#i-close" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
