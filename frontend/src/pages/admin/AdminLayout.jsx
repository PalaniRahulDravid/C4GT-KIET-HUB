import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, LogOut, LayoutDashboard, Users, Layers, CheckSquare, Home as HomeIcon, ChevronRight } from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    },
    {
      name: 'Manage Users',
      to: '/admin/users',
      description: 'Role RBAC & permissions',
      icon: <Users className="w-4.5 h-4.5" />,
    },
    {
      name: 'Batches',
      to: '/admin/batches',
      description: 'Academic batches & teams',
      icon: <Layers className="w-4.5 h-4.5" />,
    },
    {
      name: 'Next Tasks for Teams',
      to: '/admin/tasks',
      description: 'Milestones & deliverables',
      icon: <CheckSquare className="w-4.5 h-4.5" />,
    },
  ];

  const getPageInfo = () => {
    if (location.pathname === '/admin/users') {
      return { breadcrumb: 'Manage Users', title: 'Manage Users & Permissions' };
    }
    if (location.pathname.startsWith('/admin/batches') || location.pathname === '/admin/teams') {
      return { breadcrumb: 'Batches', title: 'Batches Workspace' };
    }
    if (location.pathname === '/admin/tasks') {
      return { breadcrumb: 'Tasks', title: 'Next Tasks for Teams' };
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
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== LEFT FIXED LIGHT SIDEBAR ==================== */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[290px] h-full flex-shrink-0 bg-[#F2EFE6] text-[#1C1B1A] flex flex-col justify-between border-r border-[#E0DDD0] transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="p-6 overflow-y-auto">
          {/* C4 Brand Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex flex-col gap-1 group">
              <div className="flex items-center gap-3">
                <C4GTLogo showText={false} imgClassName="h-11" />
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md bg-[#1C1B1A] text-white">
                  ADMIN
                </span>
              </div>
              <span className="text-base font-bold text-[#1C1B1A] font-serif tracking-tight mt-1.5 group-hover:text-black transition-colors">
                C4GT KIET HUB
              </span>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-[#66645E] hover:text-[#1C1B1A] p-1 rounded-lg"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Section Label */}
          <div className="mb-3 px-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-widest text-[#66645E] uppercase">Admin Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>

          {/* STRICT 4 SIDEBAR NAVIGATION ITEMS (LIGHT THEME) */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border ${
                    isActive
                      ? 'bg-white text-[#1C1B1A] font-semibold shadow-2xs border-[#E0DDD0]'
                      : 'hover:bg-black/5 text-[#66645E] hover:text-[#1C1B1A] border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#1C1B1A]" />
                    )}
                    <div className={`mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-[#1C1B1A]' : 'text-[#66645E]'}`}>
                      {item.icon}
                    </div>
                    <div className="leading-tight">
                      <div className={`text-[14px] ${isActive ? 'font-bold text-[#1C1B1A]' : 'font-medium'}`}>
                        {item.name}
                      </div>
                      <div className={`text-[11px] font-normal mt-0.5 ${isActive ? 'text-[#4A4843]' : 'text-[#88867E]'}`}>
                        {item.description}
                      </div>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar (Exit Link & Admin Profile - LIGHT THEME) */}
        <div className="p-5 border-t border-[#E0DDD0] bg-[#EEECDF]/60 space-y-3 flex-shrink-0">
          {/* Exit to Main Site button */}
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F8F6F0] text-[#1C1B1A] text-xs font-medium border border-[#E0DDD0] shadow-2xs transition-colors group cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <HomeIcon className="w-4 h-4 text-[#66645E]" />
              Exit to Main Site
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#66645E] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Current Admin Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E0DDD0] shadow-2xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="truncate leading-tight">
                <div className="font-semibold text-xs text-[#1C1B1A] truncate">
                  {user?.name || 'PALIVELA LAKSHMI TARUN'}
                </div>
                <div className="text-[11px] text-[#66645E] font-mono truncate">
                  {user?.email || 'admin@c4gt-kiet.in'}
                </div>
                <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-[#1C1B1A]/[0.08] text-[#1C1B1A] border border-[#1C1B1A]/10">
                  ADMIN
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-8 h-8 rounded-lg hover:bg-black/5 text-[#66645E] hover:text-rose-600 flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

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
              <h1 className="font-['Instrument_Serif',serif] text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#1C1B1A] tracking-tight leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Main Site Navigation Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-[#1C1B1A] bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] shadow-2xs transition-colors"
            >
              <HomeIcon className="w-3.5 h-3.5 text-[#66645E]" />
              <span>Main Site</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#66645E]" />
            </Link>
          </div>

        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scroll bg-[#F7F5EE]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
