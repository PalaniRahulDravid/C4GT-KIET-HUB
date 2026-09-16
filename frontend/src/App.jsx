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
import Batches from './pages/admin/Batches';
import TeamTasks from './pages/admin/TeamTasks';
import AdminResources from './pages/admin/AdminResources';
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

            {/* Direct Profile Route: opens student dashboard with profile modal */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'user', 'teamlead', 'team_lead']}>
                  <Navigate to="/student?profile=true" replace />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard: Accessible to Students and Team Leads (who are also students) */}
            {/* "student/*" matches /student, /student/overview, /student/my-tasks, etc. */}
            <Route
              path="student/*"
              element={
                <ProtectedRoute allowedRoles={['student', 'user', 'teamlead', 'team_lead']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Team Lead Dashboard: strictly Team Lead only */}
            <Route
              path="teamlead"
              element={
                <ProtectedRoute allowedRoles={['teamlead', 'team_lead']}>
                  <TeamLeadDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="team-lead"
              element={
                <ProtectedRoute allowedRoles={['teamlead', 'team_lead']}>
                  <TeamLeadDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Dedicated Admin Portal: HIDES public header, strictly Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* /admin & /admin/dashboard - Overview */}
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="overview" element={<AdminOverview />} />
            {/* /admin/users - User Management & RBAC */}
            <Route path="users" element={<ManageUsers />} />
            {/* /admin/batches - Batches Module & sub-routes */}
            <Route path="batches" element={<Batches />} />
            <Route path="batches/:batchId" element={<Batches />} />
            <Route path="batches/:batchId/team/:teamId" element={<Batches />} />
            {/* /admin/teams - Dedicated 9 Cohort Teams & Lead Assignment */}
            <Route path="teams" element={<TeamOverview />} />
            {/* /admin/tasks - Next Tasks for Teams */}
            <Route path="tasks" element={<TeamTasks />} />
            {/* /admin/resources - Cloudinary Resource Hub & Links */}
            <Route path="resources" element={<AdminResources />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

