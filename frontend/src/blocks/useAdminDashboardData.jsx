import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';

const AdminDashboardContext = createContext(null);

export function AdminDashboardProvider({ children }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [billingSummary, setBillingSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [announcing, setAnnouncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, a, b] = await Promise.all([
        api.get('/admin/profile'),
        api.get('/admin/analytics'),
        api.get('/admin/platform-fees/summary').catch(() => ({ data: null })),
      ]);
      setProfile(p.data);
      setAnalytics(a.data);
      setBillingSummary(b.data);
      setError('');
    } catch {
      setError('Could not load gym analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sendAnnouncement = useCallback(async (message) => {
    if (!message || !message.trim()) return false;
    setAnnouncing(true);
    try {
      const res = await api.post('/admin/announcements', { message: message.trim() });
      showToast(res.data?.message || 'Announcement broadcast to all members!', { type: 'success' });
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to broadcast announcement.', { type: 'error' });
      return false;
    } finally {
      setAnnouncing(false);
    }
  }, [showToast]);

  const value = {
    profile,
    analytics,
    billingSummary,
    error,
    loading,
    announcing,
    sendAnnouncement,
    loadData,
  };

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard() {
  const ctx = useContext(AdminDashboardContext);
  if (!ctx) throw new Error('useAdminDashboard must be used within an AdminDashboardProvider');
  return ctx;
}
