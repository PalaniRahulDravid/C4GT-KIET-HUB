import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  ListTodo,
  TrendingUp,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Flame,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileCode,
  FileText,
  Video,
  LogOut,
  Home,
  ShieldCheck,
  Menu,
  X,
  User,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, logout, apiBaseUrl } = useAuth();
  const navigate = useNavigate();

  // Mobile sidebar visibility toggle state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Profile Details Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Active Sidebar Navigation State: ONLY Dashboard, My Tasks, Resources, Progress
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'my-tasks' | 'resources' | 'progress'

  // Student Tasks & Resources State
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [expandedResources, setExpandedResources] = useState({});

  // Real 15-Minute Activity Streak State
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    todayActiveSeconds: 0,
    todayStreakCompleted: false,
    weeklyActivity: [],
  });

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchStudentTasks = async () => {
    try {
      setLoadingTasks(true);
      setTasksError(null);
      const res = await fetch(`${API_BASE_URL}/student/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load student tasks:', err);
      setTasksError('Failed to connect to task service');
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchStudentStreak = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/streak`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStreakData({
            currentStreak: data.currentStreak || 0,
            todayActiveSeconds: data.todayActiveSeconds || 0,
            todayStreakCompleted: Boolean(data.todayStreakCompleted),
            weeklyActivity: Array.isArray(data.weeklyActivity) ? data.weeklyActivity : [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load student streak:', err);
    }
  };

  useEffect(() => {
    fetchStudentTasks();
    fetchStudentStreak();
  }, [user]);

  // Real 15-Minute Session Heartbeat Tracking
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`${API_BASE_URL}/student/heartbeat`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ incrementSeconds: 30 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStreakData((prev) => {
              const newTodaySecs = data.activeSeconds;
              const newIsCompleted = Boolean(data.isStreakCompleted);
              const updatedWeekly = (prev.weeklyActivity || []).map((day) => {
                if (day.isToday) {
                  return {
                    ...day,
                    activeSeconds: newTodaySecs,
                    isStreakCompleted: newIsCompleted,
                  };
                }
                return day;
              });

              const newlyCompleted = newIsCompleted && !prev.todayStreakCompleted;
              return {
                ...prev,
                todayActiveSeconds: newTodaySecs,
                todayStreakCompleted: newIsCompleted,
                currentStreak: newlyCompleted ? prev.currentStreak + 1 : prev.currentStreak,
                weeklyActivity: updatedWeekly,
              };
            });
          }
        }
      } catch (err) {
        // silent heartbeat error catching
      }
    };

    const initialTimer = setTimeout(sendHeartbeat, 3000);
    const interval = setInterval(sendHeartbeat, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user, token]);

  // Mark task as completed handler
  const handleMarkCompleted = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);
      const res = await fetch(`${API_BASE_URL}/student/tasks/${taskId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId
              ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
              : t
          )
        );
      } else {
        alert(data.message || 'Failed to update task status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Network error while updating task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Toggle expanded resources for a task
  const toggleTaskResources = (taskId) => {
    setExpandedResources((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Dynamic Task & Summary Calculations
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasksCount = totalTasks - completedTasksCount;

  const incompleteTasks = tasks
    .filter((t) => t.status !== 'completed' && t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  let upcomingDeadlineText = 'No upcoming deadlines';
  if (incompleteTasks.length > 0) {
    try {
      const d = new Date(incompleteTasks[0].deadline);
      if (!isNaN(d.getTime())) {
        upcomingDeadlineText = d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (e) {}
  }

  // Dashboard Recent Tasks (STRICT LIMIT: MAXIMUM 5 RECENT TASKS)
  const recentTasksLimit5 = [...tasks]
    .sort((a, b) => new Date(b.createdAt || b.deadline) - new Date(a.createdAt || a.deadline))
    .slice(0, 5);

  // Today's Tasks (STRICT LIMIT: MAXIMUM 5 TASKS RELEVANT TO TODAY)
  const todaysTasks = [...tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const today = new Date().setHours(0, 0, 0, 0);
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return Math.abs(dateA - today) - Math.abs(dateB - today);
    })
    .slice(0, 5);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Exact 4 Student Sidebar Items
  const sidebarNavItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Overview & streak tracker',
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
      id: 'my-tasks',
      name: 'My Tasks',
      description: 'All assigned tasks & specs',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="m9 14 2 2 4-4"></path>
        </svg>
      ),
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Deliverables & reference links',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      id: 'progress',
      name: 'Progress',
      description: 'Status & completion tracking',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      ),
    },
  ];

  const getPageInfo = () => {
    switch (activeNav) {
      case 'my-tasks':
        return { breadcrumb: 'My Tasks', title: 'My Tasks (All Assigned Tasks)' };
      case 'resources':
        return { breadcrumb: 'Resources', title: 'My Task Resources' };
      case 'progress':
        return { breadcrumb: 'Progress', title: 'Progress & Completion Tracking' };
      case 'dashboard':
      default:
        return { breadcrumb: 'Dashboard', title: 'Student Dashboard' };
    }
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

      {/* ==================== PROFILE DETAILS MODAL ==================== */}
      <ProfileDetailsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* ==================== LEFT FIXED ADMIN-STYLE SIDEBAR (w-[290px]) ==================== */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[290px] h-full flex-shrink-0 bg-[#070D1A] text-white flex flex-col justify-between border-r border-[#1E293B]/60 transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="p-6 overflow-y-auto">
          {/* C4GT Brand Logo */}
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
                    STUDENT
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
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section Label */}
          <div className="mb-3 px-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Student Workspace</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
          </div>

          {/* STRICT 4 STUDENT NAVIGATION ITEMS */}
          <nav className="space-y-1.5">
            {sidebarNavItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-900/40 border-indigo-400/30'
                      : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border-transparent hover:border-slate-700/50'
                  }`}
                >
                  <div className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                    {item.icon}
                  </div>
                  <div className="leading-tight flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className={`text-[14px] ${isActive ? 'font-semibold text-white' : 'font-medium'}`}>
                        {item.name}
                      </div>
                      {item.id === 'my-tasks' && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {totalTasks}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] font-normal mt-0.5 truncate ${isActive ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar (Exit Link & Clickable Student Profile Card) */}
        <div className="p-5 border-t border-slate-800/80 bg-[#0B1220]/60 space-y-3 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors group"
          >
            <span className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" />
              Exit to Main Site
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Current Student Profile Card - CLICKING OPENS PROFILE DETAILS WITH EDIT PROFILE */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 overflow-hidden text-left hover:opacity-90 transition-opacity cursor-pointer group flex-1"
              title="Click to view & edit Profile Details"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-inner flex-shrink-0 ring-2 ring-indigo-500/30 group-hover:ring-indigo-400">
                {getInitials(user?.name)}
              </div>
              <div className="truncate leading-tight min-w-0">
                <div className="font-semibold text-xs text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>{user?.name || 'Student Account'}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {user?.email || 'student@c4gt.in'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    STUDENT
                  </span>
                  <span className="text-[9px] text-indigo-400 font-semibold underline">Profile Details</span>
                </div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              title="Log out"
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header (~84px) */}
        <header className="h-[84px] bg-white border-b border-[#E2E8F0] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-0.5">
                <Link to="/student" className="hover:text-indigo-600 transition-colors">
                  Student Workspace
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Verified Student Workspace</span>
            </div>

            {/* CLICKABLE STUDENT PROFILE BUTTON IN TOP HEADER (OPENS PROFILE DETAILS & EDIT PROFILE) */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 bg-slate-50/50"
              title="Click to view & edit Profile Details"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="text-left hidden sm:block pr-1">
                <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                  <span>{user?.name || 'Student'}</span>
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold">View &amp; Edit Profile</p>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeNav === 'dashboard' && (
            <div className="max-w-[1100px] mx-auto space-y-6 animate-in fade-in duration-200">
              {/* 1. STUDENT WELCOME HERO CARD (ADMIN DASHBOARD VISUAL STYLE) */}
              <div className="relative rounded-2xl bg-gradient-to-r from-[#070D1A] via-[#0B1220] to-[#1E1B4B] border border-slate-800 p-7 text-white overflow-hidden shadow-xl shadow-slate-900/5">
                <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none"></div>

                <div className="absolute right-0 top-0 bottom-0 w-[420px] pointer-events-none overflow-hidden opacity-90 hidden sm:block">
                  <svg className="w-full h-full" viewBox="0 0 420 220" fill="none">
                    <defs>
                      <radialGradient id="studentHeroGlow" cx="70%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#070D1A" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect width="420" height="220" fill="url(#studentHeroGlow)" />
                    <line x1="80" y1="40" x2="160" y2="90" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="160" y1="90" x2="260" y2="60" stroke="#7C3AED" strokeWidth="1.2" />
                    <line x1="160" y1="90" x2="220" y2="150" stroke="#6366F1" strokeWidth="1" />
                    <circle cx="80" cy="40" r="3.5" fill="#818CF8" />
                    <circle cx="160" cy="90" r="5" fill="#4F46E5" />
                    <circle cx="260" cy="60" r="4" fill="#A78BFA" />
                    <circle cx="220" cy="150" r="4.5" fill="#38BDF8" />
                  </svg>
                </div>

                <div className="relative z-10 max-w-[660px]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold tracking-wide uppercase mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Student Workspace
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                    Welcome back, {user?.name || 'Student'}!
                  </h2>
                  <p className="text-slate-300 text-[13.5px] leading-relaxed">
                    Manage your assigned tasks, learning resources, progress, and upcoming deadlines from your workspace.
                  </p>
                </div>
              </div>

              {/* 2. FOUR KEY METRIC CARDS (ADMIN DASHBOARD METRIC CARD STYLE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Total Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <ListTodo className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{totalTasks}</div>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                      Assigned
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Sprint tasks assigned</p>
                </div>

                {/* Completed Tasks */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Completed Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{completedTasksCount}</div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Finished
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Successfully completed</p>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Pending Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{pendingTasksCount}</div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      In Progress
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Awaiting completion</p>
                </div>

                {/* Upcoming Deadline */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Upcoming Deadline</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {upcomingDeadlineText}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Nearest due date</p>
                </div>
              </div>

              {/* UPCOMING DEADLINES & RECENT TASKS SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upcoming Deadlines */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        Upcoming Deadlines
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Incomplete tasks prioritized by nearest remaining due date.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      {incompleteTasks.length} Pending
                    </span>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {incompleteTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        No upcoming deadlines. All tasks completed! 🎉
                      </div>
                    ) : (
                      incompleteTasks.slice(0, 5).map((t) => (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <div className="truncate">
                              <h4 className="font-bold text-slate-900 truncate">{t.title}</h4>
                              <p className="text-[11px] text-slate-500 truncate">{t.topic || 'Engineering Task'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Due {formatDate(t.deadline)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Tasks Section (MAXIMUM 5 TASKS) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Recent Tasks
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Showing maximum 5 recently assigned tasks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav('my-tasks')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All ({totalTasks}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {loadingTasks ? (
                      <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading recent tasks...</span>
                      </div>
                    ) : recentTasksLimit5.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        No tasks assigned yet.
                      </div>
                    ) : (
                      recentTasksLimit5.map((t) => {
                        const isDone = t.status === 'completed';
                        return (
                          <div
                            key={t._id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <h4 className="font-bold text-slate-900 truncate">{t.title}</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{t.topic || 'Engineering Sprint'}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isDone
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {isDone ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* TODAY'S TASKS SECTION (MAXIMUM 5 TASKS) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      Today&apos;s Tasks
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tasks relevant for today, prioritized by current due date and status.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    Max 5 Tasks
                  </span>
                </div>
                <div className="p-5 space-y-2.5">
                  {todaysTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                      No tasks scheduled for today.
                    </div>
                  ) : (
                    todaysTasks.map((t) => {
                      const isDone = t.status === 'completed';
                      return (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                            <div className="truncate">
                              <h4 className="font-bold text-slate-900 truncate">{t.title}</h4>
                              <p className="text-[11px] text-slate-500 truncate">{t.topic || 'Engineering Sprint Task'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold text-slate-500">
                              Due {formatDate(t.deadline)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isDone
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {isDone ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* REAL 15-MINUTE STREAK SECTION (ADMIN DASHBOARD CARD DESIGN STYLE) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20 shrink-0">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        Activity Streak
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                          15 Min / Day Goal
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Requires at least 15 minutes active session per day to build your streak.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-xs self-start sm:self-auto">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-black tracking-tight">
                      {streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* WEEKLY CALENDAR GRID (M, T, W, T, F, S, S) */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center py-2 bg-slate-50/80 rounded-2xl border border-slate-200 p-3">
                    {streakData.weeklyActivity && streakData.weeklyActivity.length > 0 ? (
                      streakData.weeklyActivity.map((day, idx) => {
                        const isDone = day.isStreakCompleted;
                        const isToday = day.isToday;
                        return (
                          <div key={idx} className="flex flex-col items-center space-y-1.5 min-w-0">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">
                              {day.dayName}
                            </span>
                            <span
                              className={`text-xs font-extrabold ${
                                isToday ? 'text-indigo-600 underline decoration-2 font-black' : 'text-slate-700'
                              }`}
                            >
                              {day.dateNum}
                            </span>
                            <div className="pt-1">
                              {isDone ? (
                                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              ) : isToday ? (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 border-2 border-indigo-500 flex items-center justify-center font-bold text-[10px] animate-pulse">
                                  {Math.floor(streakData.todayActiveSeconds / 60)}m
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-300 font-semibold text-xs">
                                  ○
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="flex flex-col items-center space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400">{d}</span>
                          <span className="text-xs font-bold text-slate-400">--</span>
                          <div className="w-7 h-7 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-300">
                            ○
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ACTIVE SESSION PROGRESS BAR */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Today&apos;s Active Session:
                      </span>
                      <span className="font-bold text-indigo-700">
                        {Math.floor(streakData.todayActiveSeconds / 60)} / 15 mins
                        {streakData.todayStreakCompleted ? ' (Streak Goal Achieved! 🎉)' : ''}
                      </span>
                    </div>

                    <div className="w-full bg-indigo-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          streakData.todayStreakCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((streakData.todayActiveSeconds / 900) * 100))}%`,
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {streakData.todayStreakCompleted
                        ? 'Awesome work! You completed your 15-minute active session requirement today.'
                        : `Keep the application active for ${Math.max(
                            0,
                            15 - Math.floor(streakData.todayActiveSeconds / 60)
                          )} more minute(s) to achieve today's streak requirement.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY TASKS (SHOWS ALL TASKS - NO 5 LIMIT) */}
          {activeNav === 'my-tasks' && (
            <div className="max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    My Tasks (All Assigned Tasks)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All tasks assigned to you by Admin and Team Leads. Every task remains visible here.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
                  {totalTasks} Total Task{totalTasks === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-6 space-y-4">
                {loadingTasks ? (
                  <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading all assigned tasks...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700">No tasks assigned currently.</p>
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div
                        key={task._id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {task.priority && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                                {task.priority} Priority
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>

                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {task.topic && (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                Domain: {task.topic}
                              </span>
                            )}
                            <span>Assigned by: {task.createdBy?.name || 'Admin / Lead'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Due: {formatDate(task.deadline)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeNav === 'resources' && (
            <div className="max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                    My Task Resources
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click a task name to view all resource links, code specs, and documentation assigned to that task.
                  </p>
                </div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  {tasks.length} Resource Topics
                </span>
              </div>

              <div className="p-6 space-y-3">
                {loadingTasks ? (
                  <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Loading task resources...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    No task resources currently available.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isExpanded = Boolean(expandedResources[task._id]);
                    const deliverables = Array.isArray(task.deliverables) && task.deliverables.length > 0
                      ? task.deliverables
                      : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'];

                    return (
                      <div
                        key={task._id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskResources(task._id)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                              <p className="text-[11px] text-slate-500">{task.topic || 'Engineering Track'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                              {deliverables.length} Resources
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Assigned Deliverables &amp; Reference Links:
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {deliverables.map((item, idx) => {
                                const itemLower = item.toLowerCase();
                                return (
                                  <div
                                    key={idx}
                                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-purple-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {itemLower.includes('code') || itemLower.includes('repo') ? (
                                        <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />
                                      ) : itemLower.includes('pull') || itemLower.includes('request') ? (
                                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : itemLower.includes('demo') || itemLower.includes('video') ? (
                                        <Video className="w-4 h-4 text-purple-600 shrink-0" />
                                      ) : (
                                        <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                                      )}
                                      <div>
                                        <div className="text-xs font-bold text-slate-800">{item}</div>
                                        <div className="text-[10px] text-slate-400">Required Deliverable Spec</div>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                      View Spec
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROGRESS */}
          {activeNav === 'progress' && (
            <div className="max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Progress &amp; Completion Tracking
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track milestone completion status and mark tasks as completed in live MongoDB Atlas.
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  {completedTasksCount} of {totalTasks} Completed
                </span>
              </div>

              <div className="p-6 space-y-4">
                {loadingTasks ? (
                  <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Loading progress items...</span>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    No tasks to track.
                  </div>
                ) : (
                  tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isUpdating = updatingTaskId === task._id;

                    return (
                      <div
                        key={task._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Deadline: {formatDate(task.deadline)}
                            </span>
                            <span>•</span>
                            <span>
                              Status: <strong className={isCompleted ? 'text-emerald-700' : 'text-amber-700'}>{isCompleted ? 'Completed' : 'In Progress / Pending'}</strong>
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2 max-w-md">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-1/3'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="shrink-0 self-end sm:self-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ✓ Completed
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleMarkCompleted(task._id)}
                              disabled={isUpdating}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark as Completed
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
