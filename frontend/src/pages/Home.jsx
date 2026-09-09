<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardPath, getRoleName } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trend');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
=======
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../context/AuthContext';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trend');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

<<<<<<< HEAD
  const getDashboardLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'teamlead':
      case 'team_lead':
        return 'Team Lead Dashboard';
      case 'user':
      case 'student':
      default:
        return 'Student Dashboard';
    }
  };

=======
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(getDashboardPath(user?.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-[#070D1A] font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#070D1A]/80 backdrop-blur-xl border-b border-white/[0.08] transition-all">
        <div className="h-[72px] max-w-[1240px] mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
                <span className="material-symbols-outlined text-white text-[20px]">hub</span>
              </div>
              <span className="text-[17px] text-white font-bold tracking-tight group-hover:text-indigo-300 transition-colors">
                C4GT KIET HUB
              </span>
              <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 tracking-wider">
                HUB
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('curriculum')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Learning
            </button>
            <button
              onClick={() => scrollToSection('roles')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Teams
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('analytics')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Analytics
            </button>
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden sm:inline-block"
                >
                  Contact
                </Link>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden sm:inline-block"
                >
                  Login
                </Link>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/40 active:translate-y-0.5 cursor-pointer"
                >
                  Get Started
                </button>
                <Link
                  to="/login"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-white/15 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                  title="Sign In"
                >
                  <span className="material-symbols-outlined text-slate-300 text-[18px]">person</span>
                </Link>
              </>
            ) : (
<<<<<<< HEAD
              <div className="relative flex items-center" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 border border-white/20 flex items-center justify-center cursor-pointer text-white font-semibold text-sm shadow-md hover:ring-2 hover:ring-indigo-400 transition-all"
                  title={user?.name || 'Account'}
                  aria-label="Account menu"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-11 w-64 bg-[#0D1527] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-white/[0.08]">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                          {getRoleName(user?.role)}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate(getDashboardPath(user?.role));
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-indigo-400">space_dashboard</span>
                        <span>{getDashboardLabel(user?.role)}</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
=======
              <>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/40 active:translate-y-0.5 cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-8 h-8 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center cursor-pointer text-white font-semibold text-xs shadow-md"
                  title={user?.name || 'Dashboard'}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </button>
              </>
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white p-1"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1220] border-b border-white/10 px-6 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('curriculum')}
              className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-1"
            >
              Learning Curriculum
            </button>
            <button
              onClick={() => scrollToSection('roles')}
              className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-1"
            >
              Role Viewports
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-1"
            >
              Features Architecture
            </button>
            <button
              onClick={() => scrollToSection('analytics')}
              className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-1"
            >
              Performance Analytics
            </button>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
<<<<<<< HEAD
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-slate-300 hover:text-white text-sm font-medium"
                  >
                    Login
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleGetStarted();
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleGetStarted();
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
                    <span>{getDashboardLabel(user?.role)}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-rose-400 hover:text-rose-300 text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </>
              )}
=======
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white text-sm font-medium"
              >
                Login
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleGetStarted();
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Get Started
              </button>
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full pt-[72px] min-h-[calc(100vh-72px)]">
        <div className="flex flex-col w-full">
          {/* HERO SECTION (DARK NAVY / HIGH SAAS POLISH) */}
          <section className="relative bg-[#070D1A] text-white overflow-hidden py-16 lg:py-24 border-b border-white/[0.08]">
            {/* Radial Atmospheric Glows */}
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[680px] h-[680px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute -left-20 -top-20 w-[460px] h-[460px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* High precision grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>

            <div className="relative max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[640px]">
              {/* HERO LEFT COLUMN (~48%) */}
              <div className="lg:col-span-6 flex flex-col justify-center z-10">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 self-start backdrop-blur-md shadow-inner shadow-white/5 mb-6 hover:border-indigo-500/40 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-pulse"></span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    LEARN • PRACTICE • GROW TOGETHER
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] leading-[1.12] font-bold text-white tracking-tight">
                  Build Skills.<br />
                  Build the{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-300">
                    Future.
                  </span>
                </h1>

                {/* Supporting Copy */}
                <p className="text-base sm:text-lg text-slate-300 max-w-lg mt-5 leading-relaxed font-normal">
                  A centralized learning and performance platform for C4GT KIET HUB — connecting Machine Learning, DSA, tasks, resources and team growth.
                </p>

                {/* Actions Row */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:translate-y-0.5 cursor-pointer"
                  >
<<<<<<< HEAD
                    <span>{isAuthenticated ? getDashboardLabel(user?.role) : 'Get Started'}</span>
=======
                    <span>Get Started</span>
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="inline-flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/15 px-6 py-3.5 rounded-xl font-semibold text-sm backdrop-blur-sm transition-all cursor-pointer"
                  >
                    <span>Explore Platform</span>
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  </button>
                </div>

                {/* Trust Indicator */}
                <div className="text-slate-400 font-mono text-xs mt-6 flex items-center gap-2 tracking-wide">
                  <span className="text-indigo-400 font-bold">⊕</span>
                  <span>Built for Junior Developers & Developer Interns</span>
                </div>
              </div>

              {/* HERO RIGHT COLUMN (~52%) - Crisp Glass Floating Window */}
              <div className="lg:col-span-6 relative">
                <div className="w-full bg-[#0D1527]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden transition-all hover:border-indigo-500/40">
                  {/* Mockup Titlebar */}
                  <div className="bg-[#0B1220] px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#ef4444]/90 inline-block shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-[#f59e0b]/90 inline-block shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-[#10b981]/90 inline-block shadow-sm"></span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#070D1A] px-3 py-1 rounded-md border border-white/10 text-slate-300 font-mono text-xs max-w-[240px] truncate">
                      <span className="material-symbols-outlined text-[13px] text-indigo-400">lock</span>
                      <span className="text-slate-300 font-medium">hub.c4gt-kiet.in/sprint-04</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-medium">
                      Cohort 2026-A
                    </span>
                  </div>

                  {/* Mockup Body: Left Mini-Nav + Main Telemetry */}
                  <div className="grid grid-cols-12 min-h-[380px]">
                    {/* Mini-Sidebar */}
                    <div className="col-span-2 bg-[#09101E] border-r border-white/[0.08] p-2.5 flex flex-col justify-between items-center">
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div
                          className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/30"
                          title="Dashboard"
                        >
                          <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        </div>
                        <div
                          onClick={() => scrollToSection('curriculum')}
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="ML Pipeline"
                        >
                          <span className="material-symbols-outlined text-[18px]">neurology</span>
                        </div>
                        <div
                          onClick={() => scrollToSection('curriculum')}
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="DSA Trees"
                        >
                          <span className="material-symbols-outlined text-[18px]">account_tree</span>
                        </div>
                        <div
                          onClick={() => scrollToSection('features')}
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="Tasks"
                        >
                          <span className="material-symbols-outlined text-[18px]">checklist</span>
                        </div>
                        <div
                          onClick={() => scrollToSection('analytics')}
                          className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="Analytics"
                        >
                          <span className="material-symbols-outlined text-[18px]">insights</span>
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                        title="Settings"
                      >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="col-span-10 p-4 bg-[#0D1527] space-y-3.5">
                      {/* Content Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-sm font-semibold text-white tracking-tight">Sprint 04 Telemetry</span>
                        </div>
                        <span className="font-mono text-xs text-slate-400">Live sync • PR #14 merged</span>
                      </div>

                      {/* 4 KPI Cards */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08]">
                          <span className="font-mono text-[10px] text-slate-400 block uppercase font-medium">
                            Total Students
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xl font-bold text-white">48</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-semibold">+12%</span>
                          </div>
                        </div>

                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08]">
                          <span className="font-mono text-[10px] text-slate-400 block uppercase font-medium">
                            Active Tasks
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xl font-bold text-white">32</span>
                            <span className="font-mono text-[10px] text-amber-400 font-semibold">8 urgent</span>
                          </div>
                        </div>

                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08]">
                          <span className="font-mono text-[10px] text-slate-400 block uppercase font-medium">
                            Completion
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xl font-bold text-indigo-400">78%</span>
                          </div>
                          <div className="w-full h-1 bg-white/[0.1] rounded-full mt-1.5 overflow-hidden">
                            <div className="w-[78%] h-full bg-indigo-500 rounded-full"></div>
                          </div>
                        </div>

                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08]">
                          <span className="font-mono text-[10px] text-slate-400 block uppercase font-medium">
                            Avg Velocity
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-xl font-bold text-white">92.4</span>
                            <span className="font-mono text-[10px] text-slate-400">pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Chart Preview */}
                      <div className="bg-[#111C33] p-3 rounded-lg border border-white/[0.08]">
                        <div className="flex items-center justify-between text-xs mb-2 font-mono">
                          <span className="text-slate-200 font-medium">Task Completion Overview</span>
                          <span className="text-indigo-400 font-semibold">S1 → S4 Trend</span>
                        </div>
                        {/* Inline Minimal SVG Area Chart */}
                        <svg className="w-full h-[80px] overflow-visible" viewBox="0 0 460 90">
                          <defs>
                            <linearGradient id="heroChartGrad" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5"></stop>
                              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0"></stop>
                            </linearGradient>
                          </defs>
                          {/* Horizontal Gridlines */}
                          <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="460" y1="20" y2="20"></line>
                          <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="460" y1="50" y2="50"></line>
                          <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="460" y1="80" y2="80"></line>
                          {/* Area Fill */}
                          <path d="M0,75 C70,68 130,45 200,42 C270,39 340,18 460,8 L460,90 L0,90 Z" fill="url(#heroChartGrad)"></path>
                          {/* Line */}
                          <path d="M0,75 C70,68 130,45 200,42 C270,39 340,18 460,8" fill="none" stroke="#818CF8" strokeWidth="2.5"></path>
                          {/* Data Points */}
                          <circle cx="0" cy="75" fill="#818CF8" r="3.5" stroke="#0B1220" strokeWidth="1.5"></circle>
                          <circle cx="150" cy="50" fill="#818CF8" r="3.5" stroke="#0B1220" strokeWidth="1.5"></circle>
                          <circle cx="300" cy="30" fill="#818CF8" r="3.5" stroke="#0B1220" strokeWidth="1.5"></circle>
                          <circle cx="460" cy="8" fill="#4F46E5" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
                        </svg>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-1">
                          <span>Sprint 01</span>
                          <span>Sprint 02</span>
                          <span>Sprint 03</span>
                          <span className="text-indigo-400 font-semibold">Sprint 04 (Active)</span>
                        </div>
                      </div>

                      {/* Split Bottom Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Deadlines */}
                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08] space-y-1.5">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold block">
                            Upcoming Deadlines
                          </span>
                          <div className="flex items-center justify-between text-slate-200">
                            <span className="truncate pr-1">ML Deployment (BERT)</span>
                            <span className="text-amber-400 font-mono text-[11px] whitespace-nowrap font-medium">
                              8:00 PM
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-200">
                            <span className="truncate pr-1">Graph BFS/DFS Practice</span>
                            <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">Tomorrow</span>
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#111C33] p-2.5 rounded-lg border border-white/[0.08] space-y-1.5">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold block">
                            Recent Activity
                          </span>
                          <div className="truncate text-slate-200 font-mono text-[11px]">
                            <span className="text-indigo-400 font-semibold">#f82a</span> by @rohit{' '}
                            <span className="text-slate-400">(PR #14)</span>
                          </div>
                          <div className="truncate text-slate-200 font-mono text-[11px]">
                            <span className="text-emerald-400 font-semibold">✓</span> completed by @anjali (Trie lookup)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TRUST / FEATURE STRIP (CRISP LIGHT SURFACE) */}
          <section className="w-full bg-[#F8FAFC] border-y border-slate-200 py-10 transition-colors">
            <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-slate-200">
              {/* Feature 1 */}
              <div className="flex items-start gap-4 lg:pr-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">neurology</span>
                </div>
                <div>
                  <h2 className="text-[16px] text-slate-900 font-semibold tracking-tight">Machine Learning</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-normal">
                    End-to-end model training, PyTorch pipelines & MLOps.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 lg:px-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">account_tree</span>
                </div>
                <div>
                  <h2 className="text-[16px] text-slate-900 font-semibold tracking-tight">DSA & Algorithms</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-normal">
                    Pattern-oriented problem solving with visual trees & graphs.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 lg:px-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">fact_check</span>
                </div>
                <div>
                  <h2 className="text-[16px] text-slate-900 font-semibold tracking-tight">Tasks & Deadlines</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-normal">
                    Strict milestone tracking, Git webhooks & PR reviews.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-4 lg:pl-6">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">leaderboard</span>
                </div>
                <div>
                  <h2 className="text-[16px] text-slate-900 font-semibold tracking-tight">Team Performance</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-normal">
                    Granular cohort metrics, velocity scoring & leaderboards.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURE SECTION: Workflow Architecture (CRISP PURE WHITE CARDS ON SOFT OFF-WHITE) */}
          <section className="w-full bg-[#F8FAFC] py-24 relative border-b border-slate-200" id="features">
            <div className="max-w-[1240px] mx-auto px-6">
              {/* Centered Header */}
              <div className="text-center max-w-2xl mx-auto">
                <div className="font-mono text-xs uppercase text-indigo-600 font-semibold tracking-widest bg-indigo-50 border border-indigo-100 inline-block px-3 py-1 rounded-full">
                  WORKFLOW ARCHITECTURE
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
                  Everything your learning journey needs.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 mt-3">
                  One connected platform for learning, practicing and measuring progress.
                </p>
              </div>

              {/* 4 Premium Feature Cards in ONE Horizontal Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
                {/* CARD 1 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        01
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">menu_book</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Learning Resources
                    </h3>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      Access notes, PDFs, videos and useful references in one place.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Curated Notes
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Paper Summaries
                    </span>
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        02
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">terminal</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Task Management
                    </h3>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      Practice through structured tasks designed for continuous improvement.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Micro-Services
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Automated Tests
                    </span>
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        03
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">timer</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Deadline Tracking
                    </h3>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      Stay on top of deadlines and never lose track of assigned work.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Sprint Sync
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Git Activity
                    </span>
                  </div>
                </div>

                {/* CARD 4 */}
                <div className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        04
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">monitoring</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Performance Analytics
                    </h3>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      Understand team and individual progress through clear analytics.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Velocity Radar
                    </span>
                    <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Skill Benchmarks
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* LEARNING PROGRAMS (CRISP HYBRID CARDS) */}
          <section className="w-full bg-[#FFFFFF] py-24 relative border-b border-slate-200" id="curriculum">
            <div className="max-w-[1240px] mx-auto px-6">
              {/* Centered Header */}
              <div className="text-center max-w-2xl mx-auto">
                <div className="font-mono text-xs uppercase text-indigo-600 font-semibold tracking-widest bg-indigo-50 border border-indigo-100 inline-block px-3 py-1 rounded-full">
                  CURRICULUM TRACKS
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
                  Built around practical learning.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 mt-3">
                  Deep dive into industry-tested tracks engineered to transition students into seasoned open-source contributors.
                </p>
              </div>

              {/* Two Large Horizontal Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-14">
                {/* CARD 1: Machine Learning */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between hover:border-indigo-400">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                        Active Track • 12 Sprints
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">model_training</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">Machine Learning</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Build strong foundations through structured sessions, notes and practical learning resources.
                    </p>
                    {/* Crisp Developer Terminal Console */}
                    <div className="mt-6 bg-[#0B1220] rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                        </div>
                        <span className="text-slate-400 text-[11px]">train_classifier.py</span>
                        <span className="text-emerald-400 font-mono text-[11px] font-semibold">✓ Epoch 10/10</span>
                      </div>
                      <div className="text-slate-300 space-y-1.5 leading-normal">
                        <div>
                          <span className="text-indigo-400 font-semibold">import</span> torch.nn{' '}
                          <span className="text-indigo-400 font-semibold">as</span> nn
                        </div>
                        <div>model = Sequential([</div>
                        <div className="pl-4">
                          Dense(<span className="text-amber-300">128</span>, activation=
                          <span className="text-emerald-400">'relu'</span>),
                        </div>
                        <div className="pl-4">
                          Dropout(<span className="text-amber-300">0.2</span>),
                        </div>
                        <div className="pl-4">
                          Dense(<span className="text-amber-300">10</span>)
                        </div>
                        <div>])</div>
                        <div className="pt-2 text-indigo-300 font-medium flex justify-between border-t border-slate-800/80 mt-2">
                          <span>
                            Validation Loss: <span className="text-white font-bold">0.0142</span>
                          </span>
                          <span>
                            Accuracy: <span className="text-emerald-400 font-bold">98.4%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Notes
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Resources
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Tasks
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        PyTorch
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        HuggingFace
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handleGetStarted}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <span>Explore ML</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <span className="font-mono text-xs text-slate-500">Weekly Sync • Thursdays</span>
                  </div>
                </div>

                {/* CARD 2: Data Structures & Algorithms */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between hover:border-indigo-400">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                        Core Track • 10 Sprints
                      </span>
                      <span className="material-symbols-outlined text-indigo-600 text-[26px]">schema</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">
                      Data Structures & Algorithms
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Strengthen problem-solving skills through structured DSA sessions, practice tasks and references.
                    </p>
                    {/* Visual algorithm snippet inside card: Tree Graph SVG */}
                    <div className="mt-6 bg-[#0B1220] rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-hidden flex flex-col items-center justify-center min-h-[168px] shadow-inner">
                      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="text-slate-400 text-[11px]">traversal_visualizer.dag</span>
                        <span className="text-indigo-400 text-[11px] font-mono font-medium">
                          BFS Level-Order [42, 18, 64, 12, 29]
                        </span>
                      </div>
                      <svg className="w-full h-[86px] max-w-[320px]" viewBox="0 0 320 86">
                        {/* Edges */}
                        <line stroke="#334155" strokeWidth="2" x1="160" x2="100" y1="16" y2="52"></line>
                        <line stroke="#334155" strokeWidth="2" x1="160" x2="220" y1="16" y2="52"></line>
                        <line stroke="#334155" strokeDasharray="2 2" strokeWidth="1.5" x1="100" x2="60" y1="52" y2="80"></line>
                        <line stroke="#334155" strokeDasharray="2 2" strokeWidth="1.5" x1="100" x2="130" y1="52" y2="80"></line>
                        {/* Active Traversal Pulse Edge */}
                        <line stroke="#818CF8" strokeDasharray="4 4" strokeWidth="2" x1="160" x2="100" y1="16" y2="52"></line>
                        {/* Root Node */}
                        <circle cx="160" cy="16" fill="#4F46E5" r="14" stroke="#818CF8" strokeWidth="2"></circle>
                        <text fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="middle" x="160" y="20">
                          42
                        </text>
                        {/* Left Node */}
                        <circle cx="100" cy="52" fill="#1E293B" r="12" stroke="#818CF8" strokeWidth="1.5"></circle>
                        <text fill="#E2E8F0" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="100" y="56">
                          18
                        </text>
                        {/* Right Node */}
                        <circle cx="220" cy="52" fill="#1E293B" r="12" stroke="#475569" strokeWidth="1.5"></circle>
                        <text fill="#94A3B8" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="220" y="56">
                          64
                        </text>
                        {/* Leaves */}
                        <circle cx="60" cy="80" fill="#0F172A" r="6" stroke="#475569"></circle>
                        <circle cx="130" cy="80" fill="#0F172A" r="6" stroke="#475569"></circle>
                      </svg>
                    </div>
                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        DSA Notes
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Practice Tasks
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        Progress Tracking
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        DP & Trees
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handleGetStarted}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <span>Explore DSA</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <span className="font-mono text-xs text-slate-500">Daily Problem Sets</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ROLE SECTION (HIGH CONTRAST CLEAN WHITE CARDS WITH CRISP ROLE BADGES) */}
          <section className="w-full bg-[#F8FAFC] py-24 border-b border-slate-200" id="roles">
            <div className="max-w-[1240px] mx-auto px-6">
              {/* Centered Header */}
              <div className="text-center max-w-2xl mx-auto">
                <div className="font-mono text-xs uppercase text-indigo-600 font-semibold tracking-widest bg-indigo-50 border border-indigo-100 inline-block px-3 py-1 rounded-full">
                  TAILORED VIEWPORTS
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 tracking-tight">
                  Designed for every role.
                </h2>
                <p className="text-base sm:text-lg text-slate-600 mt-3">
                  Custom operational surfaces providing relevant telemetry for students, leaders, and program overseers.
                </p>
              </div>

              {/* 3 Equal Cards in a single horizontal row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
                {/* CARD 1: Admin */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-6 shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Admin</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Manage users, learning content, tasks and platform activity.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Curate master syllabus</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Assign reviewers</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Manage cohort permissions</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors group"
                    >
                      <span>Manage Platform</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                {/* CARD 2: Team Lead */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">groups</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Team Lead</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Monitor team performance and identify members who need attention.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Unblock peer PRs</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Monitor sprint velocity</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Schedule 1:1 check-ins</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <Link
                      to="/team-lead"
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors group"
                    >
                      <span>Lead Workspace</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                {/* CARD 3: Student */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-200">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-6 shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">school</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Student</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Access learning materials, complete tasks and track your progress.
                    </p>
                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Submit task PRs</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Review mentor feedback</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                        <span>Track percentile rank</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleGetStarted}
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors group cursor-pointer"
                    >
                      <span>Student Console</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ANALYTICS SHOWCASE (HIGH-END DARK COMMAND CENTER WITH VIBRANT CHARTS) */}
          <section className="w-full bg-[#070D1A] py-24 relative overflow-hidden text-white" id="analytics">
            {/* Subtle Background Glow and Fine Grid */}
            <div className="absolute left-1/3 bottom-10 w-[520px] h-[520px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

            <div className="relative max-w-[1240px] mx-auto px-6">
              {/* Centered Header */}
              <div className="text-center max-w-2xl mx-auto">
                <div className="font-mono text-xs uppercase text-indigo-400 font-semibold tracking-widest bg-white/[0.05] border border-white/10 inline-block px-3 py-1 rounded-full">
                  PERFORMANCE INTELLIGENCE
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
                  Turn learning activity into insight.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 mt-2">
                  Understand progress at both team and individual levels.
                </p>
              </div>

              {/* 2-Column Analytics Layout (Left 35%, Right 65%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-14 items-center">
                {/* LEFT SIDE: 3 Stacked Insight Cards (35%) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Insight 1 */}
                  <div className="bg-[#0D1527] p-6 rounded-2xl border border-white/[0.1] shadow-lg hover:border-indigo-500/40 transition-colors">
                    <div className="text-4xl lg:text-[44px] leading-none font-bold text-indigo-400 tabular-nums">
                      78%
                    </div>
                    <h4 className="text-base font-semibold text-white mt-2">Overall completion rate</h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                      Across 4 active technical tracks and 48 enrolled junior devs.
                    </p>
                  </div>

                  {/* Insight 2 */}
                  <div className="bg-[#0D1527] p-6 rounded-2xl border border-white/[0.1] shadow-lg hover:border-indigo-500/40 transition-colors">
                    <div className="text-4xl lg:text-[44px] leading-none font-bold text-emerald-400 tabular-nums">
                      +12%
                    </div>
                    <h4 className="text-base font-semibold text-white mt-2">Improvement this month</h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                      Sprint completion velocity exceeded benchmark targets.
                    </p>
                  </div>

                  {/* Insight 3 */}
                  <div className="bg-[#0D1527] p-6 rounded-2xl border border-white/[0.1] shadow-lg hover:border-indigo-500/40 transition-colors">
                    <div className="text-4xl lg:text-[44px] leading-none font-bold text-amber-400 tabular-nums">
                      3
                    </div>
                    <h4 className="text-base font-semibold text-white mt-2">Members need attention</h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                      Flagged automatically due to pending PR reviews &gt; 48hrs.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE: Large High-Fidelity Analytics Dashboard (65%) */}
                <div className="lg:col-span-8 bg-[#0D1527]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-7 shadow-2xl">
                  {/* Top Row Tabs */}
                  <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 bg-[#070D1A] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
                      <button
                        onClick={() => setActiveTab('trend')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                          activeTab === 'trend'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Completion Trend
                      </button>
                      <button
                        onClick={() => setActiveTab('team')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                          activeTab === 'team'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Team Comparison
                      </button>
                      <button
                        onClick={() => setActiveTab('member')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                          activeTab === 'member'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Member Performance
                      </button>
                      <button
                        onClick={() => setActiveTab('status')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                          activeTab === 'status'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Task Status
                      </button>
                    </div>
                    <span className="font-mono text-xs text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Cohort S4 (Real-time)
                    </span>
                  </div>

                  {/* TAB 1: COMPLETION TREND */}
                  {activeTab === 'trend' && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">Sprint Velocity & Completion Trend</h4>
                          <p className="text-xs text-slate-400">Benchmark goal vs actual completed story points</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="inline-flex items-center gap-1.5 text-indigo-400 font-medium">
                            <span className="w-3 h-0.5 bg-indigo-400 inline-block"></span> Actual
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <span className="w-3 h-0.5 bg-slate-500 border-dashed inline-block"></span> Target
                          </span>
                        </div>
                      </div>

                      {/* SVG Velocity Chart with Gradient */}
                      <div className="w-full bg-[#070D1A] p-4 rounded-xl border border-white/[0.08]">
                        <svg className="w-full h-[140px] overflow-visible" viewBox="0 0 680 140">
                          <defs>
                            <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45"></stop>
                              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0"></stop>
                            </linearGradient>
                          </defs>
                          {/* Horizontal Grids */}
                          <line stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="680" y1="30" y2="30"></line>
                          <line stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="680" y1="75" y2="75"></line>
                          <line stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth="0.5" x1="0" x2="680" y1="120" y2="120"></line>
                          {/* Target Benchmark Line (dashed) */}
                          <line stroke="#64748B" strokeDasharray="5 5" strokeWidth="1.5" x1="40" x2="640" y1="110" y2="35"></line>
                          {/* Actual Performance Curve with Area Fill */}
                          <path d="M40,115 C180,105 240,70 380,55 C480,45 560,25 640,15 L640,135 L40,135 Z" fill="url(#trendGrad)"></path>
                          <path d="M40,115 C180,105 240,70 380,55 C480,45 560,25 640,15" fill="none" stroke="#818CF8" strokeWidth="3"></path>
                          {/* Points */}
                          <circle cx="40" cy="115" fill="#818CF8" r="4"></circle>
                          <circle cx="240" cy="78" fill="#818CF8" r="4"></circle>
                          <circle cx="440" cy="48" fill="#818CF8" r="4"></circle>
                          <circle cx="640" cy="15" fill="#4F46E5" r="5" stroke="#ffffff" strokeWidth="2"></circle>
                        </svg>
                        <div className="flex justify-between text-xs text-slate-400 font-mono mt-2 px-6">
                          <span>Sprint 1</span>
                          <span>Sprint 2</span>
                          <span>Sprint 3</span>
                          <span className="text-indigo-400 font-bold">Sprint 4 (Current)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TEAM COMPARISON */}
                  {activeTab === 'team' && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">Team Velocity & Completion Metrics</h4>
                        <span className="text-xs text-slate-400 font-mono">Ranked by story points</span>
                      </div>
                      <div className="bg-[#070D1A] p-4 rounded-xl border border-white/[0.08] space-y-3 font-mono text-xs">
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Alpha (ML Core)</span>
                            <span className="text-indigo-400 font-bold">92% • 120 pts</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[92%] h-full bg-indigo-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Beta (DSA Algo)</span>
                            <span className="text-violet-400 font-bold">84% • 104 pts</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[84%] h-full bg-violet-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Gamma (Backend Infra)</span>
                            <span className="text-sky-400 font-bold">76% • 92 pts</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[76%] h-full bg-sky-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Delta (Frontend UI)</span>
                            <span className="text-amber-400 font-bold">68% • 80 pts</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[68%] h-full bg-amber-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MEMBER PERFORMANCE */}
                  {activeTab === 'member' && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">Top Cohort Performers</h4>
                        <span className="text-xs text-indigo-400 font-mono">Live PR leaderboard</span>
                      </div>
                      <div className="bg-[#070D1A] p-4 rounded-xl border border-white/[0.08] space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0D1527] rounded-lg border border-white/[0.05]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-amber-400 font-bold">#1</span>
                            <span className="text-white font-semibold">@rohit_dev</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-400">
                            <span>18 PRs Merged</span>
                            <span className="text-emerald-400 font-bold">🔥 14 day streak</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0D1527] rounded-lg border border-white/[0.05]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-slate-300 font-bold">#2</span>
                            <span className="text-white font-semibold">@anjali_ml</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-400">
                            <span>15 PRs Merged</span>
                            <span className="text-emerald-400 font-bold">🔥 12 day streak</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#0D1527] rounded-lg border border-white/[0.05]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-amber-600 font-bold">#3</span>
                            <span className="text-white font-semibold">@priya_code</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-400">
                            <span>12 PRs Merged</span>
                            <span className="text-emerald-400 font-bold">🔥 9 day streak</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TASK STATUS */}
                  {activeTab === 'status' && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-white">Sprint 04 Task Distribution</h4>
                        <span className="text-xs text-slate-400 font-mono">184 total assigned</span>
                      </div>
                      <div className="bg-[#070D1A] p-4 rounded-xl border border-white/[0.08] space-y-4">
                        <div className="flex h-4 w-full rounded-full overflow-hidden gap-1 bg-slate-800">
                          <div className="w-[75%] bg-emerald-400" title="75% Completed"></div>
                          <div className="w-[15%] bg-amber-400" title="15% In Review"></div>
                          <div className="w-[10%] bg-slate-500" title="10% Pending"></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-2 font-mono text-xs">
                          <div className="bg-[#0D1527] p-2 rounded-lg border border-white/5">
                            <span className="block text-emerald-400 font-bold text-xl">142</span>
                            <span className="text-slate-400 text-[10px] uppercase">Completed</span>
                          </div>
                          <div className="bg-[#0D1527] p-2 rounded-lg border border-white/5">
                            <span className="block text-amber-400 font-bold text-xl">28</span>
                            <span className="text-slate-400 text-[10px] uppercase">In Review</span>
                          </div>
                          <div className="bg-[#0D1527] p-2 rounded-lg border border-white/5">
                            <span className="block text-slate-400 font-bold text-xl">14</span>
                            <span className="text-slate-500 text-[10px] uppercase">Pending</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Split Bottom Area of Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Sub-chart: Team Progress Benchmark */}
                    <div className="bg-[#070D1A] p-4 rounded-xl border border-white/[0.08]">
                      <h5 className="text-xs font-semibold text-slate-200 mb-3 font-mono uppercase tracking-wider">
                        Team Progress Benchmark
                      </h5>
                      <div className="space-y-3 font-mono text-xs">
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Alpha (ML Core)</span>
                            <span className="text-indigo-400 font-bold">92%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[92%] h-full bg-indigo-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Beta (DSA Algo)</span>
                            <span className="text-violet-400 font-bold">84%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[84%] h-full bg-violet-500 rounded-full"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1 text-slate-300">
                            <span>Team Gamma (Backend Infra)</span>
                            <span className="text-sky-400 font-bold">76%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="w-[76%] h-full bg-sky-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-chart: Task Status Breakdown */}
                    <div className="bg-[#070D1A] p-4 rounded-xl border border-white/[0.08] flex flex-col justify-between">
                      <div>
                        <h5 className="text-xs font-semibold text-slate-200 mb-3 font-mono uppercase tracking-wider">
                          Task Status Breakdown
                        </h5>
                        <div className="flex h-3 w-full rounded-full overflow-hidden gap-1 bg-slate-800">
                          <div className="w-[75%] bg-emerald-400" title="Completed"></div>
                          <div className="w-[15%] bg-amber-400" title="In Review"></div>
                          <div className="w-[10%] bg-slate-500" title="Pending"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-3 mt-2 border-t border-white/[0.08] font-mono text-xs">
                        <div>
                          <span className="block text-emerald-400 font-bold text-lg">142</span>
                          <span className="text-slate-400 text-[10px] uppercase">Completed</span>
                        </div>
                        <div>
                          <span className="block text-amber-400 font-bold text-lg">28</span>
                          <span className="text-slate-400 text-[10px] uppercase">In Review</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-bold text-lg">14</span>
                          <span className="text-slate-500 text-[10px] uppercase">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA SECTION (CLEAN AUTHORITATIVE DARK NAVY WITH ELECTRIC ACCENT) */}
          <section className="w-full bg-gradient-to-b from-[#070D1A] via-[#0B1220] to-[#070D1A] py-24 text-center border-t border-white/[0.08] relative overflow-hidden">
            {/* Center Ambient Glow */}
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-[520px] h-[340px] bg-indigo-600/15 rounded-full blur-[110px] pointer-events-none"></div>

            <div className="relative max-w-3xl mx-auto px-6">
              {/* Glowing Circle Icon */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
              </div>
              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-6 tracking-tight">
                Ready to grow together?
              </h2>
              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
                Bring learning, practice and performance into one place. Empower your junior developers with structured workflows.
              </p>
              {/* Buttons Row */}
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:translate-y-0.5 cursor-pointer"
                >
<<<<<<< HEAD
                  <span>{isAuthenticated ? getDashboardLabel(user?.role) : 'Get Started'}</span>
=======
                  <span>Get Started</span>
>>>>>>> 17540aa55c6b225de4fa15112d148e7917359705
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center border border-white/15 hover:bg-white/[0.08] text-white px-8 py-3.5 rounded-xl font-semibold text-sm backdrop-blur-sm transition-all cursor-pointer"
                >
                  <span>Explore Platform</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER (PROFESSIONAL SLATE/NAVY FOOTER WITH HIGH READABILITY) */}
      <footer className="w-full bg-[#050914] border-t border-white/[0.08] py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-white/[0.08]">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[17px]">hub</span>
                </div>
                <span className="text-lg text-white font-bold tracking-tight">C4GT KIET HUB</span>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  HUB
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Learn. Practice. Grow Together. An open-source and developer-enablement cohort driving technical excellence and high-impact digital public goods.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  aria-label="Community Forum"
                  className="w-9 h-9 rounded-lg bg-[#0D1527] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-400 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                </a>
                <a
                  href="#"
                  aria-label="Code Repository"
                  className="w-9 h-9 rounded-lg bg-[#0D1527] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-400 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                </a>
                <a
                  href="#"
                  aria-label="Community Hub"
                  className="w-9 h-9 rounded-lg bg-[#0D1527] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-400 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-semibold">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button onClick={() => scrollToSection('curriculum')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Learning
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('roles')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Teams
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('analytics')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Analytics
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-semibold">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button onClick={() => scrollToSection('curriculum')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Notes
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('curriculum')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Reference Links
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    Tasks
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-semibold">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    About
                  </button>
                </li>
                <li>
                  <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider font-semibold">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
            <div>© 2026 C4GT KIET HUB. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                All Systems Operational
              </span>
              <span>v2.4.0-kiet</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
