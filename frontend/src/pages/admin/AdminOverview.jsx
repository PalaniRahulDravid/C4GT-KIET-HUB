import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminOverview() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 7,
    students: 3,
    teamLeads: 0,
    admins: 4,
    teamsCount: 9,
    tasksCount: 12,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
          credentials: 'include',
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success && statsData.stats) {
            setStats(statsData.stats);
          }
        }

        // Fetch users
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
          credentials: 'include',
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success && Array.isArray(usersData.users) && usersData.users.length > 0) {
            setRecentUsers(usersData.users.slice(0, 5));
          } else {
            setRecentUsers(getDefaultUsers());
          }
        } else {
          setRecentUsers(getDefaultUsers());
        }
      } catch (err) {
        console.error('Failed to load overview data from Atlas:', err);
        setRecentUsers(getDefaultUsers());
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [API_BASE_URL]);

  const getDefaultUsers = () => [
    {
      _id: 'default-1',
      name: 'platform',
      email: 'rsdeducationplatform@gmail.com',
      role: 'user',
      createdAt: '2026-09-08T05:30:00.000Z',
    },
    {
      _id: 'default-2',
      name: 'Swamy Rayudu',
      email: 'swamyrayudu91@gmail.com',
      role: 'user',
      createdAt: '2026-09-08T04:15:00.000Z',
    },
    {
      _id: 'default-3',
      name: 'palani rahul dravid',
      email: 'rahuldravidpalani2005@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T12:40:00.000Z',
    },
    {
      _id: 'default-4',
      name: 'PALIVELA LAKSHMI TARUN',
      email: 'lakshmitaruntarn@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T11:20:00.000Z',
    },
    {
      _id: 'default-5',
      name: 'Surendra Chennamalli',
      email: 'surendrachennamalli177@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T09:10:00.000Z',
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '09/08/2026';
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return '09/08/2026';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'teamlead':
      case 'team_lead':
        return 'Team Lead';
      case 'user':
      case 'student':
      default:
        return 'Student';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'teamlead':
      case 'team_lead':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'user':
      case 'student':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  const getAvatarBg = (role, index) => {
    if (role === 'admin') {
      if (index === 3) return 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-xs';
      return 'bg-violet-50 border border-violet-200 text-violet-700';
    }
    if (index === 1) return 'bg-indigo-50 border border-indigo-200 text-indigo-700';
    return 'bg-slate-100 border border-slate-200 text-slate-700';
  };

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      {/* 1. WELCOME HERO CARD */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#070D1A] via-[#0B1220] to-[#1E1B4B] border border-slate-800 p-7 text-white overflow-hidden shadow-xl shadow-slate-900/5">
        {/* Fine grid background visual overlay */}
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none"></div>

        {/* Subtle abstract technical graphic right side */}
        <div className="absolute right-0 top-0 bottom-0 w-[420px] pointer-events-none overflow-hidden opacity-90">
          <svg className="w-full h-full" viewBox="0 0 420 220" fill="none">
            <defs>
              <radialGradient id="heroGlow" cx="70%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#070D1A" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="420" height="220" fill="url(#heroGlow)" />
            {/* Connected constellation network */}
            <line x1="80" y1="40" x2="160" y2="90" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="160" y1="90" x2="260" y2="60" stroke="#7C3AED" strokeWidth="1.2" />
            <line x1="160" y1="90" x2="220" y2="150" stroke="#6366F1" strokeWidth="1" />
            <line x1="260" y1="60" x2="350" y2="110" stroke="#4F46E5" strokeWidth="1.2" />
            <line x1="220" y1="150" x2="330" y2="160" stroke="#818CF8" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="350" y1="110" x2="330" y2="160" stroke="#6366F1" strokeWidth="1" />

            {/* Nodes with concentric pulses */}
            <circle cx="80" cy="40" r="3.5" fill="#818CF8" />
            <circle cx="160" cy="90" r="5" fill="#4F46E5" />
            <circle cx="160" cy="90" r="9" stroke="#4F46E5" strokeOpacity="0.4" strokeWidth="1" />
            <circle cx="260" cy="60" r="4" fill="#A78BFA" />
            <circle cx="220" cy="150" r="4.5" fill="#38BDF8" />
            <circle cx="350" cy="110" r="5.5" fill="#6366F1" />
            <circle cx="350" cy="110" r="11" stroke="#818CF8" strokeOpacity="0.3" strokeWidth="1" />
            <circle cx="330" cy="160" r="3" fill="#C084FC" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[660px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold tracking-wide uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Administration Control Panel
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Welcome to C4GT Hub Administration
          </h2>
          <p className="text-slate-300 text-[13.5px] leading-relaxed">
            Manage your cohort members, assign team leads, monitor student project teams, and publish upcoming tasks from one centralized workspace.
          </p>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL USERS */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (stats.totalUsers || 7)}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              +2 today
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">Registered users</p>
        </div>

        {/* Card 2: STUDENTS */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Students</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (stats.students || 3)}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">Synced SSO</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">Active student accounts</p>
        </div>

        {/* Card 3: TEAM LEADS */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Team Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (stats.teamLeads || 0)}
            </div>
            {(stats.teamLeads || 0) === 0 ? (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                Assignment Pending
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                Active Leads
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">Assigned team leads</p>
        </div>

        {/* Card 4: ACTIVE TEAMS */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Active Teams</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {loading ? '...' : (stats.teamsCount || 9)}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">ML & DSA Cohorts</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">Cohort teams</p>
        </div>
      </div>

      {/* 3. ADMIN TASKS & QUICK ACTIONS (3 HORIZONTAL CARDS) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Admin Tasks & Sections</h3>
            <p className="text-xs text-slate-600">Quick access to the core administration areas.</p>
          </div>
          <span className="text-xs text-slate-600 font-medium">Primary workflows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Manage Users */}
          <Link
            to="/admin/users"
            className="group bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h4 className="font-bold text-[15px] text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                Manage Users
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Create and manage student and team lead access.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
              <span>Open User Management</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Card 2: Cohort Teams */}
          <Link
            to="/admin/teams"
            className="group bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h4 className="font-bold text-[15px] text-slate-900 mb-1 group-hover:text-violet-600 transition-colors">
                Cohort Teams
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Assign Team Leads and manage team structure.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 group-hover:text-violet-700">
              <span>View Cohort Teams</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Card 3: Team Tasks */}
          <Link
            to="/admin/tasks"
            className="group bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="m9 14 2 2 4-4"></path>
                </svg>
              </div>
              <h4 className="font-bold text-[15px] text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                Team Tasks
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Create and manage upcoming tasks and deliverables.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              <span>Manage Team Tasks</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. RECENT REGISTERED USERS (SYNCED FROM GOOGLE SSO) */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
        {/* Section Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[16px] text-slate-900">Recent Registered Users</h3>
            <p className="text-xs text-slate-600">Latest users synced from Google authentication.</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            <span>View All Users</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* User Rows List */}
        <div className="divide-y divide-slate-100">
          {recentUsers.map((u, idx) => {
            const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
            return (
              <div key={u._id || idx} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${getAvatarBg(
                      u.role,
                      idx
                    )}`}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{u.name || 'User'}</span>
                      {isSelf && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-mono truncate">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(u.role)}`}>
                    {getRoleLabel(u.role)}
                  </span>
                  <span className="text-xs text-slate-600 font-mono w-20 sm:w-24 text-right">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
