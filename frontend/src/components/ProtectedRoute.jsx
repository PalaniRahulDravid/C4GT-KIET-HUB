import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Onboarding Rule: If student details are incomplete and user is not on /complete-profile,
  // block access to all pages and redirect to /complete-profile.
  if (!isStudentProfileComplete(user) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Normalize current role for comparison (student -> user, team_lead -> teamlead)
  const normalizedUserRole = user.role === 'student' ? 'user' : user.role === 'team_lead' ? 'teamlead' : user.role;

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((r) =>
      r === 'student' ? 'user' : r === 'team_lead' ? 'teamlead' : r
    );

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // Auto-redirect to the user's correct dashboard (handles DB role changes)
      const dashboardPath = getDashboardPath(user.role);
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return children;
}

/**
 * PublicRoute (Guest-Only Route):
 * If a user is already logged in, they CANNOT access the auth/login page.
 * If their student profile is incomplete, redirect immediately to /complete-profile.
 * Otherwise, redirect to their assigned dashboard.
 */
export function PublicRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (!isStudentProfileComplete(user)) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
