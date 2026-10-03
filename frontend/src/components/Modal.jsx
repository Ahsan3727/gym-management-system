import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Mobile-first modal — rendered via React Portal directly into document.body.
 *
 * WHY PORTAL: `position: fixed` is broken whenever a parent element has a CSS
 * `transform`, `filter`, `perspective`, or `will-change: transform` applied.
 * Cards in this app use `hover:-translate-y-px` (a transform), which makes any
 * nested `fixed` element anchor to the card instead of the viewport — causing
 * the modal to appear off-screen when the page is scrolled.
 * Portal bypasses the entire DOM tree and attaches directly to <body>.
 *
 * - On phones  : slides up from the bottom as a bottom sheet.
 * - On sm+ (640px+): vertically centered overlay.
 * - Escape key + backdrop click both close the modal.
 * - Body scroll is locked while open.
 */
export default function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={`modal-panel w-full ${width} rounded-t-[28px] sm:rounded-[20px] flex flex-col animate-[slideUpModal_0.25s_ease-out] sm:animate-[modal-in_0.22s_cubic-bezier(0.34,1.3,0.64,1)_both]`}
        style={{ maxHeight: '92dvh' }}
      >
        {/* Drag handle — visible on mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-ink/20" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6 sm:py-5">
          <h3 className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg className="icon !h-4 !w-4"><use href="#i-close" /></svg>
          </button>
        </div>

        {/* Scrollable body — overscroll-contain prevents page scroll on iOS */}
        <div
          className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
