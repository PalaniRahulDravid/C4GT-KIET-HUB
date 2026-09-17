import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import C4GTLogo from '../../components/C4GTLogo';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLogo,
  SidebarSectionLabel,
  SidebarUser,
} from '../../components/AceternitySidebar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Code2,
  GitBranch,
  Download,
  Search,
  Flame,
  Bell,
  LogOut,
  User,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Layers,
  X,
  RefreshCw,
  Award,
  Share2,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, logout, apiBaseUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Navigation state derived from URL
  const activeNav = useMemo(() => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/student/my-tasks')) return 'my-tasks';
    if (p.includes('/student/resources')) return 'resources';
    if (p.includes('/student/progress')) return 'progress';
    return 'overview';
  }, [location.pathname]);

  // Redirect bare /student to /student/overview
  useEffect(() => {
    if (location.pathname === '/student' || location.pathname === '/student/') {
      navigate('/student/overview', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Mobile sidebar visibility
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Data states
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [streakData, setStreakData] = useState({ currentStreak: 0, todayActiveSeconds: 0 });
  const [studentTeam, setStudentTeam] = useState(null);
  const [teamInvitations, setTeamInvitations] = useState([]);
  const [hubResources, setHubResources] = useState([]);
  const [loadingHubResources, setLoadingHubResources] = useState(true);

  // Notification state
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Task filter & search
  const [taskStatusFilter, setTaskStatusFilter] = useState('all'); // all, todo, submitted, completed
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Resources search & category
  const [resourceCategory, setResourceCategory] = useState('all'); // all, docs, code, dsa
  const [resourceSearch, setResourceSearch] = useState('');
  const [togglingResourceId, setTogglingResourceId] = useState(null);

  // Task Overview & Deliverables Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionDeliverables, setSubmissionDeliverables] = useState({});
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submittingDeliverables, setSubmittingDeliverables] = useState(false);
  const [submissionSuccessMessage, setSubmissionSuccessMessage] = useState(null);

  // Check if user has dual teamlead role
  const isTeamLead = user?.role === 'teamlead' || user?.role === 'team_lead';

  // ---------------------------------------------------------------------------
  // API Fetching
  // ---------------------------------------------------------------------------

  const fetchStudentTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch(`${API_BASE_URL}/student/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
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
        if (data && data.success) {
          setStreakData({
            currentStreak: Number(data.currentStreak) || 0,
            todayStreakCompleted: Boolean(data.todayStreakCompleted),
            totalTaskSubmissionsToday: Number(data.totalTaskSubmissionsToday) || 0,
            weeklyActivity: Array.isArray(data.weeklyActivity) ? data.weeklyActivity : [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load streak:', err);
    }
  };

  const fetchStudentTeam = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/team`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.hasTeam) {
          setStudentTeam(data.team);
        } else {
          setStudentTeam(null);
        }
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  };

  const fetchHubResources = async () => {
    try {
      setLoadingHubResources(true);
      const res = await fetch(`${API_BASE_URL}/resources`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.resources)) {
          setHubResources(data.resources);
        }
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoadingHubResources(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.notifications)) {
          setNotificationsList(data.notifications);
          setUnreadNotificationsCount(Number(data.unreadCount) || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchStudentTasks();
    fetchStudentStreak();
    fetchStudentTeam();
    fetchHubResources();
    fetchNotifications();
  }, [user]);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-fill deliverables when modal opens
  useEffect(() => {
    if (selectedTask) {
      const existing = {};
      const subs = selectedTask.assignment?.submissions || [];
      subs.forEach((s) => {
        if (s.deliverableName) {
          existing[s.deliverableName] = s.link || s.fileUrl || '';
        }
      });
      setSubmissionDeliverables(existing);
      setSubmissionNotes(selectedTask.assignment?.submissionNotes || '');
      setSubmissionSuccessMessage(null);
    }
  }, [selectedTask]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleSubmitDeliverables = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTask) return;

    try {
      setSubmittingDeliverables(true);
      const reqDeliverables =
        Array.isArray(selectedTask.deliverables) && selectedTask.deliverables.length > 0
          ? selectedTask.deliverables
          : ['Documentation / Spec', 'Demo / Presentation'];

      const submissionsPayload = reqDeliverables.map((dName) => {
        const name = typeof dName === 'string' ? dName : dName.name || 'Deliverable';
        return {
          deliverableName: name,
          link: (submissionDeliverables[name] || '').trim(),
        };
      });

      const res = await fetch(`${API_BASE_URL}/student/tasks/${selectedTask._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          submissions: submissionsPayload,
          submissionNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionSuccessMessage('Work submitted successfully! Your Team Lead has been notified.');
        fetchStudentTasks();
        fetchStudentStreak();
        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                assignment: {
                  ...prev.assignment,
                  status: 'submitted',
                  submissions: submissionsPayload,
                  submissionNotes,
                  submittedAt: new Date().toISOString(),
                },
              }
            : null
        );
      } else {
        alert(data.message || 'Failed to submit deliverables');
      }
    } catch (err) {
      console.error('Submit deliverables error:', err);
      alert('Network error while submitting deliverables');
    } finally {
      setSubmittingDeliverables(false);
    }
  };

  const handleToggleResourceComplete = async (resource) => {
    if (!resource || !resource._id) return;
    try {
      setTogglingResourceId(resource._id);
      const res = await fetch(`${API_BASE_URL}/resources/${resource._id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHubResources((prev) =>
          prev.map((r) =>
            r._id === resource._id ? { ...r, isCompleted: data.isCompleted } : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    } finally {
      setTogglingResourceId(null);
    }
  };

  const handleDownloadResource = (resource) => {
    if (!resource || !resource.url) return;
    fetch(`${API_BASE_URL}/resources/${resource._id}/download`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});

    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ---------------------------------------------------------------------------
  // Derived Statistics
  // ---------------------------------------------------------------------------

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (t) => t.assignment?.status === 'completed' || t.status === 'completed'
    ).length;
    const submitted = tasks.filter(
      (t) => t.assignment?.status === 'submitted' || t.status === 'submitted'
    ).length;
    const pending = total - completed - submitted;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, submitted, pending, pct };
  }, [tasks]);

  const nextPriorityTask = useMemo(() => {
    return (
      tasks.find(
        (t) =>
          t.assignment?.status !== 'completed' &&
          t.status !== 'completed' &&
          t.assignment?.status !== 'submitted'
      ) ||
      tasks.find((t) => t.assignment?.status === 'submitted') ||
      tasks[0] ||
      null
    );
  }, [tasks]);

  const completedResourcesCount = useMemo(() => {
    return hubResources.filter((r) => r.isCompleted).length;
  }, [hubResources]);

  // Filtered tasks for "My Tasks"
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const status = t.assignment?.status || t.status || 'pending';
      if (taskStatusFilter === 'todo') {
        if (status === 'completed' || status === 'submitted') return false;
      } else if (taskStatusFilter === 'submitted') {
        if (status !== 'submitted') return false;
      } else if (taskStatusFilter === 'completed') {
        if (status !== 'completed') return false;
      }

      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchTopic = t.topic?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTopic) return false;
      }
      return true;
    });
  }, [tasks, taskStatusFilter, taskSearchQuery]);

  // Filtered resources for "Resources"
  const filteredResources = useMemo(() => {
    return hubResources.filter((r) => {
      if (resourceCategory === 'docs') {
        if (!['doc', 'pdf', 'excel'].includes(r.type)) return false;
      } else if (resourceCategory === 'code') {
        if (!['git_repo', 'link'].includes(r.type)) return false;
      } else if (resourceCategory === 'dsa') {
        if (r.type !== 'dsa_problem') return false;
      }

      if (resourceSearch.trim()) {
        const q = resourceSearch.toLowerCase();
        const matchTitle = r.title?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchTopic = r.topic?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTopic) return false;
      }
      return true;
    });
  }, [hubResources, resourceCategory, resourceSearch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">✓ Completed</Badge>;
      case 'submitted':
        return <Badge variant="warning">⏳ Awaiting Review</Badge>;
      case 'revision_requested':
        return <Badge variant="destructive">⚠️ Revision Needed</Badge>;
      default:
        return <Badge variant="secondary">To Do</Badge>;
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'doc':
      case 'pdf':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'dsa_problem':
        return <Code2 className="w-5 h-5 text-amber-600" />;
      case 'git_repo':
        return <GitBranch className="w-5 h-5 text-slate-800" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-slate-50/60 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            <SidebarLogo
              logo={{
                href: '/student',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-xs">
                    <C4GTLogo showText={false} imgClassName="h-7" />
                  </div>
                ),
                label: 'C4GT KIET HUB',
                badge: 'STUDENT',
                sublabel: studentTeam?.name || 'Workspace',
              }}
              className="mb-4"
            />

            <SidebarSectionLabel label="Student Workspace" />

            <nav className="mt-2 space-y-1">
              <SidebarLink
                link={{
                  href: '/student/overview',
                  label: 'Overview',
                  icon: <LayoutDashboard className="w-4 h-4" />,
                }}
                isActive={activeNav === 'overview'}
                onClick={() => {
                  navigate('/student/overview');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/student/my-tasks',
                  label: 'My Tasks',
                  icon: <CheckSquare className="w-4 h-4" />,
                  badge: taskStats.pending > 0 ? taskStats.pending : undefined,
                }}
                isActive={activeNav === 'my-tasks'}
                onClick={() => {
                  navigate('/student/my-tasks');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/student/resources',
                  label: 'Learning Resources',
                  icon: <BookOpen className="w-4 h-4" />,
                  badge: hubResources.length > 0 ? hubResources.length : undefined,
                }}
                isActive={activeNav === 'resources'}
                onClick={() => {
                  navigate('/student/resources');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/student/progress',
                  label: 'My Team & Progress',
                  icon: <Users className="w-4 h-4" />,
                }}
                isActive={activeNav === 'progress'}
                onClick={() => {
                  navigate('/student/progress');
                  setMobileSidebarOpen(false);
                }}
              />
            </nav>

            {isTeamLead && (
              <>
                <SidebarSectionLabel label="Lead Role" />
                <nav className="mt-1 space-y-1">
                  <SidebarLink
                    link={{
                      href: '/teamlead/tasks',
                      label: 'Team Lead Workspace',
                      icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
                    }}
                    isActive={false}
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                </nav>
              </>
            )}
          </div>

          <SidebarUser
            user={user}
            getInitials={(name) => (name ? name.slice(0, 2).toUpperCase() : 'ST')}
            onProfileClick={() => setShowProfileModal(true)}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500 font-medium">Cohort 2026 – 2027</div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 capitalize">
                {activeNav === 'overview' && 'Student Overview'}
                {activeNav === 'my-tasks' && 'My Tasks & Deliverables'}
                {activeNav === 'resources' && 'Learning Resources Hub'}
                {activeNav === 'progress' && 'Team Progress & Roster'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Daily Submission Streak Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-2xs"
              title="Daily Task Submission Streak"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day' : 'Days'} Streak</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[11px] text-slate-500">{unreadNotificationsCount} unread</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                    {notificationsList.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">No new notifications</div>
                    ) : (
                      notificationsList.map((n) => (
                        <div key={n._id} className="py-2 text-xs">
                          <p className="font-semibold text-slate-900">{n.title || 'Update'}</p>
                          <p className="text-slate-500 text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Team Lead switch button if applicable */}
            {isTeamLead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/teamlead/tasks')}
                className="hidden sm:inline-flex text-xs font-semibold text-amber-800 border-amber-200 bg-amber-50/50 hover:bg-amber-100/60"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                Team Lead Portal
              </Button>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ============================================================= */}
            {/* VIEW 1: OVERVIEW */}
            {/* ============================================================= */}
            {activeNav === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Welcome Card */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      Welcome back, {user?.name || 'Developer'}! 👋
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {studentTeam
                        ? `${studentTeam.name} • ${studentTeam.track || 'Engineering Track'}`
                        : 'Cohort 2026 – 2027 • Track your progress and submit deliverables.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/student/my-tasks')}
                    className="self-start sm:self-auto gap-2"
                  >
                    <span>View All Tasks</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* 3 Core Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tasks Completed
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {taskStats.completed} / {taskStats.total}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={taskStats.pct} className="h-1.5" />
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {taskStats.pct}% of assigned deliverables submitted & verified
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Task Submission Streak
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                        <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
                        <span>{streakData.currentStreak} {streakData.currentStreak === 1 ? 'Day' : 'Days'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-500 font-medium">
                        Submit task deliverables daily to maintain your momentum and streak!
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Resources Completed
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {completedResourcesCount} / {hubResources.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress
                        value={
                          hubResources.length > 0
                            ? Math.round((completedResourcesCount / hubResources.length) * 100)
                            : 0
                        }
                        className="h-1.5"
                      />
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        Study guides, DSA problems, and documentation explored
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Next Action Priority Card */}
                {nextPriorityTask ? (
                  <Card className="border-slate-300 shadow-xs">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="default">Priority Action Item</Badge>
                        <span className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(nextPriorityTask.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                        {nextPriorityTask.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600 line-clamp-2">
                        {nextPriorityTask.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Required Deliverables:</span>
                        {Array.isArray(nextPriorityTask.deliverables) && nextPriorityTask.deliverables.length > 0 ? (
                          nextPriorityTask.deliverables.map((d, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                            >
                              {typeof d === 'string' ? d : d.name}
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              Documentation (Google Doc)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              Presentation (Google Slides)
                            </span>
                          </>
                        )}
                      </div>

                      {Array.isArray(nextPriorityTask.relatedResources) && nextPriorityTask.relatedResources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">Resources:</span>
                          {nextPriorityTask.relatedResources.map((resItem) => (
                            <a
                              key={resItem._id || resItem.title}
                              href={resItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 transition-colors"
                            >
                              <BookOpen className="w-3 h-3 text-blue-600" />
                              <span className="truncate max-w-[200px]">{resItem.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Status:</span>
                        {getStatusBadge(nextPriorityTask.assignment?.status || nextPriorityTask.status)}
                      </div>
                      <Button onClick={() => setSelectedTask(nextPriorityTask)} size="sm">
                        {nextPriorityTask.assignment?.status === 'submitted'
                          ? 'View Submitted Links'
                          : 'Submit Deliverables (Google Drive)'}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="p-8 text-center bg-white border-dashed">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-900">All Tasks Completed!</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      You are completely caught up with your team's deliverables.
                    </p>
                  </Card>
                )}

                {/* Quick Resources Strip */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Recommended Learning Resources
                    </h3>
                    <Button
                      variant="link"
                      onClick={() => navigate('/student/resources')}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      Browse All ({hubResources.length}) →
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {hubResources.slice(0, 3).map((r) => (
                      <Card key={r._id} className="p-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                            {getResourceIcon(r.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{r.title}</h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{r.topic || 'General'}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadResource(r)}
                              className="mt-3 w-full text-xs h-7"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open Resource
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 2: MY TASKS (UNIFIED QUEUE) */}
            {/* ============================================================= */}
            {activeNav === 'my-tasks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      My Assigned Tasks
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit Google Drive links (Docs & Slides) for each milestone to complete your sprint.
                    </p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                    <button
                      onClick={() => setTaskStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        taskStatusFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({tasks.length})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('todo')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        taskStatusFilter === 'todo'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      To Do ({taskStats.pending})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('submitted')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        taskStatusFilter === 'submitted'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Under Review ({taskStats.submitted})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        taskStatusFilter === 'completed'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Completed ({taskStats.completed})
                    </button>
                  </div>
                </div>

                {/* Search box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="Search tasks by title, topic, or keyword..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* Tasks List */}
                {loadingTasks ? (
                  <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading your tasks...</span>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
                    <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900">No tasks found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {taskSearchQuery ? 'Try clearing your search terms.' : 'No tasks in this category.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => {
                      const status = task.assignment?.status || task.status || 'pending';
                      const isCompleted = status === 'completed';
                      const isSubmitted = status === 'submitted';

                      return (
                        <Card key={task._id} className="hover:border-slate-300 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                                  {task.source === 'admin' ? 'Admin Milestone' : 'Team Lead Sprint'}
                                </span>
                                {task.topic && (
                                  <span className="text-xs text-slate-500 font-medium">
                                    • {task.topic}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-500">
                                  Due: {new Date(task.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {getStatusBadge(status)}
                              </div>
                            </div>

                            <CardTitle className="text-base font-bold text-slate-900 mt-1">
                              {task.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-600 leading-relaxed">
                              {task.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="pb-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                                Required Deliverables:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(task.deliverables) && task.deliverables.length > 0 ? (
                                  task.deliverables.map((d, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs"
                                    >
                                      📄 {typeof d === 'string' ? d : d.name}
                                    </span>
                                  ))
                                ) : (
                                  <>
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs">
                                      📄 Documentation (Google Doc)
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs">
                                      📊 Presentation (Google Slides)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {Array.isArray(task.relatedResources) && task.relatedResources.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1 mt-2">
                                <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-blue-600" />
                                  <span>Learning Resources & References:</span>
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {task.relatedResources.map((resItem) => (
                                    <a
                                      key={resItem._id || resItem.title}
                                      href={resItem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200 transition-colors shadow-2xs"
                                    >
                                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-mono uppercase font-semibold">
                                        {resItem.type || 'link'}
                                      </span>
                                      <span className="truncate max-w-[200px]">{resItem.title}</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>

                          <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {isCompleted
                                ? '✓ Work reviewed and accepted by Team Lead'
                                : isSubmitted
                                ? '⏳ Work submitted — Team Lead review in progress'
                                : 'Google Drive links required for review'}
                            </span>
                            <Button
                              onClick={() => setSelectedTask(task)}
                              variant={isCompleted ? 'outline' : 'default'}
                              size="sm"
                            >
                              {isCompleted
                                ? 'View Details'
                                : isSubmitted
                                ? 'Submission Status'
                                : 'Submit Work'}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 3: LEARNING RESOURCES (STUDY HUB) */}
            {/* ============================================================= */}
            {activeNav === 'resources' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Learning Resources & Practice Materials
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explore curated study materials, problem links, and guides uploaded by mentors and leads.
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                    <button
                      onClick={() => setResourceCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceCategory === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({hubResources.length})
                    </button>
                    <button
                      onClick={() => setResourceCategory('docs')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceCategory === 'docs'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Docs & PDFs
                    </button>
                    <button
                      onClick={() => setResourceCategory('code')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceCategory === 'code'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Repositories
                    </button>
                    <button
                      onClick={() => setResourceCategory('dsa')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resourceCategory === 'dsa'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      DSA Problems
                    </button>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources by title, topic, or description..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                {/* Resources Grid */}
                {loadingHubResources ? (
                  <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading resources repository...</span>
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900">No resources found</h3>
                    <p className="text-xs text-slate-500 mt-1">Adjust your search or category filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map((resItem) => (
                      <Card key={resItem._id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                              {getResourceIcon(resItem.type)}
                            </div>
                            <button
                              onClick={() => handleToggleResourceComplete(resItem)}
                              disabled={togglingResourceId === resItem._id}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                resItem.isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={resItem.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{resItem.isCompleted ? 'Completed ✓' : 'Mark Done'}</span>
                            </button>
                          </div>

                          <CardTitle className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                            {resItem.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 line-clamp-2">
                            {resItem.description || 'Practice guide & reference material.'}
                          </CardDescription>
                        </CardHeader>

                        <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-mono font-medium text-slate-500">
                            {resItem.topic || 'General Track'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResource(resItem)}
                            className="text-xs h-8"
                          >
                            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            <span>Open</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 4: MY TEAM & PROGRESS */}
            {/* ============================================================= */}
            {activeNav === 'progress' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {studentTeam ? (
                  <>
                    {/* Team Summary Hero */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold">
                              TEAM {studentTeam.teamNumber}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Cohort 2026 – 2027</span>
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-900 mt-1">
                            {studentTeam.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            {studentTeam.track || 'Engineering Track'} • Total capacity: 9 members
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                              <span>Sprint Completion Progress</span>
                              <span>{taskStats.pct}%</span>
                            </div>
                            <Progress value={taskStats.pct} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Lead Card */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Assigned Team Lead
                          </CardDescription>
                          <CardTitle className="text-base font-bold text-slate-900 mt-1">
                            {studentTeam.teamLeadId?.name || 'Lead Assigned'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-600 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${studentTeam.teamLeadId?.email}`}
                              className="hover:underline truncate"
                            >
                              {studentTeam.teamLeadId?.email || 'N/A'}
                            </a>
                          </div>
                          {(studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber) && (
                            <div className="flex items-center gap-2 text-slate-600 truncate">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <a
                                href={`tel:${studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber}`}
                                className="hover:underline"
                              >
                                {studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber}
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Team Members Roster */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Team Members (
                        {Array.isArray(studentTeam.members) ? studentTeam.members.length + 1 : 1} / 9)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.isArray(studentTeam.members) &&
                          studentTeam.members.map((member) => (
                            <Card key={member._id} className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  {member.name ? member.name.slice(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {member.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-mono truncate">
                                    {member.email}
                                  </p>
                                  {(member.branch || member.year) && (
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                      {member.branch} {member.year ? `• Year ${member.year}` : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Card className="p-12 text-center bg-white border-dashed">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">Not Assigned to a Team Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Your administrator will assign you to one of the 9 cohort teams shortly.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ============================================================= */}
      {/* DELIVERABLES SUBMISSION MODAL */}
      {/* ============================================================= */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default">Task Submission</Badge>
                  {getStatusBadge(selectedTask.assignment?.status || selectedTask.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fresher Guidance Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">📋 Submission Instructions for Students:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                <li>Upload your report/document to Google Docs or Google Drive.</li>
                <li>Upload your presentation slides to Google Slides or Google Drive.</li>
                <li>
                  Ensure sharing access is set to <strong className="text-slate-900">"Anyone with the link can view"</strong>.
                </li>
              </ul>
            </div>

            {/* Attached Reference & Learning Resources for Task */}
            {Array.isArray(selectedTask.relatedResources) && selectedTask.relatedResources.length > 0 && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
                <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reference & Learning Resources for this Task:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.relatedResources.map((resItem) => (
                    <a
                      key={resItem._id || resItem.title}
                      href={resItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-800 font-medium hover:bg-blue-100/60 transition-colors shadow-2xs"
                    >
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-mono uppercase font-semibold">
                        {resItem.type || 'link'}
                      </span>
                      <span className="truncate max-w-[220px]">{resItem.title}</span>
                      <ExternalLink className="w-3 h-3 text-blue-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Review Feedback if Revision Requested */}
            {selectedTask.assignment?.reviewNotes && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5" /> Team Lead Feedback:
                </p>
                <p className="text-amber-800">{selectedTask.assignment.reviewNotes}</p>
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmitDeliverables} className="space-y-4 pt-1">
              {(Array.isArray(selectedTask.deliverables) && selectedTask.deliverables.length > 0
                ? selectedTask.deliverables
                : ['Documentation / Spec', 'Demo / Presentation']
              ).map((deliv, idx) => {
                const name = typeof deliv === 'string' ? deliv : deliv.name || 'Deliverable';
                const isDoc = name.toLowerCase().includes('doc') || name.toLowerCase().includes('spec');
                const isSlide = name.toLowerCase().includes('demo') || name.toLowerCase().includes('presentation');

                return (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span>
                        {isDoc ? '📄 ' : isSlide ? '📊 ' : '🔗 '}
                        {name} Link
                      </span>
                      {submissionDeliverables[name] && (
                        <a
                          href={submissionDeliverables[name]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 font-normal"
                        >
                          <span>Preview Drive Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      required
                      value={submissionDeliverables[name] || ''}
                      onChange={(e) =>
                        setSubmissionDeliverables({
                          ...submissionDeliverables,
                          [name]: e.target.value,
                        })
                      }
                      placeholder={
                        isDoc
                          ? 'https://docs.google.com/document/d/...'
                          : isSlide
                          ? 'https://docs.google.com/presentation/d/...'
                          : 'https://github.com/... or Google Drive link'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                );
              })}

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Remarks / Notes for Team Lead (Optional)
                </label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={2}
                  placeholder="Mention what you completed or any questions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {submissionSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submissionSuccessMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingDeliverables}
                  className="gap-1.5"
                >
                  {submittingDeliverables ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit for Review</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {showProfileModal && (
        <ProfileDetailsModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
