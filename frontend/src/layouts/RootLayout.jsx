import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth, getRoleName, getDashboardPath, isStudentProfileComplete } from '../context/AuthContext';
import ProfileDetailsModal from '../components/ProfileDetailsModal';

export default function RootLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isFullBleedPage =
    location.pathname === '/' ||
    location.pathname === '/home' ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/student');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isProfileComplete = isStudentProfileComplete(user);
  const isOnboarding = isAuthenticated && !isProfileComplete;

  // Strict Onboarding Rule: If authenticated but student details are incomplete,
  // do not open any page — force redirect immediately to /complete-profile.
  if (!loading && isOnboarding && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (isFullBleedPage) {
    return <Outlet />;
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'teamlead':
      case 'team_lead':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'user':
      case 'student':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={isOnboarding ? '/complete-profile' : '/'} className="flex items-center space-x-3">
            <span className="text-xl font-bold text-gray-900 tracking-tight">C4GT KIET HUB</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider border-l border-gray-200 pl-3 hidden sm:inline">
              LMS Platform
            </span>
          </Link>

          {/* If onboarding: only show Sign Out button in header */}
          {isOnboarding ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Step: Student Information Required
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <nav className="hidden md:flex items-center space-x-6">
              {/* Home is the only top-nav link — dashboards are in the profile dropdown only */}
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-blue-600 ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`
                }
              >
                Home
              </NavLink>

              {/* If NOT Authenticated: Direct Login link without role dropdown */}
              {!isAuthenticated ? (
                <Link to="/login">
                  <Button variant="default" size="sm" className="cursor-pointer">
                    Sign In
                  </Button>
                </Link>
              ) : (
              /* User Profile Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
                      {getInitials(user?.name)}
                    </div>
                  )}

                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {getRoleName(user?.role)}
                    </p>
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                    {/* User Identity Header: Click user's name to open Profile Details */}
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full text-left group cursor-pointer"
                        title="Click to view & edit Profile Details"
                      >
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 truncate flex items-center justify-between">
                          <span>{user?.name || 'Account'}</span>
                          <span className="text-[10px] text-blue-600 font-semibold underline">Profile Details</span>
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                      </button>
                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(
                            user?.role
                          )}`}
                        >
                          Role: {getRoleName(user?.role)}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items based strictly on user role */}
                    <div className="py-1">
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
                        >
                          <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                        <Link
                          to="/team-lead"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Team Lead Dashboard
                        </Link>
                      )}

                      {(user?.role === 'user' || user?.role === 'student' || !user?.role) && (
                        <Link
                          to="/student"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          Student Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

          {/* Mobile Menu Toggle Button */}
          {!isOnboarding && (
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle Navigation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2 hover:text-blue-600"
            >
              Home
            </Link>

            {!isAuthenticated ? (
              <div className="pt-2 border-t border-gray-100">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-sm font-medium text-blue-600 text-center bg-blue-50 rounded-md"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(
                      user?.role
                    )}`}
                  >
                    Role: {getRoleName(user?.role)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          C4GT KIET HUB Learning & Performance Management System.
        </div>
      </footer>

      {/* Global Profile Details Modal - Opened by clicking user name in top right dropdown */}
      <ProfileDetailsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
