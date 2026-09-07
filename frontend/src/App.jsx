import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeamLeadDashboard from './pages/teamlead/TeamLeadDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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

            {/* Admin Dashboard: strictly Admin only */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
