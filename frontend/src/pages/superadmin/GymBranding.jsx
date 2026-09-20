import React, { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import ThemePicker from '../../components/branding/ThemePicker.jsx';
import ModePicker from '../../components/branding/ModePicker.jsx';
import ShellPicker from '../../components/branding/ShellPicker.jsx';
import DashboardPicker from '../../components/branding/DashboardPicker.jsx';
import SurfacePicker from '../../components/branding/SurfacePicker.jsx';
import BrandingPreview from '../../components/branding/BrandingPreview.jsx';
import { DEFAULT_APP } from '../../theme/themes.js';
import PackagePicker from '../../components/branding/PackagePicker.jsx';
import SavePackageModal from '../../components/branding/SavePackageModal.jsx';

export default function GymBranding({ admin, onClose, onUpdated, allAdmins = [] }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('memberApp');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSavePackage, setShowSavePackage] = useState(false);
  const [pkgRefreshKey, setPkgRefreshKey] = useState(0);

  const initialMember = admin?.branding?.memberApp || { ...DEFAULT_APP };
  const initialAdmin = admin?.branding?.adminApp || { ...DEFAULT_APP };

  const [memberDraft, setMemberDraft] = useState(initialMember);
  const [adminDraft, setAdminDraft] = useState(initialAdmin);

  const currentDraft = activeTab === 'memberApp' ? memberDraft : adminDraft;
  const updateCurrentDraft = (field, val) => {
    if (activeTab === 'memberApp') {
      setMemberDraft((prev) => ({ ...prev, [field]: val }));
    } else {
      setAdminDraft((prev) => ({ ...prev, [field]: val }));
    }
  };

  const hasChanges =
    JSON.stringify(memberDraft) !== JSON.stringify(initialMember) ||
    JSON.stringify(adminDraft) !== JSON.stringify(initialAdmin);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        memberApp: memberDraft,
        adminApp: adminDraft,
      };
      const res = await api.put(`/superadmin/admins/${admin._id}/branding`, payload);
      showToast(`Branding updated for ${admin.gymName}!`, { type: 'success' });
      if (onUpdated) onUpdated(res.data);
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save branding configurations.';
      setError(msg);
      showToast(msg, { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (activeTab === 'memberApp') {
      setMemberDraft({ ...DEFAULT_APP });
    } else {
      setAdminDraft({ ...DEFAULT_APP });
    }
    showToast(`Reset ${activeTab === 'memberApp' ? 'Member' : 'Admin'} app to default settings.`);
  }

  function handlePackageSelect(pkg) {
    setMemberDraft({ ...pkg.memberApp });
    setAdminDraft({ ...pkg.adminApp });
    showToast(`Applied "${pkg.name}" package — review and save when ready.`, { type: 'success' });
  }

  function handleCopyFrom(otherGymId) {
    const source = allAdmins.find((a) => a._id === otherGymId);
    if (!source) return;
    if (source.branding?.memberApp) {
      setMemberDraft({ ...source.branding.memberApp });
    }
    if (source.branding?.adminApp) {
      setAdminDraft({ ...source.branding.adminApp });
    }
    showToast(`Copied theme & layout configuration from ${source.gymName}!`, { type: 'success' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Branding & Layout Control Center</h2>
          <p className="text-xs text-steel">
            Configure custom per-gym palettes, responsive shells, and dashboards for{' '}
            <strong className="text-ink">{admin.gymName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-500">
              ● Unsaved Changes
            </span>
          )}

          {allAdmins.length > 1 && (
            <select
              onChange={(e) => {
                if (e.target.value) handleCopyFrom(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="field-input text-xs py-1.5 px-2.5"
            >
              <option value="" disabled>
                Copy preset from gym…
              </option>
              {allAdmins
                .filter((a) => a._id !== admin._id)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.gymName}
                  </option>
                ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowSavePackage(true)}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Save current settings as a reusable package"
          >
            💾 Save as Package
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Reset Tab
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn-primary text-xs py-1.5 px-4"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-danger">{error}</div>}

      {/* Recommended Packages */}
      <PackagePicker
        activeTab={activeTab}
        onSelect={handlePackageSelect}
        refreshKey={pkgRefreshKey}
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-ink/10" />
        <span className="text-[10px] uppercase tracking-widest text-steel/60 font-semibold">or configure manually</span>
        <div className="flex-1 border-t border-ink/10" />
      </div>

      {/* App Target Tabs */}
      <div className="flex border-b border-ink/10">
        <button
          type="button"
          onClick={() => setActiveTab('memberApp')}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'memberApp'
              ? 'border-ember text-ember'
              : 'border-transparent text-steel hover:text-ink'
          }`}
        >
          <span>👤 Member PWA App</span>
          {memberDraft.theme !== 'ember' && (
            <span className="rounded-full bg-ink/10 px-1.5 py-0.2 text-[9px] uppercase font-mono">
              {memberDraft.theme}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('adminApp')}
          className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-xs font-bold transition-colors ${
            activeTab === 'adminApp'
              ? 'border-iron text-iron'
              : 'border-transparent text-steel hover:text-ink'
          }`}
        >
          <span>🏢 Gym Admin & Trainer App</span>
          {adminDraft.theme !== 'ember' && (
            <span className="rounded-full bg-ink/10 px-1.5 py-0.2 text-[9px] uppercase font-mono">
              {adminDraft.theme}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Controls Column */}
        <div className="space-y-6 lg:col-span-7">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-steel">
                Color Palette & Theme
              </label>
              <span className="text-[11px] text-steel">
                Active: <strong className="text-ink uppercase font-mono">{currentDraft.theme}</strong>
              </span>
            </div>
            <ThemePicker
              value={currentDraft.theme}
              onChange={(theme) => updateCurrentDraft('theme', theme)}
              app={activeTab}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-steel">
              Default Color Mode (Unset User Preference)
            </label>
            <ModePicker
              value={currentDraft.defaultMode}
              onChange={(mode) => updateCurrentDraft('defaultMode', mode)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-steel">
              Navigation Shell Layout
            </label>
            <ShellPicker
              value={currentDraft.shell}
              onChange={(shell) => updateCurrentDraft('shell', shell)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-steel">
              Dashboard Information Density
            </label>
            <DashboardPicker
              value={currentDraft.dashboard}
              onChange={(dashboard) => updateCurrentDraft('dashboard', dashboard)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-steel">
              Visual Surface & Background
            </label>
            <SurfacePicker
              value={currentDraft.surface}
              onChange={(surface) => updateCurrentDraft('surface', surface)}
            />
          </div>
        </div>

        {/* Live Scoped Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-steel">
              Live Tenant Sandbox
            </div>
            <BrandingPreview
              settings={currentDraft}
              app={activeTab}
              gymName={admin.gymName}
            />
          </div>
        </div>
      </div>
      {showSavePackage && (
        <SavePackageModal
          memberDraft={memberDraft}
          adminDraft={adminDraft}
          onClose={() => setShowSavePackage(false)}
          onSaved={() => {
            setShowSavePackage(false);
            setPkgRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
