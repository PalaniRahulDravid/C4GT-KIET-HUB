import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      name: 'Manage Users',
      to: '/admin/users',
      description: 'Role RBAC & permissions',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      name: 'Batches',
      to: '/admin/batches',
      description: 'Academic batches & teams',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ),
    },
    {
      name: 'Next Tasks for Teams',
      to: '/admin/tasks',
      description: 'Milestones & deliverables',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="m9 14 2 2 4-4"></path>
        </svg>
      ),
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
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-[#F8FAFC] font-sans antialiased text-[#0F172A] select-none overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ==================== LEFT FIXED SIDEBAR ==================== */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[290px] h-full flex-shrink-0 bg-[#070D1A] text-white flex flex-col justify-between border-r border-[#1E293B]/60 transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="p-6 overflow-y-auto">
          {/* C4 Brand Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-indigo-950/50 border border-white/10 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[17px] tracking-tight text-white group-hover:text-indigo-300 transition-colors">C4GT Hub</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">KIET Group of Institutions</p>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Section Label */}
          <div className="mb-3 px-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Admin Operations</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
          </div>

          {/* STRICT 4 SIDEBAR NAVIGATION ITEMS */}
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-900/40 border-indigo-400/30'
                      : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border-transparent hover:border-slate-700/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                      {item.icon}
                    </div>
                    <div className="leading-tight">
                      <div className={`text-[14px] ${isActive ? 'font-semibold text-white' : 'font-medium'}`}>
                        {item.name}
                      </div>
                      <div className={`text-[11px] font-normal mt-0.5 ${isActive ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar (Exit Link & Admin Profile) */}
        <div className="p-5 border-t border-slate-800/80 bg-[#0B1220]/60 space-y-3 flex-shrink-0">
          {/* Exit to Main Site button */}
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors group"
          >
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Exit to Main Site
            </span>
            <svg className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>

          {/* Current Admin Profile Card */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Circular Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-inner flex-shrink-0 ring-2 ring-indigo-500/30">
                {getInitials(user?.name)}
              </div>
              <div className="truncate leading-tight">
                <div className="font-semibold text-xs text-white truncate">
                  {user?.name || 'PALIVELA LAKSHMI TARUN'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {user?.email || 'admin@c4gt-kiet.in'}
                </div>
                <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  ADMIN
                </span>
              </div>
            </div>
            {/* Logout action icon */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header (~84px) */}
        <header className="h-[84px] bg-white border-b border-[#E2E8F0] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb + Page Title */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mb-1">
                <span>Admin Workspace</span>
                <span className="text-slate-300">/</span>
                <span className="text-indigo-600 font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="text-xl sm:text-[24px] lg:text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* MongoDB Atlas Live Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              MongoDB Atlas Live
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>

            {/* Main Site Navigation Link */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Main Site</span>
              <svg className="w-3 h-3 text-slate-400 hidden sm:inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
          </div>
        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scroll bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
