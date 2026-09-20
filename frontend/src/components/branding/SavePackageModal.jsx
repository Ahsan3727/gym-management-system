import React, { useState } from 'react';
import api from '../../api/axios.js';

/**
 * Modal for saving current branding drafts as a named, reusable package.
 * POSTs to /superadmin/brand-packages and calls onSaved(pkg) on success.
 */
export default function SavePackageModal({ memberDraft, adminDraft, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [tagline, setTagline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/superadmin/brand-packages', {
        name: name.trim(),
        emoji: emoji.trim() || '✨',
        tagline: tagline.trim(),
        memberApp: memberDraft,
        adminApp: adminDraft,
      });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel w-full max-w-sm px-6 py-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">💾 Save as Package</h2>
          <button type="button" onClick={onClose} className="text-steel hover:text-ink transition-colors">
            <svg className="icon !h-5 !w-5"><use href="#i-close" /></svg>
          </button>
        </div>

        <p className="text-xs text-steel leading-relaxed">
          Save the current theme, shell, and dashboard settings as a reusable package.
          It will appear in the Package row for all gyms.
        </p>

        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Emoji + Name row */}
          <div className="flex gap-2">
            <div className="w-16 shrink-0">
              <label className="field-label">Emoji</label>
              <input
                className="field-input text-center text-lg"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                placeholder="✨"
              />
            </div>
            <div className="flex-1">
              <label className="field-label">Package Name <span className="text-danger">*</span></label>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Boxing Elite"
                maxLength={40}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="field-label">Tagline <span className="text-steel">(optional)</span></label>
            <input
              className="field-input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Dark, powerful, combat sports"
              maxLength={80}
            />
          </div>

          {/* Settings preview pills */}
          <div className="rounded-xl border border-ink/10 bg-bone/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-steel mb-2">Saving these settings</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['member theme', memberDraft.theme],
                ['member shell', memberDraft.shell],
                ['member dashboard', memberDraft.dashboard],
                ['admin theme', adminDraft.theme],
              ].map(([label, val]) => (
                <span key={label} className="rounded-md bg-ink/8 px-2 py-0.5 text-[9px] font-mono uppercase text-steel">
                  {label}: <strong className="text-ink">{val}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="btn-primary flex-1 py-2 text-xs"
            >
              {saving ? 'Saving…' : 'Save Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
