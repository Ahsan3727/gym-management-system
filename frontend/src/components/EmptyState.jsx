import React from 'react';

/**
 * Branded empty state for any page with an empty list.
 *
 * Usage:
 *   <EmptyState
 *     icon="users"
 *     title="No members yet"
 *     description="Add your first gym member to get started."
 *     action={{ label: 'Add Member', onClick: openCreateModal }}
 *   />
 */
export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-ink/8 bg-panel-2 shadow-xs">
        <svg className="icon !h-7 !w-7 text-steel">
          <use href={`#i-${icon}`} />
        </svg>
      </div>
      {title && <h3 className="text-title text-ink mb-1">{title}</h3>}
      {description && <p className="text-caption max-w-xs mt-0.5">{description}</p>}
      {action && (
        <button className="btn-primary btn-md mt-5" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
