import React from 'react';

export default function Modal({ title, onClose, children, width = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className={`w-full ${width} rounded-sm border border-ink/10 bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-steel hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
