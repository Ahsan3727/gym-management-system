import React from 'react';

/**
 * Apex-style list container: a rounded panel holding a stack of ListRow
 * items with hairline dividers between them. Phase 2 swaps page-level
 * tables (e.g. Admin Customers/Trainers, SuperAdmin Admins) to this where
 * tabular precision isn't actually needed — most of those are really just
 * "a list of things with a name, a bit of meta, and an action."
 */
export default function ListCard({ children, className = '' }) {
  return <div className={`panel divide-y divide-ink/10 overflow-hidden ${className}`}>{children}</div>;
}
