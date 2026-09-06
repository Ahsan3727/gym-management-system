import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

import AuthGuard from './components/AuthGuard.jsx';
import DashboardShell from './components/DashboardShell.jsx';
import IconSprite from './components/IconSprite.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));

const CustomerOverview = lazy(() => import('./pages/customer/CustomerOverview.jsx'));
const CustomerWorkouts = lazy(() => import('./pages/customer/Workouts.jsx'));
const CustomerDiet = lazy(() => import('./pages/customer/Diet.jsx'));
const CustomerWeight = lazy(() => import('./pages/customer/Weight.jsx'));
const CustomerAnalytics = lazy(() => import('./pages/customer/Analytics.jsx'));
const CustomerAccount = lazy(() => import('./pages/customer/Account.jsx'));
const CustomerNotifications = lazy(() => import('./pages/customer/Notifications.jsx'));

// `icon` refers to an IconSprite id (components/IconSprite.jsx) and drives
// the icon-pill nav rendered by DashboardShell.
const customerNav = [
  { to: '/', label: 'Overview', end: true, icon: 'home' },
  { to: '/workouts', label: 'Workouts', icon: 'dumbbell' },
  { to: '/diet', label: 'Diet & water', icon: 'drop' },
  { to: '/weight', label: 'Weight & body', icon: 'trend' },
  { to: '/analytics', label: 'Analytics', icon: 'zap' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/account', label: 'Account', icon: 'user' },
];

// Landing spot for a gym's install link (/g/:slug) and its start_url once
// installed. src/main.jsx has *already* resolved and applied this gym's
// branding (manifest, apple-touch-icon, theme-color, title) before React
// ever rendered, and persisted it to sessionStorage/TenantContext — this
// route's only remaining job is to strip the /g/:slug prefix so the rest
// of the routing tree (which doesn't expect it) sees a normal path.
function TenantGateway() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return null;
}

function PageFallback() {
  return (
    <div className="flex h-64 min-h-[300px] items-center justify-center">
      <div className="flex items-center gap-3 text-steel">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ember border-t-transparent" />
        <span className="text-sm font-medium">Loading page…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <IconSprite />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Per-gym install links (Option A branded PWA). Must come before
              the catch-all below so /g/:slug isn't swallowed into the
              dashboard route before TenantGateway gets a chance to run. */}
          <Route path="/g/:slug" element={<TenantGateway />} />
          <Route path="/g/:slug/*" element={<TenantGateway />} />

          {/* Member routes — this whole app is single-role, so there's no
              RoleHome redirector and no /customer prefix: "/" IS the
              member's home. */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <DashboardShell navItems={customerNav} accent="ember" roleLabel="Member dashboard" />
              </AuthGuard>
            }
          >
            <Route index element={<CustomerOverview />} />
            <Route path="workouts" element={<CustomerWorkouts />} />
            <Route path="diet" element={<CustomerDiet />} />
            <Route path="weight" element={<CustomerWeight />} />
            <Route path="analytics" element={<CustomerAnalytics />} />
            <Route path="notifications" element={<CustomerNotifications />} />
            <Route path="account" element={<CustomerAccount />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
