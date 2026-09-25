import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, LogOut, LayoutDashboard, Users, Layers, CheckSquare, ChevronRight, Award, UploadCloud, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLogo,
  SidebarSectionLabel,
  SidebarUser,
} from '../../components/AceternitySidebar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Admin Change Password Modal State
  const [changePassModalOpen, setChangePassModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword.trim()) {
      setPassError('Current password is required (default is admin@).');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match. Please re-type.');
      return;
    }

    try {
      setIsSubmittingPass(true);
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPassSuccess('Admin password updated successfully in MongoDB Atlas!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setChangePassModalOpen(false);
          setPassSuccess('');
        }, 2000);
      } else {
        setPassError(data.message || 'Failed to update password. Current password is admin@.');
      }
    } catch (err) {
      setPassError('Network error while changing password. Please try again.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Overview',
      to: '/admin',
      end: true,
      description: 'System stats & quick actions',
      icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.8} />,
    },
    {
      name: 'Manage Users',
      to: '/admin/users',
      description: 'Role RBAC & permissions',
      icon: <Users className="w-6 h-6" strokeWidth={1.8} />,
    },
    {
      name: 'C4GT HUB Teams (9)',
      to: '/admin/teams',
      description: '9 Teams & Lead Assignment',
      icon: <Award className="w-6 h-6" strokeWidth={1.8} />,
    },
    {
      name: 'Batches',
      to: '/admin/batches',
      description: 'Academic batches & teams',
      icon: <Layers className="w-6 h-6" strokeWidth={1.8} />,
    },
    {
      name: 'Next Tasks for Teams',
      to: '/admin/tasks',
      description: 'Milestones & deliverables',
      icon: <CheckSquare className="w-6 h-6" strokeWidth={1.8} />,
    },
    {
      name: 'Resource Library',
      to: '/admin/resources',
      description: 'Cloudinary media & links',
      icon: <UploadCloud className="w-6 h-6" strokeWidth={1.8} />,
    },
  ];

  const getPageInfo = () => {
    if (location.pathname === '/admin/users') {
      return { breadcrumb: 'Manage Users', title: 'Manage Users & Permissions' };
    }
    if (location.pathname === '/admin/teams') {
      return { breadcrumb: 'C4GT HUB Teams', title: '9 C4GT HUB Teams & Roster Management' };
    }
    if (location.pathname.startsWith('/admin/batches')) {
      return { breadcrumb: 'Batches', title: 'Batches Workspace' };
    }
    if (location.pathname === '/admin/tasks') {
      return { breadcrumb: 'Tasks', title: 'Next Tasks for Teams' };
    }
    if (location.pathname === '/admin/resources') {
      return { breadcrumb: 'Resources', title: 'Cloudinary Resource Management' };
    }
    return { breadcrumb: 'Overview', title: 'Admin Dashboard Overview' };
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const pageInfo = getPageInfo();

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-[#F7F5EE] font-sans antialiased text-[#1C1B1A] select-none overflow-hidden">
      {/* ==================== ACETERNITY COLLAPSIBLE SIDEBAR ==================== */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          {/* Top: logo + nav */}
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            {/* Logo */}
            <SidebarLogo
              logo={{
                href: '/admin',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-white shadow-md p-1">
                    <C4GTLogo showText={false} imgClassName="h-7" />
                  </div>
                ),
                label: 'C4GT KIET HUB',
                badge: 'ADMIN',
                sublabel: 'Operations Portal',
              }}
              className="mb-2"
            />

            {/* Section label (Height locked, zero vertical shift) */}
            <SidebarSectionLabel label="Admin Operations" />

            {/* Nav links */}
            <nav className="mt-1 space-y-1">
              {navItems.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                return (
                  <SidebarLink
                    key={item.to}
                    link={{
                      href: item.to,
                      label: item.name,
                      icon: (
                        <span className={`w-6 h-6 flex items-center justify-center ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                          {item.icon}
                        </span>
                      ),
                    }}
                    isActive={isActive}
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                );
              })}
            </nav>

          </div>

          {/* Bottom: Admin User profile */}
          <SidebarUser
            user={user || { name: 'Admin Account', role: 'admin' }}
            getInitials={getInitials}
            onProfileClick={() => {
              setChangePassModalOpen(true);
              setPassError('');
              setPassSuccess('');
            }}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header (~84px) */}
        <header className="h-[84px] bg-[#F9F8F3]/95 backdrop-blur-md border-b border-[#E2DDD0] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#1C1B1A] hover:bg-black/5"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb + Editorial Page Title */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[#66645E] font-medium mb-1">
                <span>Admin Workspace</span>
                <span className="text-[#9E9C94]">/</span>
                <span className="text-[#1C1B1A] font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="font-bold tracking-tight text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#1C1B1A] tracking-tight leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Change Password Button */}
            <button
              type="button"
              onClick={() => {
                setChangePassModalOpen(true);
                setPassError('');
                setPassSuccess('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#1C1B1A] bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] shadow-2xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Change Password</span>
              <span className="sm:hidden">Password</span>
            </button>

          </div>

        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scroll bg-[#F7F5EE]">
          <Outlet />
        </main>
      </div>

      {/* ==================== CHANGE ADMIN PASSWORD MODAL ==================== */}
      {changePassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#FDFCF9] border border-[#E0DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E0DDD0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#66645E] font-semibold">
                    Security & Authentication
                  </span>
                </div>
                <h3 className="font-bold tracking-tight text-2xl text-[#1C1B1A] mt-1">
                  Change Admin Password
                </h3>
                <p className="text-xs text-[#66645E] mt-1">
                  Default fixed initial password is <strong className="text-[#1C1B1A]">admin@</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChangePassModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EAE7DC] text-[#66645E] hover:text-[#1C1B1A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {passError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{passError}</span>
              </div>
            )}
            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{passSuccess}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1C1B1A] block">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (admin@)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] p-1"
                  >
                    {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1C1B1A] block">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] p-1"
                  >
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1C1B1A] block">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A] shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] p-1"
                  >
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E0DDD0]">
                <button
                  type="button"
                  onClick={() => setChangePassModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E0DDD0] text-[#66645E] hover:text-[#1C1B1A] hover:bg-[#F2EFE6] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPass}
                  className="px-5 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white font-medium shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingPass ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
