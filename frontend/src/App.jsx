import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardShell from './components/DashboardShell.jsx';
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

const customerNav = [
  { to: '/customer', label: 'Overview', end: true },
  { to: '/customer/workouts', label: 'Workouts' },
  { to: '/customer/diet', label: 'Diet & water' },
  { to: '/customer/weight', label: 'Weight & body' },
  { to: '/customer/analytics', label: 'Analytics' },
  { to: '/customer/notifications', label: 'Notifications' },
  { to: '/customer/account', label: 'Account' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/trainers', label: 'Trainers' },
  { to: '/admin/branches', label: 'Locations' },
  { to: '/admin/fees', label: 'Fees' },
  { to: '/admin/plans', label: 'Plans & pricing' },
  { to: '/admin/profile', label: 'Gym profile' },
];

const trainerNav = [
  { to: '/trainer', label: 'Overview', end: true },
  { to: '/trainer/clients', label: 'Client Studio' },
];

const superAdminNav = [
  { to: '/superadmin', label: 'Overview', end: true },
  { to: '/superadmin/admins', label: 'Gym accounts' },
  { to: '/superadmin/audit-log', label: 'Audit log' },
  { to: '/superadmin/settings', label: 'Platform settings' },
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
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleHome />} />

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
  );
}
