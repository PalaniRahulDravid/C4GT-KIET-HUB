import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLogo,
  SidebarSectionLabel,
  SidebarUser,
} from '../../components/AceternitySidebar';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Send,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Mail,
  Phone,
  GraduationCap,
  X,
  UserCheck,
  CheckSquare,
  Plus,
  Calendar,
  FileText,
  Flame,
  BookOpen,
  ExternalLink,
  ArrowRight,
  Home,
  Menu,
  LogOut,
} from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';

export default function TeamLeadDashboard() {
  const { user, token, apiBaseUrl, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'roster';

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'roster' | 'search' | 'invitations' | 'give-tasks' | 'student-dashboard'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'TL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'search':
        return 'Search Users & Add to Team';
      case 'invitations':
        return 'Pending Invitations';
      case 'give-tasks':
        return 'Give Tasks to Students';
      case 'roster':
      default:
        return 'Team Roster';
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['roster', 'search', 'invitations', 'give-tasks', 'student-dashboard'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Search users state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'available' | 'assigned'
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Invite modal / state
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteModalUser, setInviteModalUser] = useState(null);

  // Give Tasks to Students State
  const [teamTasks, setTeamTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [expandedTaskProgress, setExpandedTaskProgress] = useState({});

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskTargetGroup, setTaskTargetGroup] = useState('both');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const defaultDeliverables = [
    'Source Code Repo',
    'GitHub Pull Request',
    'Documentation / Spec',
    'Demo / Presentation',
  ];
  const [taskDeliverables, setTaskDeliverables] = useState([...defaultDeliverables]);
  const [customDeliverableInput, setCustomDeliverableInput] = useState('');

  // Student Dashboard Preview State
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentStreak, setStudentStreak] = useState(null);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch Team Lead's Team details
  const fetchMyTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/teamlead/my-team`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTeamData(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team lead data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Search Users across total registered users
  const fetchUsers = async () => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (filterType !== 'all') params.append('filter', filterType);

      const res = await fetch(`${API_BASE_URL}/teamlead/users?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setSearchResults(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch(`${API_BASE_URL}/teamlead/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTeamTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Failed to fetch team tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchStudentPreviewData = async () => {
    try {
      setLoadingStudentData(true);
      const [tasksRes, streakRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student/tasks`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE_URL}/student/streak`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        if (tData.success && Array.isArray(tData.tasks)) {
          setStudentTasks(tData.tasks);
        }
      }
      if (streakRes.ok) {
        const sData = await streakRes.json();
        if (sData.success) {
          setStudentStreak(sData);
        }
      }
    } catch (err) {
      console.error('Failed to load student preview data:', err);
    } finally {
      setLoadingStudentData(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'give-tasks') {
      fetchTeamTasks();
    } else if (activeTab === 'student-dashboard') {
      fetchStudentPreviewData();
    }
  }, [activeTab]);

  // Refetch search when tab is search or search query / filter changes
  useEffect(() => {
    if (activeTab === 'search') {
      const delay = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [activeTab, searchQuery, filterType]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyTeam();
    if (activeTab === 'search') fetchUsers();
    if (activeTab === 'give-tasks') fetchTeamTasks();
    if (activeTab === 'student-dashboard') fetchStudentPreviewData();
    showToast('Refreshed team workspace data.');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDescription.trim() || !taskDeadline) {
      showToast('Please provide Title, Description, and Deadline', 'error');
      return;
    }
    try {
      setSubmittingTask(true);
      const res = await fetch(`${API_BASE_URL}/teamlead/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          topic: taskTopic.trim() || teamData?.team?.track || 'Team Sprint',
          targetGroup: taskTargetGroup,
          deadline: taskDeadline,
          priority: taskPriority,
          deliverables: taskDeliverables,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Task assigned to team students successfully!', 'success');
        setTaskTitle('');
        setTaskDescription('');
        setTaskDeadline('');
        setShowTaskForm(false);
        fetchTeamTasks();
      } else {
        showToast(data.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      console.error('Create task error:', err);
      showToast('Error assigning task to students', 'error');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/teamlead/tasks/${taskId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Task deleted successfully', 'success');
        fetchTeamTasks();
      } else {
        showToast(data.message || 'Failed to delete task', 'error');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      showToast('Error deleting task', 'error');
    }
  };

  const toggleDeliverable = (item) => {
    if (taskDeliverables.includes(item)) {
      setTaskDeliverables((prev) => prev.filter((d) => d !== item));
    } else {
      setTaskDeliverables((prev) => [...prev, item]);
    }
  };

  const handleAddCustomDeliverable = () => {
    if (customDeliverableInput.trim() && !taskDeliverables.includes(customDeliverableInput.trim())) {
      setTaskDeliverables((prev) => [...prev, customDeliverableInput.trim()]);
      setCustomDeliverableInput('');
    }
  };

  // Send Invitation Handler
  const handleSendInvite = async () => {
    if (!inviteModalUser) return;
    try {
      setInvitingUserId(inviteModalUser._id);
      const res = await fetch(`${API_BASE_URL}/teamlead/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: inviteModalUser._id,
          message: inviteMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Invitation sent to ${inviteModalUser.name}!`, 'success');
        setInviteModalUser(null);
        setInviteMessage('');
        fetchMyTeam();
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to send invitation.', 'error');
      }
    } catch (err) {
      console.error('Invite error:', err);
      showToast('Failed to send invitation.', 'error');
    } finally {
      setInvitingUserId(null);
    }
  };

  // Cancel Invitation Handler
  const handleCancelInvite = async (invitationId, recipientName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teamlead/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Invitation to ${recipientName || 'user'} cancelled.`, 'success');
        fetchMyTeam();
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to cancel invitation.', 'error');
      }
    } catch (err) {
      console.error('Cancel invite error:', err);
      showToast('Error cancelling invitation.', 'error');
    }
  };

  // Remove Member Handler
  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your team?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/teamlead/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${memberName} removed from team.`, 'success');
        fetchMyTeam();
      } else {
        showToast(data.message || 'Failed to remove member.', 'error');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      showToast('Error removing member.', 'error');
    }
  };

  const team = teamData?.team;
  const maxMembers = teamData?.maxMembers || 9;
  const totalCount = teamData?.totalTeamCount || 0;
  const membersCount = teamData?.currentMembersCount || 0;
  const availableSlots = teamData?.availableSlots ?? Math.max(0, maxMembers - totalCount);
  const isFull = totalCount >= maxMembers;
  const pendingInvitations = teamData?.pendingInvitations || [];

  const progressPct = Math.min(100, Math.round((totalCount / maxMembers) * 100));

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#1C1B1A] animate-spin" />
        <p className="text-sm font-medium text-[#66645E]">Loading Team Lead Workspace...</p>
      </div>
    );
  }

  if (!teamData?.hasTeam || !team) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-[#FDFCF9] rounded-3xl border border-[#E0DDD0] shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text- font-bold text-[#1C1B1A]">
          No Team Assigned Yet
        </h2>
        <p className="text-xs text-[#66645E] max-w-md mx-auto leading-relaxed">
          You are authenticated as a <strong>Team Lead</strong>, but the Admin has not yet assigned you to one of the 9 cohort teams. Once assigned, you will be able to search all users and build your 9-member team.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Open Student Dashboard</span>
          </Link>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Assignment Status</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-[#F7F5EE] font-sans antialiased text-[#1C1B1A] select-none overflow-hidden">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all text-xs font-medium animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-[#1C1B1A] text-white border-black/20'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Profile Details Modal */}
      <ProfileDetailsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* ==================== ACETERNITY COLLAPSIBLE SIDEBAR ==================== */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          {/* Top: logo + nav */}
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            {/* Logo */}
            <SidebarLogo
              logo={{
                href: '/teamlead',
                icon: (
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-xs">
                    <C4GTLogo showText={false} imgClassName="h-7" />
                  </div>
                ),
                label: 'C4GT KIET HUB',
                badge: 'TEAM LEAD',
                sublabel: team?.name || 'Workspace',
              }}
              className="mb-4"
            />

            {/* Section label */}
            <SidebarSectionLabel label="Team Lead Workspace" />

            {/* Nav links */}
            <nav className="mt-2 space-y-1">
              <SidebarLink
                link={{
                  href: '/teamlead?tab=roster',
                  label: 'Team Roster',
                  icon: <Users className="w-5 h-5" />,
                  badge: `${totalCount}/${maxMembers}`,
                }}
                isActive={activeTab === 'roster'}
                onClick={() => {
                  handleTabChange('roster');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/teamlead?tab=search',
                  label: 'Search & Add Users',
                  icon: <Search className="w-5 h-5" />,
                }}
                isActive={activeTab === 'search'}
                onClick={() => {
                  handleTabChange('search');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/teamlead?tab=invitations',
                  label: 'Pending Invitations',
                  icon: <Send className="w-5 h-5" />,
                  badge: pendingInvitations.length > 0 ? pendingInvitations.length : undefined,
                }}
                isActive={activeTab === 'invitations'}
                onClick={() => {
                  handleTabChange('invitations');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/teamlead?tab=give-tasks',
                  label: 'Give Tasks to Students',
                  icon: <CheckSquare className="w-5 h-5" />,
                  badge: teamTasks.length > 0 ? teamTasks.length : undefined,
                }}
                isActive={activeTab === 'give-tasks'}
                onClick={() => {
                  handleTabChange('give-tasks');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/student',
                  label: 'Student Dashboard',
                  icon: <GraduationCap className="w-5 h-5" />,
                }}
                isActive={false}
                onClick={() => setMobileSidebarOpen(false)}
              />
            </nav>

            {/* Divider */}
            <div className="mx-2 my-4 border-t border-neutral-800/80" />

            {/* Exit to Main Site */}
            <SidebarLink
              link={{
                href: '/',
                label: 'Exit to Main Site',
                icon: <Home className="w-5 h-5 text-neutral-400" />,
              }}
              onClick={() => setMobileSidebarOpen(false)}
            />
          </div>

          {/* Bottom: Team Lead User profile */}
          <SidebarUser
            user={user}
            getInitials={getInitials}
            onProfileClick={() => setShowProfileModal(true)}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Top Sticky Header (~84px) */}
        <header className="h-[84px] bg-[#F9F8F3]/95 backdrop-blur-md border-b border-[#E2DDD0] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#1C1B1A] hover:bg-black/5 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-[#66645E] font-medium mb-1">
                <Link to="/teamlead" className="hover:text-[#1C1B1A] transition-colors">
                  Team Lead Portal
                </Link>
                <span className="text-[#9E9C94]">/</span>
                <span className="text-[#1C1B1A] font-semibold">{getPageTitle()}</span>
              </div>
              <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold text-[#1C1B1A] tracking-tight leading-none">
                {team.name}: {team.track || 'Engineering Track'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/student"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Student Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scroll bg-[#F7F5EE]">
          <div className="max-w-[1240px] mx-auto space-y-8">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0DDD0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-[#1C1B1A] text-white text-[10px] font-mono font-bold tracking-wider">
              TEAM LEAD PORTAL
            </span>
            <span className="text-xs text-[#66645E]">Cohort 2026 – 2027</span>
          </div>
          <h1 className="font-bold tracking-tight text-3xl sm:text-4xl font-bold text-[#1C1B1A] tracking-tight">
            {team.name}: {team.track || 'Engineering Track'}
          </h1>
          <p className="text-xs text-[#66645E] mt-1">
            Build and manage your 9-member team roster. Search across total users, send join requests, and coordinate your members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/student"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
            title="Open your Student Workspace & Learning Tasks"
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Student Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* Team Capacity Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Capacity Card */}
        <div className="md:col-span-2 bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center font-mono font-bold text-sm">
                {team.teamNumber}
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-[#66645E]">
                  TEAM ROSTER CAPACITY
                </span>
                <div className="text-2xl font-bold text-[#1C1B1A]">
                  {totalCount} / {maxMembers} Members
                </div>
              </div>
            </div>

            {isFull ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold text-rose-800 bg-rose-50 border border-rose-200">
                <XCircle className="w-3.5 h-3.5" />
                Team Full (Limit Reached)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {availableSlots} Slot{availableSlots === 1 ? '' : 's'} Available
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 bg-[#EFECE3] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-rose-500' : 'bg-[#1C1B1A]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#66645E] font-mono">
              <span>1 Team Lead (You)</span>
              <span>{membersCount} Member{membersCount === 1 ? '' : 's'} Joined</span>
              <span>Max: {maxMembers}</span>
            </div>
          </div>

          {isFull && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                Your team has reached the 9-member limit. To invite new members, you must remove an existing member first.
              </span>
            </div>
          )}
        </div>

        {/* Lead Identity Card */}
        <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase text-[#66645E]">
              Assigned Team Lead
            </span>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-sm">
                {team.teamLeadId?.name ? team.teamLeadId.name.slice(0, 2).toUpperCase() : 'TL'}
              </div>
              <div className="truncate">
                <div className="font-bold text-sm text-[#1C1B1A] truncate">{team.teamLeadId?.name || user?.name}</div>
                <div className="text-xs text-[#66645E] font-mono truncate">{team.teamLeadId?.email || user?.email}</div>
                <span className="inline-block mt-1 px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                  LEAD ACTIVE
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E0DDD0] flex items-center justify-between text-xs text-[#66645E]">
            <span>Pending Requests:</span>
            <span className="font-bold text-[#1C1B1A] font-mono">{pendingInvitations.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E0DDD0] pb-2">
        <button
          onClick={() => handleTabChange('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Roster ({totalCount} / {maxMembers})</span>
        </button>

        <button
          onClick={() => handleTabChange('search')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Users & Add to Team</span>
        </button>

        <button
          onClick={() => handleTabChange('invitations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
            activeTab === 'invitations'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Pending Invitations ({pendingInvitations.length})</span>
          {pendingInvitations.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('give-tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
            activeTab === 'give-tasks'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Give Tasks to Students ({teamTasks.length})</span>
          {teamTasks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {teamTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('student-dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
            activeTab === 'student-dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50/70 hover:bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-current" />
          <span>Student Dashboard</span>
        </button>
      </div>

      {/* ================= TAB 1: TEAM ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text- font-bold text-[#1C1B1A]">
                Current Team Members
              </h3>
              <p className="text-xs text-[#66645E] mt-0.5">
                Every member who accepts your team invitation will appear here, up to the maximum of 9 members.
              </p>
            </div>

            {!isFull && (
              <button
                onClick={() => setActiveTab('search')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Invite More Members</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Team Lead Card (Always slot 1) */}
            <div className="bg-[#FDFCF9] rounded-2xl p-5 border-2 border-[#1C1B1A]/20 shadow-xs space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66645E]">
                  Slot 1 • Team Lead
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  LEAD
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {team.teamLeadId?.name ? team.teamLeadId.name.slice(0, 2).toUpperCase() : 'TL'}
                </div>
                <div className="truncate flex-1">
                  <div className="font-bold text-sm text-[#1C1B1A] truncate">{team.teamLeadId?.name}</div>
                  <div className="text-xs text-[#66645E] font-mono truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                    <a href={`mailto:${team.teamLeadId?.email}`} className="hover:underline hover:text-[#1C1B1A] truncate">
                      {team.teamLeadId?.email}
                    </a>
                  </div>
                  {(team.teamLeadId?.phone || team.teamLeadId?.phoneNumber) && (
                    <div className="text-xs text-emerald-800 font-mono truncate flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                      <a
                        href={`tel:${team.teamLeadId?.phone || team.teamLeadId?.phoneNumber}`}
                        className="hover:underline font-semibold"
                      >
                        {team.teamLeadId?.phone || team.teamLeadId?.phoneNumber}
                      </a>
                    </div>
                  )}
                  <div className="text-[10px] text-[#88867E] mt-1 font-mono">
                    Lead Mentor • {team.teamLeadId?.rollNumber ? `${team.teamLeadId.rollNumber}` : 'Lead'}
                  </div>
                </div>
              </div>
            </div>

            {/* Members Cards */}
            {team.members && team.members.length > 0 ? (
              team.members.map((member, idx) => (
                <div
                  key={member._id || idx}
                  className="bg-[#FDFCF9] rounded-2xl p-5 border border-[#E0DDD0] shadow-2xs space-y-3 relative hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#66645E]">
                        Slot {idx + 2} • Member
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ACTIVE
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-10 h-10 rounded-full bg-[#EFECE3] text-[#1C1B1A] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        {member.name ? member.name.slice(0, 2).toUpperCase() : 'M'}
                      </div>
                      <div className="truncate flex-1">
                        <div className="font-bold text-xs text-[#1C1B1A] truncate">{member.name}</div>
                        <div className="text-[11px] text-[#66645E] font-mono truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                          <a href={`mailto:${member.email}`} className="hover:underline hover:text-[#1C1B1A] truncate">
                            {member.email}
                          </a>
                        </div>
                        {(member.phone || member.phoneNumber) && (
                          <div className="text-[11px] text-emerald-800 font-mono truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${member.phone || member.phoneNumber}`}
                              className="hover:underline font-semibold"
                            >
                              {member.phone || member.phoneNumber}
                            </a>
                          </div>
                        )}
                        {(member.branch || member.year || member.rollNumber) && (
                          <div className="text-[10px] text-[#88867E] mt-1 font-mono">
                            {member.branch} • Year {member.year} {member.rollNumber ? `• ${member.rollNumber}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0DDD0] flex justify-end">
                    <button
                      onClick={() => handleRemoveMember(member._id, member.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 p-8 rounded-2xl border border-dashed border-[#D0CDBE] text-center bg-[#FDFCF9] flex flex-col items-center justify-center space-y-2">
                <Users className="w-8 h-8 text-[#9E9C94]" />
                <p className="text-sm font-semibold text-[#1C1B1A]">No team members added yet</p>
                <p className="text-xs text-[#66645E] max-w-sm">
                  Search across all registered students in the cohort and invite them to fill your {availableSlots} available slot{availableSlots === 1 ? '' : 's'}.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Start Searching Users</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SEARCH USERS & ADD TO TEAM ================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text- font-bold text-[#1C1B1A]">
                Search Users & Add to Your Team
              </h3>
              <p className="text-xs text-[#66645E] mt-0.5">
                Search total registered users by name, email, branch, or roll number. Invite members up to your 9-member limit.
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-[#1C1B1A] bg-[#F2EFE6] px-3.5 py-1.5 rounded-xl border border-[#E0DDD0]">
              Capacity: {totalCount} / {maxMembers} ({availableSlots} slot{availableSlots === 1 ? '' : 's'} remaining)
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, roll number, or branch..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#66645E] hover:text-[#1C1B1A]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl border border-[#E0DDD0] bg-white text-xs font-medium text-[#1C1B1A] shadow-2xs cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="available">Available (No Team)</option>
                <option value="assigned">Already in a Team</option>
              </select>

              <button
                onClick={fetchUsers}
                disabled={searching}
                className="px-4 py-2.5 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] border border-[#E0DDD0] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results List */}
          {searching ? (
            <div className="p-12 text-center text-xs text-[#66645E] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Searching total user database...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#D0CDBE] bg-[#FDFCF9]">
              <Users className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1C1B1A]">No users found matching your search</p>
              <p className="text-[11px] text-[#66645E] mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#1C1B1A]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-full bg-[#EFECE3] text-[#1C1B1A] flex items-center justify-center font-bold text-xs font-mono">
                        {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>

                      {u.isPendingInvite ? (
                        <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Invite Pending
                        </span>
                      ) : u.inTeam ? (
                        <span className="text-[10px] font-mono font-semibold text-[#66645E] bg-[#F2EFE6] px-2 py-0.5 rounded-full">
                          In {u.teamName || 'Team'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1B1A] truncate">{u.name}</div>
                      <div className="text-[11px] text-[#66645E] font-mono truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                        <a href={`mailto:${u.email}`} className="hover:underline truncate">{u.email}</a>
                      </div>
                      {(u.phone || u.phoneNumber) && (
                        <div className="text-[11px] text-emerald-800 font-mono truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a href={`tel:${u.phone || u.phoneNumber}`} className="hover:underline font-medium">
                            {u.phone || u.phoneNumber}
                          </a>
                        </div>
                      )}
                      {(u.branch || u.year || u.rollNumber) && (
                        <div className="text-[10px] text-[#88867E] mt-1 font-mono">
                          {u.branch || 'Eng'} {u.year ? `• Year ${u.year}` : ''} {u.rollNumber ? `• ${u.rollNumber}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0DDD0]">
                    {u.isPendingInvite ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-amber-700 font-medium">Invitation sent</span>
                        <button
                          onClick={() => handleCancelInvite(u.pendingInviteId, u.name)}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed text-center"
                      >
                        Team Full (9/9 Limit)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setInviteModalUser(u);
                          setInviteMessage(`Hi ${u.name}, I would love for you to join ${team.name}!`);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite to Team</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SENT INVITATIONS ================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div>
            <h3 className="text- font-bold text-[#1C1B1A]">
              Sent Team Invitations
            </h3>
            <p className="text-xs text-[#66645E] mt-0.5">
              Users must accept your invitation in their Student Portal to officially join your team.
            </p>
          </div>

          {pendingInvitations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#D0CDBE] bg-[#FDFCF9]">
              <Send className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1C1B1A]">No pending invitations</p>
              <p className="text-[11px] text-[#66645E] mt-1">
                Go to the "Search Users" tab to find and invite students to your team.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E0DDD0] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2EFE6] border-b border-[#E0DDD0] text-[10px] font-mono uppercase text-[#66645E]">
                    <tr>
                      <th className="py-3 px-4">Invited User</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Date Sent</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DDD0]">
                    {pendingInvitations.map((inv) => {
                      const target = inv.invitedUserId;
                      return (
                        <tr key={inv._id} className="hover:bg-[#FDFCF9]">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1C1B1A]">{target?.name || 'Student'}</div>
                            <div className="text-[11px] text-[#66645E] font-mono">{target?.email}</div>
                            {(target?.phone || target?.phoneNumber) && (
                              <div className="text-[10px] text-emerald-800 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{target?.phone || target?.phoneNumber}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#66645E]">
                            {target?.branch || 'N/A'} {target?.year ? `• Year ${target.year}` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#66645E] font-mono">
                            {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pending Acceptance
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleCancelInvite(inv._id, target?.name)}
                              className="px-3 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer"
                            >
                              Cancel Invite
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: GIVE TASKS TO STUDENTS ================= */}
      {activeTab === 'give-tasks' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-200">
                  Lead Task Dispatcher
                </span>
                <span className="text-xs text-[#66645E]">Team 6 • {team.track || 'Engineering Track'}</span>
              </div>
              <h3 className="text- font-bold text-[#1C1B1A]">
                Give Tasks to Team Members
              </h3>
              <p className="text-xs text-[#66645E] mt-0.5">
                Assign sprint deliverables, set deadlines, and monitor completion progress across your 8 team developers.
              </p>
            </div>

            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors shadow-xs cursor-pointer"
            >
              {showTaskForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showTaskForm ? 'Close Task Form' : '+ Assign New Task'}</span>
            </button>
          </div>

          {/* Task Assignment Form */}
          {showTaskForm && (
            <form
              onSubmit={handleCreateTask}
              className="p-6 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-sm space-y-5 animate-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-center justify-between border-b border-[#E0DDD0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs">
                    TL
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1C1B1A]">New Task Specification</h4>
                    <p className="text-[11px] text-[#66645E]">This task will be dispatched to all members of {team.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="text-[#66645E] hover:text-[#1C1B1A] p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Sprint 1: Setup React Component Architecture & API Mocking"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  />
                </div>

                {/* Topic / Track */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Sprint Topic / Track
                  </label>
                  <input
                    type="text"
                    value={taskTopic}
                    onChange={(e) => setTaskTopic(e.target.value)}
                    placeholder={team.track || 'Team Sprint Goal'}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  />
                </div>

                {/* Target Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Assign To
                  </label>
                  <select
                    value={taskTargetGroup}
                    onChange={(e) => setTaskTargetGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  >
                    <option value="both">All Team Members (Senior & Junior Developers)</option>
                    <option value="developer_interns">Senior Developers (SD1 – SD4)</option>
                    <option value="junior_developers">Junior Developers (JD1 – JD4)</option>
                  </select>
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Submission Deadline *
                  </label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent / Milestone Blocker</option>
                  </select>
                </div>

                {/* Deliverables Checklist */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Required Deliverables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {defaultDeliverables.map((item) => {
                      const isSelected = taskDeliverables.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleDeliverable(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#1C1B1A] text-white border-black'
                              : 'bg-white text-[#66645E] border-[#E0DDD0] hover:border-black'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-transparent'}`} />
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Deliverables Add */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customDeliverableInput}
                      onChange={(e) => setCustomDeliverableInput(e.target.value)}
                      placeholder="Add custom deliverable (e.g. Figma Prototype)..."
                      className="px-3 py-2 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] max-w-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDeliverable}
                      className="px-3.5 py-2 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] text-xs font-semibold text-[#1C1B1A] cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] block">
                    Task Description & Engineering Instructions *
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the sprint scope, key functions to implement, branch naming convention, and review guidelines..."
                    required
                    className="w-full p-4 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0DDD0]">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] text-xs font-medium text-[#1C1B1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-6 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {submittingTask ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Task...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assign Task to Students</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          {loadingTasks ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#1C1B1A] animate-spin" />
              <p className="text-xs font-mono text-[#66645E]">Loading team tasks & member progress...</p>
            </div>
          ) : teamTasks.length === 0 ? (
            <div className="p-12 text-center bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text- font-bold text-[#1C1B1A]">
                No Tasks Assigned to Your Team Yet
              </h4>
              <p className="text-xs text-[#66645E] max-w-md mx-auto leading-relaxed">
                As the Team Lead, you can dispatch project milestones and sprint assignments directly to your 8 team members.
              </p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Your First Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamTasks.map((t) => {
                const isCreatedByLead =
                  (t.createdBy?._id && String(t.createdBy._id) === String(user?._id)) ||
                  (t.createdBy && String(t.createdBy) === String(user?._id));
                const totalAssigned = t.totalAssigned || membersCount;
                const completedCount = t.completedCount || 0;
                const pct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
                const isExpanded = Boolean(expandedTaskProgress[t._id]);

                return (
                  <div
                    key={t._id}
                    className="p-6 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-xs space-y-4 hover:border-[#1C1B1A]/40 transition-colors"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0DDD0]/60 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1C1B1A] text-white text-[10px] font-mono font-bold">
                          {t.topic || team.track || 'Team Sprint'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : t.priority === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {t.priority || 'Normal'} Priority
                        </span>
                        {isCreatedByLead ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                            Assigned by You (Team Lead)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold">
                            Admin Milestone
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#66645E]">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#1C1B1A]" />
                          <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                        {isCreatedByLead && (
                          <button
                            onClick={() => handleDeleteTask(t._id)}
                            className="p-1 rounded text-[#66645E] hover:text-rose-600 cursor-pointer"
                            title="Delete this task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text- font-bold text-[#1C1B1A]">
                        {t.title}
                      </h4>
                      <p className="text-xs text-[#66645E] mt-1 leading-relaxed whitespace-pre-wrap">
                        {t.description}
                      </p>
                    </div>

                    {/* Deliverables */}
                    {Array.isArray(t.deliverables) && t.deliverables.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block">
                          Required Deliverables:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {t.deliverables.map((deliv, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-[#F4F1E8] border border-[#E0DDD0] text-[11px] font-medium text-[#1C1B1A] flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-[#66645E]" />
                              <span>{typeof deliv === 'string' ? deliv : deliv.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Progress Bar & Breakdown */}
                    <div className="pt-2 border-t border-[#E0DDD0]/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#66645E]">Team Member Completion:</span>
                        <span className="font-bold text-[#1C1B1A]">
                          {completedCount} / {totalAssigned} Members Completed ({pct}%)
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-[#EFECE3] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Expand Member Roster Status Breakdown */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTaskProgress((prev) => ({
                            ...prev,
                            [t._id]: !prev[t._id],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1B1A] hover:underline cursor-pointer pt-1"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <span>{isExpanded ? 'Hide Member Status Roster' : 'View Each Member’s Progress Status'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 bg-white rounded-xl border border-[#E0DDD0] space-y-2 animate-in fade-in">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block">
                            Member Submission Roster:
                          </span>
                          <div className="divide-y divide-[#E0DDD0]/60">
                            {(team.members || []).map((m) => {
                              const assignment = (t.assignments || []).find(
                                (a) => String(a.studentId?._id || a.studentId) === String(m._id)
                              );
                              const status = assignment ? assignment.status : 'pending';
                              return (
                                <div key={m._id} className="py-2 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-semibold text-[#1C1B1A]">{m.name}</span>
                                    <span className="text-[11px] text-[#66645E] font-mono ml-2">({m.rollNumber || 'No Roll'})</span>
                                    <span className="text-[10px] text-[#88867E] ml-2 uppercase">
                                      {m.memberType ? m.memberType.replace('_', ' ') : 'Developer'}
                                    </span>
                                  </div>
                                  <div>
                                    {status === 'completed' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Completed
                                      </span>
                                    ) : status === 'in_progress' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                        <Clock className="w-3 h-3" />
                                        In Progress
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-gray-600 bg-gray-100 border border-gray-200">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: STUDENT DASHBOARD (EMBEDDED VIEW) ================= */}
      {activeTab === 'student-dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-gradient-to-r from-blue-50 via-[#FDFCF9] to-indigo-50 rounded-2xl border-2 border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  Dual Role Active
                </span>
                <span className="text-xs text-blue-900 font-medium">Team Lead & Enrolled Student</span>
              </div>
              <h3 className="text- font-bold text-[#1C1B1A]">
                Student Learning Workspace
              </h3>
              <p className="text-xs text-[#66645E]">
                As a Team Lead, you have access to your personal student curriculum, active learning streak, and task deliverables.
              </p>
            </div>

            <Link
              to="/student"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span>Open Fullscreen Student Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66645E]">
                <span>Active Streak</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-[#1C1B1A] font-mono">
                {studentStreak?.currentStreak || 0} Day{studentStreak?.currentStreak === 1 ? '' : 's'}
              </div>
              <p className="text-[11px] text-[#88867E]">Minimum 15 mins daily activity</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66645E]">
                <span>Assigned Learning Tasks</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-[#1C1B1A] font-mono">
                {studentTasks.length}
              </div>
              <p className="text-[11px] text-[#88867E]">Sprint curriculum tasks</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66645E]">
                <span>Completed Tasks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-[#1C1B1A] font-mono">
                {studentTasks.filter((t) => t.status === 'completed').length}
              </div>
              <p className="text-[11px] text-[#88867E]">Verified deliverables</p>
            </div>
          </div>

          {/* Student Tasks Preview */}
          <div className="p-6 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="text- font-bold text-[#1C1B1A]">
                My Assigned Learning Tasks
              </h4>
              <Link
                to="/student"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View All & Work on Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingStudentData ? (
              <div className="py-8 flex justify-center">
                <RefreshCw className="w-5 h-5 text-[#1C1B1A] animate-spin" />
              </div>
            ) : studentTasks.length === 0 ? (
              <p className="text-xs text-[#66645E] py-4">No tasks currently assigned.</p>
            ) : (
              <div className="divide-y divide-[#E0DDD0]/60">
                {studentTasks.slice(0, 5).map((st) => (
                  <div key={st._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-[#1C1B1A]">{st.title}</div>
                      <div className="text-[11px] text-[#66645E]">
                        Topic: {st.topic || 'Engineering Track'} • Deadline: {st.deadline ? new Date(st.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      st.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {st.status === 'completed' ? '✓ Completed' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Confirmation Modal */}
      {inviteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FDFCF9] border border-[#E0DDD0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DDD0]">
              <h4 className="text- font-bold text-[#1C1B1A]">
                Invite to {team.name}
              </h4>
              <button
                onClick={() => setInviteModalUser(null)}
                className="w-7 h-7 rounded-full bg-[#F2EFE6] flex items-center justify-center text-[#1C1B1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E0DDD0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs">
                {inviteModalUser.name ? inviteModalUser.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#1C1B1A] truncate">{inviteModalUser.name}</div>
                <div className="text-[11px] text-[#66645E] font-mono truncate">{inviteModalUser.email}</div>
                {inviteModalUser.branch && (
                  <div className="text-[10px] text-[#88867E]">
                    {inviteModalUser.branch} {inviteModalUser.year ? `• Year ${inviteModalUser.year}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-[#66645E] block mb-1">
                Personal Invitation Note (Optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                placeholder="Include a short welcome message..."
                className="w-full p-3 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInviteModalUser(null)}
                className="px-4 py-2 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={invitingUserId === inviteModalUser._id}
                className="px-5 py-2 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {invitingUserId === inviteModalUser._id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Invitation</span>
              </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}
