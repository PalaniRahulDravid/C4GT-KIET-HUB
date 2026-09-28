import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import UserAvatar from '../../components/UserAvatar';
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
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Crown,
  Home,
  Target,
  TrendingUp,
  BarChart3,
  Filter,
} from 'lucide-react';
import { Skeleton, SkeletonCard, SkeletonTaskCard, SkeletonResourceCard } from '../../components/skeleton';

export default function StudentDashboard() {
  const { user, token, logout, apiBaseUrl, changePassword } = useAuth();
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

  // Password change modal states
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Password change is optional on demand for students (not mandatory on first login)
  const isMandatoryPasswordChange = false;
  const isPasswordModalOpen = showPasswordChangeModal;

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword.trim()) {
      setPassError('Please enter your current password (default is your University Roll Number).');
      return;
    }
    if (newPassword.trim().length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (user?.rollNumber && newPassword.trim().toUpperCase() === user.rollNumber.toUpperCase()) {
      setPassError('New password cannot be your Roll Number. Please choose a different, secure password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsChangingPass(true);
      await changePassword(currentPassword.trim(), newPassword.trim());
      setPassSuccess('Password successfully updated!');
      setTimeout(() => {
        setShowPasswordChangeModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPassSuccess('');
      }, 1000);
    } catch (err) {
      setPassError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Data states
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [streakData, setStreakData] = useState({ currentStreak: 0, todayActiveSeconds: 0 });
  const [studentTeam, setStudentTeam] = useState(null);
  const [teamProgressData, setTeamProgressData] = useState(null);
  const [loadingTeamProgress, setLoadingTeamProgress] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberFilterStatus, setMemberFilterStatus] = useState('all'); // all, completed, in_progress, pending
  const [teamActiveViewTab, setTeamActiveViewTab] = useState('members'); // 'members' | 'deliverables'
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
  const [taskSourceTab, setTaskSourceTab] = useState('all'); // 'all', 'teamlead', 'admin'

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
      setLoadingTeamProgress(true);
      const res = await fetch(`${API_BASE_URL}/student/team`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.hasTeam) {
          setStudentTeam(data.team);
          setTeamProgressData(data.teamProgress || null);
        } else {
          setStudentTeam(null);
          setTeamProgressData(null);
        }
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoadingTeamProgress(false);
    }
  };

  const fetchHubResources = async () => {
    try {
      setLoadingHubResources(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/resources`, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
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
        const isAdmin = isTaskAdmin(selectedTask);
        setSubmissionSuccessMessage(
          data.message || (isAdmin
            ? 'Work submitted successfully! Sent to Admin for review.'
            : 'Work submitted successfully! Your Team Lead has been notified.')
        );
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
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/resources/${resource._id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
    fetch(`${API_BASE_URL}/resources/${resource._id}/download`, {
      method: 'POST',
      credentials: 'include',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    }).catch(() => { });

    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ---------------------------------------------------------------------------
  // Derived Statistics
  // ---------------------------------------------------------------------------

  // Helper to determine if a task was assigned by Admin
  const isTaskAdmin = (t) => {
    if (!t) return false;
    if (t.source === 'admin') return true;
    if (t.source === 'teamlead' || t.source === 'team_lead') return false;
    const role = t.createdBy?.role ? String(t.createdBy.role).toLowerCase().trim() : '';
    if (role === 'admin') return true;
    if (role === 'teamlead' || role === 'team_lead') return false;
    return false;
  };

  const teamLeadTasks = useMemo(() => {
    return tasks.filter((t) => !isTaskAdmin(t));
  }, [tasks]);

  const adminTasks = useMemo(() => {
    return tasks.filter((t) => isTaskAdmin(t));
  }, [tasks]);

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
    // Prioritize pending/in-progress Team Lead tasks first so students see lead tasks right away
    const pendingTeamLead = teamLeadTasks.find(
      (t) =>
        t.assignment?.status !== 'completed' &&
        t.status !== 'completed' &&
        t.assignment?.status !== 'submitted'
    );
    if (pendingTeamLead) return pendingTeamLead;

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
  }, [tasks, teamLeadTasks]);

  const completedResourcesCount = useMemo(() => {
    return hubResources.filter((r) => r.isCompleted).length;
  }, [hubResources]);

  const activeSourceTasks = useMemo(() => {
    if (taskSourceTab === 'all') return tasks;
    return taskSourceTab === 'admin' ? adminTasks : teamLeadTasks;
  }, [taskSourceTab, tasks, adminTasks, teamLeadTasks]);

  // Scoped statistics for the currently selected source tab (Team Lead vs Admin)
  const scopedTaskStats = useMemo(() => {
    const total = activeSourceTasks.length;
    const completed = activeSourceTasks.filter(
      (t) => t.assignment?.status === 'completed' || t.status === 'completed'
    ).length;
    const submitted = activeSourceTasks.filter(
      (t) => t.assignment?.status === 'submitted' || t.status === 'submitted'
    ).length;
    const pending = total - completed - submitted;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, submitted, pending, pct };
  }, [activeSourceTasks]);

  // Filtered tasks for "My Tasks"
  const filteredTasks = useMemo(() => {
    return activeSourceTasks.filter((t) => {
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
  }, [activeSourceTasks, taskStatusFilter, taskSearchQuery]);

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

  // Team Progress Member Filtering & Counts
  const memberCounts = useMemo(() => {
    const list = teamProgressData?.memberStats || [];
    const all = list.length;
    const completed = list.filter((m) => m.totalTasks > 0 && m.completionRate === 100).length;
    const inProgress = list.filter((m) => m.totalTasks > 0 && (m.submitted > 0 || (m.completed > 0 && m.completionRate < 100))).length;
    const pending = list.filter((m) => m.totalTasks > 0 && m.pending > 0 && m.completed === 0 && m.submitted === 0).length;
    return { all, completed, inProgress, pending };
  }, [teamProgressData]);

  const filteredMemberStats = useMemo(() => {
    if (!teamProgressData?.memberStats) {
      if (Array.isArray(studentTeam?.members)) {
        return studentTeam.members.map((m) => ({
          _id: m._id,
          name: m.name,
          email: m.email,
          rollNumber: m.rollNumber || '',
          branch: m.branch || '',
          year: m.year || '',
          avatar: m.avatar || '',
          totalTasks: 0,
          completed: 0,
          submitted: 0,
          pending: 0,
          completionRate: 0,
        }));
      }
      return [];
    }

    let list = teamProgressData.memberStats;

    if (memberSearchQuery.trim()) {
      const q = memberSearchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
          (m.branch && m.branch.toLowerCase().includes(q))
      );
    }

    if (memberFilterStatus === 'completed') {
      list = list.filter((m) => m.totalTasks > 0 && m.completionRate === 100);
    } else if (memberFilterStatus === 'in_progress') {
      list = list.filter((m) => m.totalTasks > 0 && (m.submitted > 0 || (m.completed > 0 && m.completionRate < 100)));
    } else if (memberFilterStatus === 'pending') {
      list = list.filter((m) => m.totalTasks > 0 && m.pending > 0 && m.completed === 0 && m.submitted === 0);
    }

    return list;
  }, [teamProgressData, studentTeam, memberSearchQuery, memberFilterStatus]);

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

  const getPageInfo = () => {
    if (activeNav === 'my-tasks') {
      return { breadcrumb: 'My Tasks', title: 'My Tasks & Deliverables', mobileTitle: 'My Tasks' };
    }
    if (activeNav === 'resources') {
      return { breadcrumb: 'Resources', title: 'Learning Resources Hub', mobileTitle: 'Resources' };
    }
    if (activeNav === 'progress') {
      return { breadcrumb: 'Team Progress', title: 'Team Progress & Roster', mobileTitle: 'Team & Progress' };
    }
    return { breadcrumb: 'Overview', title: 'Student Overview', mobileTitle: 'Overview' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-slate-50/60 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            <SidebarLogo
              logo={{
                href: '/',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-white shadow-md p-1">
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
                  icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.8} />,
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
                  icon: <CheckSquare className="w-6 h-6" strokeWidth={1.8} />,
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
                  icon: <BookOpen className="w-6 h-6" strokeWidth={1.8} />,
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
                  icon: <Users className="w-6 h-6" strokeWidth={1.8} />,
                }}
                isActive={activeNav === 'progress'}
                onClick={() => {
                  navigate('/student/progress');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarSectionLabel label="Account & Security" />
              <nav className="mt-1 space-y-1">
                <SidebarLink
                  link={{
                    href: '#password',
                    label: 'Change Password',
                    icon: <KeyRound className="w-6 h-6 text-amber-600" strokeWidth={1.8} />,
                  }}
                  isActive={false}
                  onClick={(e) => {
                    e?.preventDefault?.();
                    setPassError('');
                    setPassSuccess('');
                    setShowPasswordChangeModal(true);
                    setMobileSidebarOpen(false);
                  }}
                />
              </nav>
            </nav>

            {isTeamLead && (
              <>
                <SidebarSectionLabel label="Lead Role" />
                <nav className="mt-1 space-y-1">
                  <SidebarLink
                    link={{
                      href: '/teamlead/tasks',
                      label: 'Team Lead Workspace',
                      icon: <ShieldCheck className="w-6 h-6 text-amber-600" strokeWidth={1.8} />,
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
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header */}
        <header className="min-h-[64px] sm:min-h-[76px] lg:h-[84px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
            {/* Mobile / Tablet Hamburger Toggle Button - Same as Admin Dashboard */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-800 hover:bg-black/5 shrink-0 cursor-pointer"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb + Editorial Page Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 font-medium leading-none mb-1 truncate">
                <span className="hidden min-[420px]:inline">Student Workspace</span>
                <span className="hidden min-[420px]:inline text-slate-400">/</span>
                <span className="text-slate-900 font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="font-bold tracking-tight text-base sm:text-2xl lg:text-[28px] text-slate-900 leading-tight truncate">
                <span className="sm:hidden">{pageInfo.mobileTitle || pageInfo.title}</span>
                <span className="hidden sm:inline">{pageInfo.title}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Return to Landing Page */}
            <Link
              to="/"
              className="w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 flex items-center justify-center gap-1.5 rounded-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Return to Landing Page"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Landing Page</span>
            </Link>

            {/* Daily Submission Streak Badge */}
            <div
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-semibold shadow-2xs shrink-0"
              title="Daily Task Submission Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{streakData.currentStreak}</span>
              <span className="hidden min-[480px]:inline"> {streakData.currentStreak === 1 ? 'Day' : 'Days'} Streak</span>
            </div>

            {/* Change Password Action Button (Hidden on mobile, available on sm+) */}
            <button
              type="button"
              onClick={() => {
                setPassError('');
                setPassSuccess('');
                setShowPasswordChangeModal(true);
              }}
              className="hidden sm:flex items-center justify-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Change Password</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in">
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
              <button
                type="button"
                onClick={() => navigate('/teamlead/tasks')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-800 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
                title="Team Lead Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Team Lead Portal</span>
              </button>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 custom-scroll">
          <div className="w-full space-y-6">
            {/* ============================================================= */}
            {/* VIEW 1: OVERVIEW */}
            {/* ============================================================= */}
            {activeNav === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Welcome Card */}
                <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      Welcome back, {user?.name || 'Developer'}! 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {studentTeam
                        ? `${studentTeam.name} • ${studentTeam.track || 'Engineering Track'}`
                        : 'C4GT HUB 2026 – 2027 • Track your progress and submit deliverables.'}
                    </p>
                  </div>
                  <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-2.5 sm:self-auto self-stretch">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPassError('');
                        setPassSuccess('');
                        setShowPasswordChangeModal(true);
                      }}
                      className="gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs w-full min-[420px]:w-auto justify-center"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Change Password</span>
                    </Button>
                    <Button
                      onClick={() => navigate('/student/my-tasks')}
                      className="gap-2 w-full min-[420px]:w-auto justify-center"
                    >
                      <span>View All Tasks</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Priority Action Item</Badge>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${isTaskAdmin(nextPriorityTask)
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                            }`}>
                            {isTaskAdmin(nextPriorityTask) ? 'Admin Milestone' : 'Team Lead Sprint'}
                          </span>
                        </div>
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

                    <CardFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-500">Status:</span>
                        {getStatusBadge(nextPriorityTask.assignment?.status || nextPriorityTask.status)}
                      </div>
                      <Button onClick={() => setSelectedTask(nextPriorityTask)} size="sm" className="w-full sm:w-auto justify-center">
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

                {/* Team Lead Active Sprints & Tasks Section on Overview */}
                {teamLeadTasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Team Lead Sprints & Tasks ({teamLeadTasks.length})
                        </h3>
                      </div>
                      <Button
                        variant="link"
                        onClick={() => {
                          setTaskSourceTab('teamlead');
                          navigate('/student/my-tasks');
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        View All in Tasks ({teamLeadTasks.length}) →
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamLeadTasks.slice(0, 4).map((t) => {
                        const status = t.assignment?.status || t.status || 'pending';
                        const isCompleted = status === 'completed';
                        const isSubmitted = status === 'submitted';
                        return (
                          <Card key={t._id} className="p-4 hover:border-slate-300 transition-colors flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200/60 uppercase">
                                  Team Lead Sprint
                                </span>
                                {getStatusBadge(status)}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{t.title}</h4>
                              <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(t.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                              <Button
                                size="sm"
                                variant={isCompleted ? 'outline' : 'default'}
                                onClick={() => setSelectedTask(t)}
                                className="h-7 text-xs"
                              >
                                {isCompleted ? 'View Work' : isSubmitted ? 'Under Review' : 'Submit Work'}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full sm:w-auto">
                    <button
                      onClick={() => setTaskStatusFilter('all')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${taskStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      All ({scopedTaskStats.total})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('todo')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${taskStatusFilter === 'todo'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      To Do ({scopedTaskStats.pending})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('submitted')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${taskStatusFilter === 'submitted'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Under Review ({scopedTaskStats.submitted})
                    </button>
                    <button
                      onClick={() => setTaskStatusFilter('completed')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${taskStatusFilter === 'completed'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Completed ({scopedTaskStats.completed})
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

                {/* Assignment Source Tabs (All vs Team Lead vs Admin) */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskSourceTab('all');
                      setTaskStatusFilter('all');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${taskSourceTab === 'all'
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Tasks</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${taskSourceTab === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {tasks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTaskSourceTab('teamlead');
                      setTaskStatusFilter('all');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${taskSourceTab === 'teamlead'
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Team Lead</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${taskSourceTab === 'teamlead'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {teamLeadTasks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTaskSourceTab('admin');
                      setTaskStatusFilter('all');
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${taskSourceTab === 'admin'
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${taskSourceTab === 'admin'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {adminTasks.length}
                    </span>
                  </button>
                </div>

                {/* Tasks List */}
                {loadingTasks ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <SkeletonTaskCard key={idx} />
                    ))}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
                    <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      {taskSourceTab === 'teamlead'
                        ? 'No Team Lead tasks found'
                        : taskSourceTab === 'admin'
                          ? 'No Admin tasks found'
                          : 'No tasks found'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {taskSearchQuery
                        ? 'Try clearing your search terms.'
                        : taskSourceTab === 'teamlead'
                          ? 'Your Team Lead has not assigned any tasks in this category.'
                          : taskSourceTab === 'admin'
                            ? 'No admin milestones assigned in this category.'
                            : 'No tasks assigned in this category.'}
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
                                {isTaskAdmin(task) ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                                    <span>Admin Task</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-blue-600" />
                                    <span>Team Lead Task</span>
                                  </span>
                                )}
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

                          <CardFooter className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-xs text-slate-500 w-full sm:w-auto">
                              {isCompleted
                                ? isTaskAdmin(task)
                                  ? '✓ Work reviewed and accepted by Admin'
                                  : '✓ Work reviewed and accepted by Team Lead'
                                : isSubmitted
                                  ? isTaskAdmin(task)
                                    ? '⏳ Work submitted — Admin review in progress'
                                    : '⏳ Work submitted — Team Lead review in progress'
                                  : 'Google Drive links required for review'}
                            </span>
                            <Button
                              onClick={() => setSelectedTask(task)}
                              variant={isCompleted ? 'outline' : 'default'}
                              size="sm"
                              className="w-full sm:w-auto justify-center"
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resourceCategory === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      All ({hubResources.length})
                    </button>
                    <button
                      onClick={() => setResourceCategory('docs')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resourceCategory === 'docs'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Docs & PDFs
                    </button>
                    <button
                      onClick={() => setResourceCategory('code')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resourceCategory === 'code'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      Repositories
                    </button>
                    <button
                      onClick={() => setResourceCategory('dsa')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resourceCategory === 'dsa'
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <SkeletonResourceCard key={idx} />
                    ))}
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
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${resItem.isCompleted
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
                    {/* Header with Title and Refresh */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 shrink-0" />
                          <span className="break-words">Team Velocity & Deliverables Progress</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Monitor live sprint completion, team submissions, and individual member contribution velocity.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchStudentTeam}
                          disabled={loadingTeamProgress}
                          className="h-8 gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 shadow-2xs w-full sm:w-auto justify-center"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingTeamProgress ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
                          <span>Sync Progress</span>
                        </Button>
                      </div>
                    </div>

                    {/* Team Summary Hero & Lead */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
                      {/* Team Overview Card */}
                      <Card className="lg:col-span-2 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs">
                        <CardHeader className="p-3.5 sm:p-6 pb-2 sm:pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#1C1B1A] text-white text-[10px] sm:text-[11px] font-mono font-bold tracking-wider">
                                TEAM {studentTeam.teamNumber}
                              </span>
                              <span className="text-[11px] sm:text-xs text-[#66645E] font-medium">C4GT HUB 2026 – 2027</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0] text-[10px] sm:text-xs font-semibold">
                              {studentTeam.members?.length || 0} Members Enrolled
                            </span>
                          </div>

                          <CardTitle className="text-lg sm:text-xl font-black text-[#1C1B1A] mt-2 break-words">
                            {studentTeam.name}
                          </CardTitle>

                          {/* Assigned Project / Responsibility - Fully responsive wrapping */}
                          <div className="mt-2 w-full max-w-full">
                            <div className="flex items-start gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-lg bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0] text-xs font-semibold shadow-2xs max-w-full">
                              <Target className="w-3.5 h-3.5 text-[#1C1B1A] shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1 break-words">
                                <span className="text-[#66645E] font-medium">Project: </span>
                                <span className="font-bold text-[#1C1B1A]">{studentTeam.project || studentTeam.track || 'C4GT Open Source Project'}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 pt-1 sm:pt-1">
                          {/* Team Multi-segment Progress Bar */}
                          <div className="space-y-2 bg-[#F9F8F3] p-2.5 sm:p-3.5 rounded-xl border border-[#E0DDD0]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-1 sm:gap-2">
                              <span className="text-[#1C1B1A] flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                                <span>Overall Team Velocity</span>
                              </span>
                              <span className="font-mono text-[11px] sm:text-xs">
                                <span className="text-emerald-700 font-bold">{teamProgressData?.totalCompleted ?? 0}</span>
                                <span className="text-[#66645E]"> of {teamProgressData?.totalDeliverables ?? 0} Verified </span>
                                <span className="text-emerald-700 font-bold">({teamProgressData?.teamCompletionRate ?? 0}%)</span>
                              </span>
                            </div>

                            {/* Stacked Progress Bar */}
                            <div className="w-full h-2.5 sm:h-3 rounded-full bg-stone-200/80 overflow-hidden flex shadow-inner border border-stone-200/50">
                              <div
                                style={{
                                  width: `${
                                    teamProgressData?.totalDeliverables
                                      ? Math.min(100, Math.round((teamProgressData.totalCompleted / teamProgressData.totalDeliverables) * 100))
                                      : 0
                                  }%`,
                                }}
                                className="h-full bg-emerald-500 transition-all duration-500"
                                title={`Verified: ${teamProgressData?.totalCompleted || 0}`}
                              />
                              <div
                                style={{
                                  width: `${
                                    teamProgressData?.totalDeliverables
                                      ? Math.min(100, Math.round((teamProgressData.totalSubmitted / teamProgressData.totalDeliverables) * 100))
                                      : 0
                                  }%`,
                                }}
                                className="h-full bg-amber-500 transition-all duration-500"
                                title={`Under Review: ${teamProgressData?.totalSubmitted || 0}`}
                              />
                            </div>

                            {/* Progress Legend */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-medium pt-1 text-[#66645E] gap-1.5">
                              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10px] sm:text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                                  <span className="text-emerald-800 font-semibold">{teamProgressData?.totalCompleted ?? 0} Verified</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-2xs" />
                                  <span className="text-amber-800 font-semibold">{teamProgressData?.totalSubmitted ?? 0} In Review</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400 shrink-0 shadow-2xs" />
                                  <span className="text-stone-600 font-medium">{teamProgressData?.totalPending ?? 0} Pending</span>
                                </div>
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-[#66645E] font-mono">
                                Total Velocity: <span className="font-bold text-[#1C1B1A]">{teamProgressData?.teamSubmissionRate ?? 0}%</span> Submitted
                              </div>
                            </div>
                          </div>

                          {/* Quick Scope Breakdown */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-[11px] sm:text-xs">
                            <span className="text-[#66645E] font-medium">Assignment Sources:</span>
                            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#EEECDF] text-[#1C1B1A] font-semibold border border-[#E0DDD0]">
                              🏛️ Admin Milestones: {teamProgressData?.adminTasksCount ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#EEECDF] text-[#1C1B1A] font-semibold border border-[#E0DDD0]">
                              ⚡ Team Lead Tasks: {teamProgressData?.teamLeadTasksCount ?? 0}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Team Lead Card */}
                      <Card className="border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs flex flex-col justify-between">
                        <CardHeader className="p-3.5 sm:p-6 pb-2 sm:pb-3">
                          <div className="flex items-center justify-between">
                            <CardDescription className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#66645E]">
                              Assigned Team Lead
                            </CardDescription>
                            <span className="px-2 py-0.5 rounded-full bg-[#EEECDF] text-[#1C1B1A] text-[10px] font-bold border border-[#E0DDD0] flex items-center gap-1">
                              <Crown className="w-3 h-3 text-[#1C1B1A]" />
                              LEAD
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 min-w-0">
                            <UserAvatar
                              user={studentTeam.teamLeadId}
                              size="w-10 h-10 sm:w-12 sm:h-12"
                              rounded="rounded-xl"
                              animate="always"
                              className="shadow-xs shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-sm sm:text-base font-bold text-[#1C1B1A] truncate">
                                {studentTeam.teamLeadId?.name || 'Lead Assigned'}
                              </CardTitle>
                              <p className="text-[11px] sm:text-xs text-[#66645E] font-mono truncate">
                                {studentTeam.teamLeadId?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3.5 sm:p-6 space-y-2 text-xs pt-0">
                          <div className="p-2.5 sm:p-3 bg-[#F9F8F3] rounded-xl border border-[#E0DDD0] space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-2 text-[#4A4843] truncate">
                              <Mail className="w-3.5 h-3.5 text-[#66645E] shrink-0" />
                              <a
                                href={`mailto:${studentTeam.teamLeadId?.email}`}
                                className="hover:underline font-mono text-[10px] sm:text-[11px] truncate text-[#1C1B1A] hover:text-black"
                              >
                                {studentTeam.teamLeadId?.email || 'N/A'}
                              </a>
                            </div>
                            {(studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber) && (
                              <div className="flex items-center gap-2 text-[#4A4843] truncate">
                                <Phone className="w-3.5 h-3.5 text-[#1C1B1A] shrink-0" />
                                <a
                                  href={`tel:${studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber}`}
                                  className="hover:underline text-[10px] sm:text-[11px] font-medium text-[#1C1B1A] hover:text-black"
                                >
                                  {studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber}
                                </a>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[#66645E] text-center font-medium">
                            Reach out to your team lead for milestone reviews & guidance.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Team Metrics 4-Card Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                      {/* 1. Total Deliverables */}
                      <Card className="p-3 sm:p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:border-[#D5D0C2] transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-xs font-bold text-[#66645E] uppercase tracking-wider truncate">Total Deliverables</span>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black text-[#1C1B1A]">
                          {teamProgressData?.totalDeliverables ?? 0}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#66645E] mt-0.5 truncate sm:whitespace-normal">
                          Across all {studentTeam.members?.length || 0} members
                        </p>
                      </Card>

                      {/* 2. Verified & Approved */}
                      <Card className="p-3 sm:p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:border-[#D5D0C2] transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">Verified</span>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black text-emerald-700">
                          {teamProgressData?.totalCompleted ?? 0}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-emerald-700/80 font-medium mt-0.5 truncate sm:whitespace-normal">
                          {teamProgressData?.teamCompletionRate ?? 0}% completed
                        </p>
                      </Card>

                      {/* 3. Under Review */}
                      <Card className="p-3 sm:p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:border-[#D5D0C2] transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider truncate">In Review</span>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black text-amber-700">
                          {teamProgressData?.totalSubmitted ?? 0}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-amber-700/80 font-medium mt-0.5 truncate sm:whitespace-normal">
                          Awaiting review
                        </p>
                      </Card>

                      {/* 4. Pending Submissions */}
                      <Card className="p-3 sm:p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:border-[#D5D0C2] transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-xs font-bold text-stone-600 uppercase tracking-wider truncate">Pending</span>
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-stone-100 text-stone-600 border border-stone-200 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-black text-stone-700">
                          {teamProgressData?.totalPending ?? 0}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium mt-0.5 truncate sm:whitespace-normal">
                          To be submitted
                        </p>
                      </Card>
                    </div>

                    {/* View Switcher & Member Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      {/* View Switch Buttons - full width grid on mobile */}
                      <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-[#EEECDF] border border-[#E0DDD0] rounded-xl">
                        <button
                          type="button"
                          onClick={() => setTeamActiveViewTab('members')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            teamActiveViewTab === 'members'
                              ? 'bg-[#1C1B1A] text-white shadow-2xs'
                              : 'text-[#66645E] hover:text-[#1C1B1A]'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Members ({memberCounts.all})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamActiveViewTab('deliverables')}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            teamActiveViewTab === 'deliverables'
                              ? 'bg-[#1C1B1A] text-white shadow-2xs'
                              : 'text-[#66645E] hover:text-[#1C1B1A]'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Tasks ({teamProgressData?.totalTasksCount ?? 0})</span>
                        </button>
                      </div>

                      {/* Search Input for Members */}
                      {teamActiveViewTab === 'members' && (
                        <div className="relative w-full sm:w-72">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#66645E]" />
                          <input
                            type="text"
                            placeholder="Filter by name, roll, or branch..."
                            value={memberSearchQuery}
                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1B1A] focus:border-[#1C1B1A] transition-all placeholder:text-[#9E9C94]"
                          />
                          {memberSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setMemberSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A] text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Member Filter Chips (Horizontally scrollable on small screens) */}
                    {teamActiveViewTab === 'members' && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scroll text-[11px] sm:text-xs">
                        <span className="text-[#66645E] font-semibold flex items-center gap-1 shrink-0 mr-1">
                          <Filter className="w-3 h-3 text-[#66645E]" /> Filter:
                        </span>
                        <button
                          type="button"
                          onClick={() => setMemberFilterStatus('all')}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                            memberFilterStatus === 'all'
                              ? 'bg-[#1C1B1A] text-white'
                              : 'bg-white border border-[#E0DDD0] text-[#66645E] hover:bg-[#F4F1E8]'
                          }`}
                        >
                          All ({memberCounts.all})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberFilterStatus('completed')}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                            memberFilterStatus === 'completed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          Completed ({memberCounts.completed})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberFilterStatus('in_progress')}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                            memberFilterStatus === 'in_progress'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50/70 border border-amber-200/80 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          In Review ({memberCounts.inProgress})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberFilterStatus('pending')}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                            memberFilterStatus === 'pending'
                              ? 'bg-stone-700 text-white shadow-xs'
                              : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          Pending ({memberCounts.pending})
                        </button>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* VIEW TAB 1: INDIVIDUAL TEAM MEMBERS PROGRESS */}
                    {/* ========================================================= */}
                    {teamActiveViewTab === 'members' && (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-[#66645E] uppercase tracking-wider">
                            Individual Member Breakdown ({filteredMemberStats.length} shown)
                          </h3>
                        </div>

                        {filteredMemberStats.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5">
                            {filteredMemberStats.map((member) => {
                              const isCompletedAll = member.totalTasks > 0 && member.completionRate === 100;
                              const hasSubmitted = member.submitted > 0;
                              const hasStarted = member.completed > 0;

                              return (
                                <Card
                                  key={member._id}
                                  className="p-3.5 sm:p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:shadow-xs transition-all hover:border-[#D5D0C2] flex flex-col justify-between"
                                >
                                  <div>
                                    {/* Member Header */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <UserAvatar
                                          user={member}
                                          size="w-9 h-9 sm:w-10 sm:h-10"
                                          rounded="rounded-xl"
                                          animate="always"
                                          className="shadow-2xs shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <h4 className="text-xs sm:text-sm font-bold text-[#1C1B1A] truncate" title={member.name}>
                                            {member.name}
                                          </h4>
                                          <p className="text-[10px] sm:text-[11px] text-[#66645E] font-mono truncate" title={member.email}>
                                            {member.email}
                                          </p>
                                          {member.rollNumber && (
                                            <p className="text-[10px] text-[#66645E] font-mono truncate">
                                              Roll: <span className="font-semibold text-[#1C1B1A]">{member.rollNumber}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      {member.totalTasks > 0 ? (
                                        isCompletedAll ? (
                                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            Completed
                                          </span>
                                        ) : hasSubmitted ? (
                                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] sm:text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            In Review
                                          </span>
                                        ) : hasStarted ? (
                                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[9px] sm:text-[10px] font-bold border border-blue-200 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-blue-600" />
                                            In Progress
                                          </span>
                                        ) : member.pending > 0 ? (
                                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] sm:text-[10px] font-bold border border-stone-200 flex items-center gap-1">
                                            Pending
                                          </span>
                                        ) : null
                                      ) : null}
                                    </div>

                                    {/* Branch / Year Tag */}
                                    {(member.branch || member.year) && (
                                      <div className="mt-2 text-[10px] text-[#4A4843] font-medium bg-[#EEECDF] px-2 py-0.5 rounded-md border border-[#E0DDD0] w-fit">
                                        {member.branch} {member.year ? `• Year ${member.year}` : ''}
                                      </div>
                                    )}

                                    {/* Member Progress Bar */}
                                    <div className="mt-3 space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold">
                                        <span className="text-[#66645E]">Completion</span>
                                        <span className="font-mono text-emerald-700 font-bold">
                                          {member.completionRate}%
                                        </span>
                                      </div>
                                      <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden shadow-inner border border-stone-200/50">
                                        <div
                                          style={{ width: `${member.completionRate}%` }}
                                          className="h-full bg-emerald-500 transition-all duration-300"
                                        />
                                      </div>
                                    </div>

                                    {/* Deliverables Breakdown Matrix */}
                                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-3 pt-2.5 border-t border-[#E0DDD0] text-center">
                                      <div className="p-1 sm:p-1.5 bg-emerald-50/80 rounded-lg border border-emerald-200/80">
                                        <div className="text-xs font-black text-emerald-800 font-mono">
                                          {member.completed}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700">Verified</div>
                                      </div>
                                      <div className="p-1 sm:p-1.5 bg-amber-50/80 rounded-lg border border-amber-200/80">
                                        <div className="text-xs font-black text-amber-800 font-mono">
                                          {member.submitted}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-bold text-amber-700">In Review</div>
                                      </div>
                                      <div className="p-1 sm:p-1.5 bg-stone-100/80 rounded-lg border border-stone-200/80">
                                        <div className="text-xs font-black text-stone-700 font-mono">
                                          {member.pending}
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-bold text-stone-500">Pending</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer Contact link */}
                                  <div className="mt-3 pt-2 border-t border-[#E0DDD0] flex items-center justify-between text-[10px] sm:text-[11px] text-[#66645E]">
                                    <span className="font-mono text-[10px] truncate mr-2">
                                      {member.completed}/{member.totalTasks} deliverables verified
                                    </span>
                                    <a
                                      href={`mailto:${member.email}`}
                                      className="text-[#1C1B1A] hover:text-black font-semibold inline-flex items-center gap-1 hover:underline shrink-0"
                                    >
                                      <Mail className="w-3 h-3 text-[#66645E]" />
                                      Email
                                    </a>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-[#FDFCF9] rounded-2xl border border-dashed border-[#E0DDD0]">
                            <Users className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
                            <p className="text-xs font-bold text-[#1C1B1A]">No team members match this filter</p>
                            <p className="text-[11px] text-[#66645E] mt-0.5">Try clearing your search query or selecting "All".</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMemberSearchQuery('');
                                setMemberFilterStatus('all');
                              }}
                              className="mt-3 text-xs h-7 border-[#D5D0C2] text-[#1C1B1A] hover:bg-[#F4F1E8]"
                            >
                              Reset Filters
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* VIEW TAB 2: TEAM ASSIGNMENTS & DELIVERABLES ROADMAP */}
                    {/* ========================================================= */}
                    {teamActiveViewTab === 'deliverables' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-[#66645E] uppercase tracking-wider">
                            Team Deliverables Breakdown ({teamProgressData?.tasksBreakdown?.length || 0} active)
                          </h3>
                        </div>

                        {Array.isArray(teamProgressData?.tasksBreakdown) && teamProgressData.tasksBreakdown.length > 0 ? (
                          <div className="space-y-3">
                            {teamProgressData.tasksBreakdown.map((task) => {
                              const totalAssigned = task.assignedCount || 1;
                              const pct = Math.round(((task.completedCount || 0) / totalAssigned) * 100);
                              const reviewPct = Math.round(((task.submittedCount || 0) / totalAssigned) * 100);

                              return (
                                <Card key={task._id} className="p-4 border-[#E0DDD0] bg-[#FDFCF9] shadow-2xs hover:border-[#D5D0C2] transition-colors">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-[#EEECDF] text-[#1C1B1A] text-[10px] font-bold border border-[#E0DDD0]">
                                          {task.source === 'admin' ? '🏛️ Admin Milestone' : '⚡ Team Lead Task'}
                                        </span>
                                        {task.deadline && (
                                          <span className="text-[11px] text-[#66645E] flex items-center gap-1 font-mono">
                                            <Calendar className="w-3 h-3 text-[#66645E]" />
                                            Due {new Date(task.deadline).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-sm font-bold text-[#1C1B1A] truncate">
                                        {task.title}
                                      </h4>
                                    </div>

                                    {/* Team Completion Ratio */}
                                    <div className="sm:text-right shrink-0">
                                      <div className="text-xs font-bold text-[#1C1B1A] font-mono">
                                        {task.completedCount} / {task.assignedCount} Completed
                                      </div>
                                      <div className="text-[10px] text-[#66645E]">
                                        {pct}% team completion
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="mt-3 space-y-1.5">
                                    <div className="w-full h-2 rounded-full bg-stone-200/80 overflow-hidden flex shadow-inner border border-stone-200/50">
                                      <div
                                        style={{ width: `${pct}%` }}
                                        className="h-full bg-emerald-500 transition-all duration-300"
                                        title={`Verified: ${task.completedCount}`}
                                      />
                                      <div
                                        style={{ width: `${reviewPct}%` }}
                                        className="h-full bg-amber-500 transition-all duration-300"
                                        title={`In Review: ${task.submittedCount}`}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-medium">
                                      <span className="text-emerald-800 font-semibold">{task.completedCount} Verified</span>
                                      <span className="text-amber-800 font-semibold">{task.submittedCount} In Review</span>
                                      <span className="text-stone-600">{task.pendingCount} Pending</span>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-[#FDFCF9] rounded-2xl border border-dashed border-[#E0DDD0]">
                            <Layers className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
                            <p className="text-xs font-bold text-[#1C1B1A]">No deliverables assigned to this team yet</p>
                            <p className="text-[11px] text-[#66645E] mt-0.5">Tasks created by your Admin or Team Lead will appear here.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="p-12 text-center bg-white border-dashed">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">Not Assigned to a Team Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Your administrator will assign you to one of the 9 C4GT HUB teams shortly.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scroll">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge variant="default" className="text-[11px] px-2.5 py-0.5 font-semibold">
                    Task Submission
                  </Badge>
                  {isTaskAdmin(selectedTask) ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[11px] px-2.5 py-0.5 font-semibold">
                      Admin Task • Reviewed by Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[11px] px-2.5 py-0.5 font-semibold">
                      Team Lead Task • Reviewed by Team Lead
                    </Badge>
                  )}
                  {getStatusBadge(selectedTask.assignment?.status || selectedTask.status)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 break-words leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 -mr-1 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reviewer Notice */}
            {isTaskAdmin(selectedTask) ? (
              <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Admin Task:</strong> Your submission deliverables and proofs will be sent directly to the <strong>Admin Dashboard</strong> for official review and grading.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Team Lead Task:</strong> Your submission deliverables will be reviewed by your <strong>Team Lead</strong>.
                </span>
              </div>
            )}

            {/* Fresher Guidance Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <span>📋</span>
                <span>Submission Instructions for Students:</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 leading-relaxed">
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
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{isTaskAdmin(selectedTask) ? 'Admin Feedback / Revision Note:' : 'Team Lead Feedback / Revision Note:'}</span>
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
                  <div key={idx} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{isDoc ? '📄' : isSlide ? '📊' : '🔗'}</span>
                        <span>{name} Link</span>
                      </label>
                      {submissionDeliverables[name] && (
                        <a
                          href={submissionDeliverables[name]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 transition-colors"
                        >
                          <span>Preview Drive Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
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
                  {isTaskAdmin(selectedTask)
                    ? 'Remarks / Notes for Admin (Optional)'
                    : 'Remarks / Notes for Team Lead (Optional)'}
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
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingDeliverables}
                  className="gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
                >
                  {submittingDeliverables ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {isTaskAdmin(selectedTask)
                          ? 'Submit for Admin Review'
                          : 'Submit for Team Lead Review'}
                      </span>
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
          onChangePassword={() => {
            setPassError('');
            setPassSuccess('');
            setShowPasswordChangeModal(true);
          }}
        />
      )}

      {/* MANDATORY / VOLUNTARY PASSWORD CHANGE MODAL */}
      {isPasswordModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isMandatoryPasswordChange
            ? 'bg-black/85 backdrop-blur-md'
            : 'bg-black/60 backdrop-blur-xs'
            }`}
          onClick={(e) => {
            // Prevent dismissal if mandatory
            if (!isMandatoryPasswordChange && e.target === e.currentTarget) {
              setShowPasswordChangeModal(false);
              setPassError('');
              setPassSuccess('');
            }
          }}
        >
          <div
            className="bg-[#F9F8F3] border border-[#E0DDD0] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E0DDD0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight text-xl text-[#1C1B1A]">
                    {isMandatoryPasswordChange ? 'Set Your New Password' : 'Change Account Password'}
                  </h3>
                  <p className="text-xs text-[#66645E]">
                    {isMandatoryPasswordChange
                      ? 'First-Time Login Security Requirement'
                      : 'Update Student Login Password'}
                  </p>
                </div>
              </div>
              {!isMandatoryPasswordChange && (
                <button
                  onClick={() => {
                    setShowPasswordChangeModal(false);
                    setPassError('');
                    setPassSuccess('');
                  }}
                  className="p-1.5 rounded-full hover:bg-[#EAE7DC] text-[#66645E] hover:text-[#1C1B1A] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mandatory Alert Banner */}
            {isMandatoryPasswordChange && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Mandatory Security Requirement</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Welcome <strong>{user?.name}</strong>! Your account is currently using the initial default password (your Roll Number: <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold">{user?.rollNumber || 'Roll Number'}</code>). You must set a personal password before opening the Student Dashboard.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs">
              {passError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder={user?.rollNumber ? `Initial: ${user.rollNumber}` : 'Current password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A]"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#66645E] mt-1">Default initial password is your University Roll Number.</p>
              </div>

              {/* New Password */}
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A]"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66645E] hover:text-[#1C1B1A]"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-white/80 border border-[#E0DDD0] rounded-xl p-3 space-y-1.5 text-[11px] font-mono">
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-[#66645E]'}`}>
                  {newPassword.length >= 6 ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                  <span>At least 6 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${user?.rollNumber && newPassword && newPassword.toUpperCase() !== user.rollNumber.toUpperCase() ? 'text-emerald-700 font-semibold' : 'text-[#66645E]'}`}>
                  {user?.rollNumber && newPassword && newPassword.toUpperCase() !== user.rollNumber.toUpperCase() ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                  <span>Different from Roll Number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-semibold' : 'text-[#66645E]'}`}>
                  {newPassword && confirmPassword && newPassword === confirmPassword ? <Check className="w-3.5 h-3.5" /> : <span className="w-3.5 text-center">•</span>}
                  <span>Passwords match</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E0DDD0] flex items-center justify-between gap-3">
                {isMandatoryPasswordChange ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-[#66645E] hover:text-rose-600 transition-colors underline cursor-pointer"
                  >
                    Sign out instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChangeModal(false);
                      setPassError('');
                    }}
                    className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-[#1C1B1A] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isChangingPass || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${!isChangingPass && currentPassword && newPassword.length >= 6 && newPassword === confirmPassword
                    ? 'bg-[#1C1B1A] hover:bg-black text-white shadow-md cursor-pointer'
                    : 'bg-[#C2BEAF] text-[#66645E] cursor-not-allowed opacity-60'
                    }`}
                >
                  {isChangingPass ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isMandatoryPasswordChange ? 'Update & Enter Dashboard' : 'Save New Password'}</span>
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
