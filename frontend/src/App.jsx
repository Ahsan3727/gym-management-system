import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardShell from './components/DashboardShell.jsx';
import { useAuth } from './context/AuthContext.jsx';

import CustomerOverview from './pages/customer/CustomerOverview.jsx';
import CustomerWorkouts from './pages/customer/Workouts.jsx';
import CustomerDiet from './pages/customer/Diet.jsx';
import CustomerWeight from './pages/customer/Weight.jsx';
import CustomerAnalytics from './pages/customer/Analytics.jsx';
import CustomerAccount from './pages/customer/Account.jsx';

import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminCustomers from './pages/admin/Customers.jsx';
import AdminFees from './pages/admin/Fees.jsx';
import AdminPlans from './pages/admin/Plans.jsx';
import AdminGymProfile from './pages/admin/GymProfile.jsx';

import SuperAdminOverview from './pages/superadmin/SuperAdminOverview.jsx';
import SuperAdminAdmins from './pages/superadmin/Admins.jsx';
import SuperAdminSettings from './pages/superadmin/Settings.jsx';
import SuperAdminAuditLog from './pages/superadmin/AuditLog.jsx';

const customerNav = [
  { to: '/customer', label: 'Overview', end: true },
  { to: '/customer/workouts', label: 'Workouts' },
  { to: '/customer/diet', label: 'Diet & water' },
  { to: '/customer/weight', label: 'Weight & body' },
  { to: '/customer/analytics', label: 'Analytics' },
  { to: '/customer/account', label: 'Account' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/fees', label: 'Fees' },
  { to: '/admin/plans', label: 'Plans & pricing' },
  { to: '/admin/profile', label: 'Gym profile' },
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
  const home = { customer: '/customer', admin: '/admin', super_admin: '/superadmin' }[user.role];
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleHome />} />

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
        <Route path="account" element={<CustomerAccount />} />
      </Route>

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
        <Route path="fees" element={<AdminFees />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="profile" element={<AdminGymProfile />} />
      </Route>

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
  );
}
