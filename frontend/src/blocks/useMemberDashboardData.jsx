import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';

const MemberDashboardContext = createContext(null);

export function MemberDashboardProvider({ children }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [membership, setMembership] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, streakRes, membershipRes, weightRes, sessionsRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/streak'),
        api.get('/customer/membership'),
        api.get('/customer/weight'),
        api.get('/customer/sessions').catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      setStreak(streakRes.data);
      setMembership(membershipRes.data);
      setWeightLogs(weightRes.data || []);
      setSessions(sessionsRes.data || []);
      setError('');
    } catch {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const performCheckin = useCallback(async (qrToken) => {
    setCheckingIn(true);
    setError('');
    try {
      const { data } = await api.post('/customer/streak/checkin', { qrToken });
      setStreak(data);
      showToast(`Checked in — ${data.currentStreak}d streak!`, { type: 'success' });
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Check-in failed. Verify the reception code.';
      setError(msg);
      showToast(msg, { type: 'error' });
      return { success: false, error: msg };
    } finally {
      setCheckingIn(false);
    }
  }, [showToast]);

  const value = {
    profile,
    streak,
    membership,
    weightLogs,
    sessions,
    loading,
    checkingIn,
    error,
    setError,
    loadAll,
    performCheckin,
  };

  return (
    <MemberDashboardContext.Provider value={value}>
      {children}
    </MemberDashboardContext.Provider>
  );
}

export function useMemberDashboard() {
  const ctx = useContext(MemberDashboardContext);
  if (!ctx) throw new Error('useMemberDashboard must be used within a MemberDashboardProvider');
  return ctx;
}
