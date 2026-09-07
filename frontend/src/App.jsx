import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardShell from './components/DashboardShell.jsx';
import IconSprite from './components/IconSprite.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { lazyWithReload } from './utils/lazyWithReload.js';

// FIX: swapped plain React.lazy() for lazyWithReload() everywhere below.
// See utils/lazyWithReload.js for why — in short, it stops a stale/failed
// route chunk (common right after a new deploy) from leaving the page
// permanently blank.
const Login = lazyWithReload(() => import('./pages/Login.jsx'), 'Login');

const CustomerOverview = lazyWithReload(() => import('./pages/customer/CustomerOverview.jsx'), 'CustomerOverview');
const CustomerWorkouts = lazyWithReload(() => import('./pages/customer/Workouts.jsx'), 'CustomerWorkouts');
const CustomerDiet = lazyWithReload(() => import('./pages/customer/Diet.jsx'), 'CustomerDiet');
const CustomerWeight = lazyWithReload(() => import('./pages/customer/Weight.jsx'), 'CustomerWeight');
const CustomerAnalytics = lazyWithReload(() => import('./pages/customer/Analytics.jsx'), 'CustomerAnalytics');
const CustomerAccount = lazyWithReload(() => import('./pages/customer/Account.jsx'), 'CustomerAccount');
const CustomerNotifications = lazyWithReload(() => import('./pages/customer/Notifications.jsx'), 'CustomerNotifications');
const CustomerCheckin = lazyWithReload(() => import('./pages/customer/Checkin.jsx'), 'CustomerCheckin');

const AdminOverview = lazyWithReload(() => import('./pages/admin/AdminOverview.jsx'), 'AdminOverview');
const AdminAttendance = lazyWithReload(() => import('./pages/admin/Attendance.jsx'), 'AdminAttendance');
const AdminCustomers = lazyWithReload(() => import('./pages/admin/Customers.jsx'), 'AdminCustomers');
const AdminFees = lazyWithReload(() => import('./pages/admin/Fees.jsx'), 'AdminFees');
const AdminPlans = lazyWithReload(() => import('./pages/admin/Plans.jsx'), 'AdminPlans');
const AdminGymProfile = lazyWithReload(() => import('./pages/admin/GymProfile.jsx'), 'AdminGymProfile');
const AdminTrainers = lazyWithReload(() => import('./pages/admin/Trainers.jsx'), 'AdminTrainers');
const AdminBranches = lazyWithReload(() => import('./pages/admin/Branches.jsx'), 'AdminBranches');

const TrainerOverview = lazyWithReload(() => import('./pages/trainer/TrainerOverview.jsx'), 'TrainerOverview');
const TrainerClients = lazyWithReload(() => import('./pages/trainer/TrainerClients.jsx'), 'TrainerClients');
const TrainerSchedule = lazyWithReload(() => import('./pages/trainer/TrainerSchedule.jsx'), 'TrainerSchedule');

const SuperAdminOverview = lazyWithReload(() => import('./pages/superadmin/SuperAdminOverview.jsx'), 'SuperAdminOverview');
const SuperAdminAdmins = lazyWithReload(() => import('./pages/superadmin/Admins.jsx'), 'SuperAdminAdmins');
const SuperAdminSettings = lazyWithReload(() => import('./pages/superadmin/Settings.jsx'), 'SuperAdminSettings');
const SuperAdminAuditLog = lazyWithReload(() => import('./pages/superadmin/AuditLog.jsx'), 'SuperAdminAuditLog');

// `icon` refers to an IconSprite id (components/IconSprite.jsx) and drives
// the icon-pill nav rendered by the Phase 1 DashboardShell.
const customerNav = [
  { to: '/customer', label: 'Overview', end: true, icon: 'home' },
  { to: '/customer/checkin', label: 'Check-In', icon: 'zap' },
  { to: '/customer/workouts', label: 'Workouts', icon: 'dumbbell' },
  { to: '/customer/diet', label: 'Diet & water', icon: 'drop' },
  { to: '/customer/weight', label: 'Weight & body', icon: 'trend' },
  { to: '/customer/analytics', label: 'Analytics', icon: 'zap' },
  { to: '/customer/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/customer/account', label: 'Account', icon: 'user' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', end: true, icon: 'home' },
  { to: '/admin/attendance', label: 'Attendance', icon: 'zap' },
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
  { to: '/trainer/schedule', label: 'Schedule', icon: 'clipboard' },
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
          <Route path="checkin" element={<CustomerCheckin />} />
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
          <Route path="schedule" element={<TrainerSchedule />} />
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
          <Route path="attendance" element={<AdminAttendance />} />
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
