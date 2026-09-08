import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import TeamOverview from './pages/admin/TeamOverview';
import TeamTasks from './pages/admin/TeamTasks';
import TeamLeadDashboard from './pages/teamlead/TeamLeadDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CompleteProfile from './pages/CompleteProfile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Website / Public & Common Routes with standard Header */}
          <Route path="/" element={<RootLayout />}>
            {/* Home - public, accessible to everyone */}
            <Route index element={<Home />} />
            {/* /home is an alias for / — same page, accessible to all */}
            <Route path="home" element={<Home />} />

            {/* Login / Google Auth: blocked for already authenticated users */}
            <Route
              path="login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Complete Profile / Mandatory Student Information Onboarding */}
            <Route
              path="complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard: accessible to ALL authenticated users (any role) */}
            <Route
              path="student"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Team Lead Dashboard: strictly Team Lead only */}
            <Route
              path="team-lead"
              element={
                <ProtectedRoute allowedRoles={['teamlead']}>
                  <TeamLeadDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Dedicated Admin Portal: HIDES the public header, uses dedicated AdminLayout & sidebar */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* /admin - Overview */}
            <Route index element={<AdminOverview />} />
            {/* /admin/overview alias */}
            <Route path="overview" element={<AdminOverview />} />
            {/* /admin/users - User Management & RBAC */}
            <Route path="users" element={<ManageUsers />} />
            {/* /admin/teams - Overview of Teams */}
            <Route path="teams" element={<TeamOverview />} />
            {/* /admin/tasks - Next Tasks for Teams */}
            <Route path="tasks" element={<TeamTasks />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

