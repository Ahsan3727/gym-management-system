import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardShell from './components/DashboardShell.jsx';
import IconSprite from './components/IconSprite.jsx';
import { useAuth } from './context/AuthContext.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));

const CustomerOverview = lazy(() => import('./pages/customer/CustomerOverview.jsx'));
const CustomerWorkouts = lazy(() => import('./pages/customer/Workouts.jsx'));
const CustomerDiet = lazy(() => import('./pages/customer/Diet.jsx'));
const CustomerWeight = lazy(() => import('./pages/customer/Weight.jsx'));
const CustomerAnalytics = lazy(() => import('./pages/customer/Analytics.jsx'));
const CustomerAccount = lazy(() => import('./pages/customer/Account.jsx'));
const CustomerNotifications = lazy(() => import('./pages/customer/Notifications.jsx'));

const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers.jsx'));
const AdminFees = lazy(() => import('./pages/admin/Fees.jsx'));
const AdminPlans = lazy(() => import('./pages/admin/Plans.jsx'));
const AdminGymProfile = lazy(() => import('./pages/admin/GymProfile.jsx'));
const AdminTrainers = lazy(() => import('./pages/admin/Trainers.jsx'));
const AdminBranches = lazy(() => import('./pages/admin/Branches.jsx'));

const TrainerOverview = lazy(() => import('./pages/trainer/TrainerOverview.jsx'));
const TrainerClients = lazy(() => import('./pages/trainer/TrainerClients.jsx'));

const SuperAdminOverview = lazy(() => import('./pages/superadmin/SuperAdminOverview.jsx'));
const SuperAdminAdmins = lazy(() => import('./pages/superadmin/Admins.jsx'));
const SuperAdminSettings = lazy(() => import('./pages/superadmin/Settings.jsx'));
const SuperAdminAuditLog = lazy(() => import('./pages/superadmin/AuditLog.jsx'));

// `icon` refers to an IconSprite id (components/IconSprite.jsx) and drives
// the icon-pill nav rendered by the Phase 1 DashboardShell.
const customerNav = [
  { to: '/customer', label: 'Overview', end: true, icon: 'home' },
  { to: '/customer/workouts', label: 'Workouts', icon: 'dumbbell' },
  { to: '/customer/diet', label: 'Diet & water', icon: 'drop' },
  { to: '/customer/weight', label: 'Weight & body', icon: 'trend' },
  { to: '/customer/analytics', label: 'Analytics', icon: 'zap' },
  { to: '/customer/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/customer/account', label: 'Account', icon: 'user' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', end: true, icon: 'home' },
  { to: '/admin/customers', label: 'Customers', icon: 'user' },
  { to: '/admin/trainers', label: 'Trainers', icon: 'dumbbell' },
  { to: '/admin/branches', label: 'Locations', icon: 'building' },
  { to: '/admin/fees', label: 'Fees', icon: 'card' },
  { to: '/admin/plans', label: 'Plans & pricing', icon: 'tag' },
  { to: '/admin/profile', label: 'Gym profile', icon: 'shield' },
];

const trainerNav = [
  { to: '/trainer', label: 'Overview', end: true, icon: 'home' },
  { to: '/trainer/clients', label: 'Client Studio', icon: 'runner' },
];

const superAdminNav = [
  { to: '/superadmin', label: 'Overview', end: true, icon: 'home' },
  { to: '/superadmin/admins', label: 'Gym accounts', icon: 'briefcase' },
  { to: '/superadmin/audit-log', label: 'Audit log', icon: 'clipboard' },
  { to: '/superadmin/settings', label: 'Platform settings', icon: 'sliders' },
];

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const home = {
    customer: '/customer',
    trainer: '/trainer',
    admin: '/admin',
    super_admin: '/superadmin',
  }[user.role];
  return <Navigate to={home || '/login'} replace />;
}

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
        <Route path="/staff" element={<Login staffOnly={true} />} />
        <Route path="/" element={<RoleHome />} />

        {/* Per-gym install links (Option A branded PWA). Must come before
            the catch-all below so /g/:slug isn't swallowed into a redirect
            to "/" before TenantGateway gets a chance to run. */}
        <Route path="/g/:slug" element={<TenantGateway />} />
        <Route path="/g/:slug/*" element={<TenantGateway />} />

        {/* Member Routes */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <DashboardShell navItems={customerNav} accent="ember" roleLabel="Member dashboard" />
            </ProtectedRoute>
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

        {/* Trainer Routes */}
        <Route
          path="/trainer"
          element={
            <ProtectedRoute role="trainer">
              <DashboardShell navItems={trainerNav} accent="iron" roleLabel="Personal Trainer" />
            </ProtectedRoute>
          }
        >
          <Route index element={<TrainerOverview />} />
          <Route path="clients" element={<TrainerClients />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardShell navItems={adminNav} accent="iron" roleLabel="Gym admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="trainers" element={<AdminTrainers />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="profile" element={<AdminGymProfile />} />
        </Route>

        {/* Super Admin Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute role="super_admin">
              <DashboardShell navItems={superAdminNav} accent="chalk" roleLabel="Super admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminOverview />} />
          <Route path="admins" element={<SuperAdminAdmins />} />
          <Route path="audit-log" element={<SuperAdminAuditLog />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
