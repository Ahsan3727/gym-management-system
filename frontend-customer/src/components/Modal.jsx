import React, { useEffect } from 'react';

/**
 * Phase 4 QA: modals had no Escape-to-close and didn't lock background
 * scroll, so the page behind the modal kept scrolling with it and
 * keyboard users had no way out except tabbing to the close button.
 * Neither is theme-related — both are fixed here as part of the full
 * page-by-page interaction pass (see implementation plan §8).
 */
export default function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className={`modal-panel w-full ${width}`}>
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h3 className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg className="icon !h-4 !w-4">
              <use href="#i-close" />
            </svg>
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
