import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  UploadCloud,
  FileSpreadsheet,
  Image as ImageIcon,
  Code2,
  Download,
} from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';
import ResourceUploadModal from '../../components/ResourceUploadModal';

export default function TeamLeadDashboard() {
  const { user, token, apiBaseUrl, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Route-based active tab derivation with query fallback
  const activeTab = useMemo(() => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/teamlead/roster') || p.includes('/team-lead/roster')) {
      return 'roster';
    }
    if (p.includes('/teamlead/resources') || p.includes('/team-lead/resources')) {
      return 'resources';
    }
    if (
      p.includes('/teamlead/tasks') ||
      p.includes('/teamlead/give-tasks') ||
      p.includes('/team-lead/tasks') ||
      p.includes('/team-lead/give-tasks')
    ) {
      return 'give-tasks';
    }
    // Query parameter fallback
    const tab = searchParams.get('tab');
    if (tab === 'roster') return 'roster';
    if (tab === 'resources') return 'resources';
    if (tab === 'give-tasks' || tab === 'tasks') return 'give-tasks';
    return 'give-tasks'; // Default route
  }, [location.pathname, searchParams]);

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      case 'roster':
        return 'Team Roster';
      case 'resources':
        return 'Learning Resources & Practice Materials';
      case 'give-tasks':
      default:
        return 'Give Tasks to Students';
    }
  };

  const handleTabChange = (newTab) => {
    if (newTab === 'roster') {
      navigate('/teamlead/roster');
    } else if (newTab === 'resources') {
      navigate('/teamlead/resources');
    } else if (newTab === 'give-tasks' || newTab === 'tasks') {
      navigate('/teamlead/tasks');
    } else if (newTab === 'student-dashboard') {
      navigate('/student');
    }
  };

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
  const [taskRelatedResources, setTaskRelatedResources] = useState([]);
  const [isTaskResourceSelectorOpen, setIsTaskResourceSelectorOpen] = useState(false);
  const [isUploadModalForTaskOpen, setIsUploadModalForTaskOpen] = useState(false);
  const [taskResourceSearch, setTaskResourceSearch] = useState('');

  // Deliverables Review & Completion States
  const [reviewingKey, setReviewingKey] = useState(null);
  const [revisionFeedbackPrompt, setRevisionFeedbackPrompt] = useState(null);
  const [revisionFeedbackText, setRevisionFeedbackText] = useState('');

  // Student Dashboard Preview State
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentStreak, setStudentStreak] = useState(null);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // Resources Hub State
  const [hubResources, setHubResources] = useState([]);
  const [loadingHubResources, setLoadingHubResources] = useState(false);
  const [isResourceUploadOpen, setIsResourceUploadOpen] = useState(false);
  const [resourceFilterType, setResourceFilterType] = useState('all');
  const [resourceLeadSearchQuery, setResourceLeadSearchQuery] = useState('');
  const [promptCompletionResource, setPromptCompletionResource] = useState(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

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

  const fetchHubResources = async () => {
    try {
      setLoadingHubResources(true);
      const res = await fetch(`${API_BASE_URL}/resources`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.resources)) {
          setHubResources(data.resources);
        }
      }
    } catch (err) {
      console.error('Failed to load learning resources:', err);
    } finally {
      setLoadingHubResources(false);
    }
  };

  const handleToggleResourceCompletion = async (resource) => {
    if (!resource || !resource._id) return;
    try {
      setSubmittingCompletion(true);
      const res = await fetch(`${API_BASE_URL}/resources/${resource._id}/complete`, {
        method: 'POST',
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
        showToast(
          data.isCompleted ? 'Resource marked as completed! ✓' : 'Marked as incomplete.'
        );
        setPromptCompletionResource(null);
      }
    } catch (err) {
      console.error('Toggle completion error:', err);
    } finally {
      setSubmittingCompletion(false);
    }
  };

  const handleDownloadOrOpenResource = (resource) => {
    if (!resource) return;
    try {
      fetch(`${API_BASE_URL}/resources/${resource._id}/download`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});

      setHubResources((prev) =>
        prev.map((r) =>
          r._id === resource._id ? { ...r, downloadsCount: (r.downloadsCount || 0) + 1 } : r
        )
      );
    } catch (err) {
      console.error('Download counter error:', err);
    }

    if (!resource.isCompleted) {
      setTimeout(() => {
        setPromptCompletionResource(resource);
      }, 1200);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'give-tasks') {
      fetchTeamTasks();
      fetchHubResources();
    } else if (activeTab === 'student-dashboard') {
      fetchStudentPreviewData();
    } else if (activeTab === 'resources') {
      fetchHubResources();
    }
  }, [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyTeam();
    if (activeTab === 'give-tasks') {
      fetchTeamTasks();
      fetchHubResources();
    }
    if (activeTab === 'student-dashboard') fetchStudentPreviewData();
    if (activeTab === 'resources') fetchHubResources();
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
          relatedResources: taskRelatedResources.map((r) => r._id || r),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Task assigned to team students successfully!', 'success');
        setTaskTitle('');
        setTaskDescription('');
        setTaskDeadline('');
        setTaskRelatedResources([]);
        setIsTaskResourceSelectorOpen(false);
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

  const handleReviewSubmission = async (taskId, studentId, action, reviewNotes = '') => {
    const key = `${taskId}_${studentId}`;
    try {
      setReviewingKey(key);
      const res = await fetch(`${API_BASE_URL}/teamlead/tasks/${taskId}/review/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ action, reviewNotes }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          action === 'accept'
            ? 'Work accepted and marked completed! Progress updated.'
            : 'Revision feedback sent to member.',
          'success'
        );
        setRevisionFeedbackPrompt(null);
        setRevisionFeedbackText('');
        fetchTeamTasks();
      } else {
        showToast(data.message || 'Failed to review submission', 'error');
      }
    } catch (err) {
      console.error('Review submission error:', err);
      showToast('Network error while reviewing submission', 'error');
    } finally {
      setReviewingKey(null);
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

  const filteredLeadResources = useMemo(() => {
    return hubResources.filter((item) => {
      const matchesSearch =
        !resourceLeadSearchQuery ||
        item.title?.toLowerCase().includes(resourceLeadSearchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(resourceLeadSearchQuery.toLowerCase()) ||
        item.topic?.toLowerCase().includes(resourceLeadSearchQuery.toLowerCase());

      const matchesType = resourceFilterType === 'all' || item.type === resourceFilterType;
      return matchesSearch && matchesType;
    });
  }, [hubResources, resourceLeadSearchQuery, resourceFilterType]);

  const getResourceIcon = (type) => {
    switch (type) {
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'dsa_problem':
        return <Code2 className="w-5 h-5 text-amber-600" />;
      case 'git_repo':
        return <GitBranch className="w-5 h-5 text-slate-800" />;
      default:
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getResourceLabel = (type) => {
    switch (type) {
      case 'doc':
        return 'Document';
      case 'excel':
        return 'Spreadsheet';
      case 'pdf':
        return 'PDF Document';
      case 'image':
        return 'Image / Graphic';
      case 'dsa_problem':
        return 'DSA Problem';
      case 'git_repo':
        return 'Git Repository';
      default:
        return 'External Link';
    }
  };

  const formatResourceSize = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
                  href: '/teamlead/tasks',
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
                  href: '/teamlead/roster',
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
                  href: '/teamlead/resources',
                  label: 'Learning Resources',
                  icon: <BookOpen className="w-5 h-5" />,
                  badge: hubResources.length > 0 ? hubResources.length : undefined,
                }}
                isActive={activeTab === 'resources'}
                onClick={() => {
                  handleTabChange('resources');
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
            Build and manage your 9-member team roster. Coordinate members, assign project deliverables, and review student progress.
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
                Your team has reached the 9-member limit.
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
            <span>Assigned Tasks:</span>
            <span className="font-bold text-[#1C1B1A] font-mono">{teamTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E0DDD0] pb-2">
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
          onClick={() => handleTabChange('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
            activeTab === 'resources'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Learning Resources ({hubResources.length})</span>
          {hubResources.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-900 border border-sky-200">
              {hubResources.length}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-50/70 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all cursor-pointer ml-auto"
        >
          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          <span>Go to Student Dashboard</span>
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
                  Team members will appear here once allocated to your cohort team.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= GIVE TASKS TO STUDENTS ================= */}
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

                {/* Connect Learning Resources (Cloudinary Media, Spreadsheets & Links) */}
                <div className="space-y-3 md:col-span-2 p-4 bg-[#F5F3EC]/80 rounded-2xl border border-[#E0DDD0]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-mono font-semibold uppercase text-[#1C1B1A] flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-sky-600" />
                        <span>Connect Learning Resources (Cloudinary Media & Practice Links)</span>
                      </label>
                      <p className="text-[11px] text-[#66645E] mt-0.5">
                        Attach documents, spreadsheets, PDFs, diagrams or DSA problem links so students can directly view or download them on this task.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          fetchHubResources();
                          setIsTaskResourceSelectorOpen(!isTaskResourceSelectorOpen);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#E0DDD0] hover:bg-[#EAE7DE] text-xs font-semibold text-[#1C1B1A] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isTaskResourceSelectorOpen ? 'Close Picker' : 'Choose Existing Resource'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsUploadModalForTaskOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload New to Task</span>
                      </button>
                    </div>
                  </div>

                  {/* Currently Attached Resources */}
                  {taskRelatedResources.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {taskRelatedResources.map((res) => {
                        const isFile = ['pdf', 'doc', 'excel', 'image'].includes(res.type);
                        return (
                          <div
                            key={res._id}
                            className="px-3 py-2 rounded-xl bg-white border border-[#E0DDD0] flex items-center gap-2 text-xs shadow-2xs group"
                          >
                            {getResourceIcon(res.type)}
                            <div className="max-w-[220px] truncate">
                              <span className="font-semibold text-[#1C1B1A] truncate block">{res.title}</span>
                              <span className="text-[10px] text-[#66645E] block font-mono">
                                {getResourceLabel(res.type)} {res.fileFormat ? `• ${res.fileFormat.toUpperCase()}` : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTaskRelatedResources((prev) => prev.filter((r) => r._id !== res._id))}
                              className="ml-1 text-[#88867E] hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              title="Remove from task"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#88867E] italic">
                      No resources attached yet. Click "Choose Existing Resource" or "Upload New to Task" to attach study materials.
                    </p>
                  )}

                  {/* Expandable Resource Selector Dropdown */}
                  {isTaskResourceSelectorOpen && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-[#E0DDD0] shadow-xs space-y-3 animate-in fade-in duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#88867E]" />
                        <input
                          type="text"
                          value={taskResourceSearch}
                          onChange={(e) => setTaskResourceSearch(e.target.value)}
                          placeholder="Search resources by title, topic, or file type..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E0DDD0] bg-[#FAF9F5] text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A]"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-[#E0DDD0]/50">
                        {hubResources.length === 0 ? (
                          <div className="py-4 text-center text-xs text-[#88867E]">
                            No resources found in database. Click "Upload New to Task" to add one!
                          </div>
                        ) : (
                          hubResources
                            .filter((r) =>
                              !taskResourceSearch ||
                              r.title?.toLowerCase().includes(taskResourceSearch.toLowerCase()) ||
                              r.topic?.toLowerCase().includes(taskResourceSearch.toLowerCase()) ||
                              r.type?.toLowerCase().includes(taskResourceSearch.toLowerCase())
                            )
                            .map((res) => {
                              const isSelected = taskRelatedResources.some((r) => r._id === res._id);
                              return (
                                <div
                                  key={res._id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setTaskRelatedResources((prev) => prev.filter((r) => r._id !== res._id));
                                    } else {
                                      setTaskRelatedResources((prev) => [...prev, res]);
                                    }
                                  }}
                                  className={`p-2 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition ${
                                    isSelected ? 'bg-[#FAF9F5]' : 'hover:bg-[#F9F8F3]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {getResourceIcon(res.type)}
                                    <div className="truncate">
                                      <div className="font-semibold text-[#1C1B1A] truncate">{res.title}</div>
                                      <div className="text-[10px] text-[#66645E]">
                                        {res.topic || 'General'} • {getResourceLabel(res.type)} {res.fileFormat ? `(${res.fileFormat.toUpperCase()})` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      isSelected
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-[#F2EFE6] text-[#66645E] border-transparent'
                                    }`}>
                                      {isSelected ? '✓ Attached' : '+ Attach'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
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

                    {/* Attached Resources & Study Materials */}
                    {Array.isArray(t.relatedResources) && t.relatedResources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                          <span>Connected Study Materials ({t.relatedResources.length}):</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {t.relatedResources.map((resItem) => {
                            if (!resItem || !resItem._id) return null;
                            const isFile = ['pdf', 'doc', 'excel', 'image'].includes(resItem.type);
                            return (
                              <a
                                key={resItem._id}
                                href={resItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={isFile}
                                onClick={() => handleDownloadOrOpenResource(resItem)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-[#E0DDD0] hover:border-black/50 hover:shadow-xs transition text-xs font-medium text-[#1C1B1A] flex items-center gap-2 group cursor-pointer"
                              >
                                {getResourceIcon(resItem.type)}
                                <span className="font-semibold">{resItem.title}</span>
                                <span className="text-[10px] font-mono uppercase text-[#66645E] bg-[#F2EFE6] px-1.5 py-0.5 rounded">
                                  {getResourceLabel(resItem.type)} {resItem.fileFormat ? `(${resItem.fileFormat.toUpperCase()})` : ''}
                                </span>
                                {isFile ? (
                                  <Download className="w-3.5 h-3.5 text-[#66645E] group-hover:text-black" />
                                ) : (
                                  <ExternalLink className="w-3.5 h-3.5 text-[#66645E] group-hover:text-black" />
                                )}
                              </a>
                            );
                          })}
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
                        <div className="mt-3 p-4 bg-white rounded-xl border border-[#E0DDD0] space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-[#66645E]">
                              Member Deliverables & Submission Roster ({team.members?.length || 0} Members):
                            </span>
                            <span className="text-[10px] text-[#88867E] font-mono">
                              Click submitted Google Drive links to inspect member work
                            </span>
                          </div>

                          <div className="divide-y divide-[#E0DDD0]/60">
                            {(team.members || []).map((m) => {
                              const assignment = (t.assignments || []).find(
                                (a) => String(a.studentId?._id || a.studentId) === String(m._id)
                              );
                              const status = assignment ? assignment.status : 'pending';
                              const submissions = assignment?.submissions || [];
                              const hasSubmissions = submissions.length > 0 && submissions.some((s) => Boolean(s.link));
                              const key = `${t._id}_${m._id}`;
                              const isReviewing = reviewingKey === key;
                              const isFeedbackOpen = revisionFeedbackPrompt?.taskId === t._id && revisionFeedbackPrompt?.studentId === m._id;

                              return (
                                <div key={m._id} className="py-3 space-y-2 text-xs">
                                  {/* Member Header Row */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-[10px]">
                                        {m.name ? m.name.slice(0, 2).toUpperCase() : 'ST'}
                                      </div>
                                      <div>
                                        <span className="font-bold text-[#1C1B1A]">{m.name}</span>
                                        <span className="text-[11px] text-[#66645E] font-mono ml-2">({m.rollNumber || 'No Roll'})</span>
                                        <span className="text-[10px] text-[#88867E] ml-2 uppercase font-mono">
                                          {m.memberType ? m.memberType.replace('_', ' ') : 'Developer'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Status Badge & Primary Action */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {status === 'completed' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          ✓ Completed &amp; Accepted
                                        </span>
                                      ) : status === 'submitted' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 animate-pulse">
                                          <Clock className="w-3 h-3 text-blue-600" />
                                          Deliverables Submitted (Needs Review)
                                        </span>
                                      ) : status === 'revision_requested' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                          <AlertCircle className="w-3 h-3 text-amber-600" />
                                          Revision Requested
                                        </span>
                                      ) : status === 'in_progress' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200">
                                          <Clock className="w-3 h-3" />
                                          In Progress
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-gray-600 bg-gray-100 border border-gray-200">
                                          Pending Submission
                                        </span>
                                      )}

                                      {/* Accept & Mark Completed Action Button */}
                                      {status !== 'completed' ? (
                                        <button
                                          type="button"
                                          disabled={isReviewing}
                                          onClick={() => handleReviewSubmission(t._id, m._id, 'accept')}
                                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                        >
                                          {isReviewing ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="w-3 h-3" />
                                          )}
                                          <span>Accept &amp; Mark Completed</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isReviewing}
                                          onClick={() => handleReviewSubmission(t._id, m._id, 'request_revision', 'Re-opened by Team Lead')}
                                          className="text-[10px] font-mono text-[#88867E] hover:text-rose-600 hover:underline cursor-pointer"
                                        >
                                          Re-open / Request Changes
                                        </button>
                                      )}

                                      {/* Request Revision button when submitted */}
                                      {status === 'submitted' && !isFeedbackOpen && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRevisionFeedbackPrompt({ taskId: t._id, studentId: m._id, studentName: m.name });
                                            setRevisionFeedbackText('');
                                          }}
                                          className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-medium transition cursor-pointer"
                                        >
                                          Request Revision
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Submitted Google Drive / Docs / Presentation Links */}
                                  {hasSubmissions && (
                                    <div className="p-3 bg-[#FBF9F3] rounded-xl border border-[#E0DDD0]/80 space-y-2">
                                      <div className="flex items-center justify-between text-[11px] text-[#66645E] font-mono">
                                        <span className="font-semibold text-[#1C1B1A] flex items-center gap-1">
                                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                                          <span>Submitted Deliverables:</span>
                                        </span>
                                        {assignment?.submittedAt && (
                                          <span>Submitted on {new Date(assignment.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {submissions.map((sub, sIdx) => {
                                          if (!sub.link) return null;
                                          const isDrive = sub.link.includes('drive.google.com') || sub.link.includes('docs.google.com');
                                          const isDoc = sub.deliverableName.toLowerCase().includes('doc') || sub.deliverableName.toLowerCase().includes('spec');
                                          const isPres = sub.deliverableName.toLowerCase().includes('demo') || sub.deliverableName.toLowerCase().includes('presentation');

                                          return (
                                            <div
                                              key={sIdx}
                                              className="p-2.5 bg-white rounded-lg border border-[#E0DDD0] flex items-center justify-between gap-2 shadow-2xs hover:border-[#1C1B1A]/40 transition"
                                            >
                                              <div className="min-w-0 flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isPres ? 'bg-amber-100 text-amber-800' : isDoc ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                  <FileText className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="truncate">
                                                  <div className="font-semibold text-[#1C1B1A] text-[11px] truncate">{sub.deliverableName}</div>
                                                  <div className="text-[10px] text-[#66645E] font-mono truncate">{sub.link}</div>
                                                </div>
                                              </div>

                                              <a
                                                href={sub.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C1B1A] hover:bg-black text-white text-[10px] font-semibold transition cursor-pointer"
                                              >
                                                <span>{isDrive ? 'Open Drive' : 'View Link'}</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </a>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {assignment?.submissionNotes && (
                                        <div className="text-[11px] text-[#66645E] bg-white p-2 rounded-lg border border-[#E0DDD0]">
                                          <strong className="text-[#1C1B1A]">Student Notes: </strong>
                                          {assignment.submissionNotes}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Inline Feedback Box for Requesting Revision */}
                                  {isFeedbackOpen && (
                                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                                      <div className="text-[11px] font-semibold text-amber-900">
                                        Send Revision Feedback to {m.name}:
                                      </div>
                                      <textarea
                                        rows={2}
                                        value={revisionFeedbackText}
                                        onChange={(e) => setRevisionFeedbackText(e.target.value)}
                                        placeholder="e.g. Please update the Google Drive permissions to 'Anyone with link can view', or complete Section 3 of the Doc..."
                                        className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white text-[#1C1B1A] focus:outline-none focus:border-amber-500"
                                      />
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setRevisionFeedbackPrompt(null)}
                                          className="px-3 py-1 rounded-lg text-xs text-[#66645E] hover:bg-black/5 cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isReviewing || !revisionFeedbackText.trim()}
                                          onClick={() => handleReviewSubmission(t._id, m._id, 'request_revision', revisionFeedbackText)}
                                          className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                                        >
                                          Send Feedback &amp; Request Changes
                                        </button>
                                      </div>
                                    </div>
                                  )}
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

      {/* ================= TAB: LEARNING RESOURCES & CLOUDINARY MEDIA ================= */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Banner */}
          <div className="p-6 bg-gradient-to-r from-amber-50 via-[#FDFCF9] to-sky-50 rounded-2xl border border-[#E0DDD0] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1C1B1A] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                  Team Learning Hub
                </span>
                <span className="text-xs text-[#66645E]">Docs, Spreadsheets, PDFs, DSA & Git</span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1B1A]">
                Resources & Curated Study Materials
              </h3>
              <p className="text-xs text-[#66645E] mt-0.5">
                Review, download, or share study materials hosted on Cloudinary and practice problem links with your cohort.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsResourceUploadOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Resource</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88867E]" />
                <input
                  type="text"
                  value={resourceLeadSearchQuery}
                  onChange={(e) => setResourceLeadSearchQuery(e.target.value)}
                  placeholder="Search resources by title, topic, keywords..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E0DDD0] bg-[#FAF9F5] text-xs text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A] transition"
                />
              </div>

              <div className="text-xs text-[#66645E] font-medium">
                Showing {filteredLeadResources.length} of {hubResources.length} items
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'doc', label: 'Documents' },
                { id: 'pdf', label: 'PDFs' },
                { id: 'excel', label: 'Spreadsheets' },
                { id: 'image', label: 'Images' },
                { id: 'dsa_problem', label: 'DSA Questions' },
                { id: 'git_repo', label: 'Git Repos' },
                { id: 'link', label: 'Links' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setResourceFilterType(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    resourceFilterType === item.id
                      ? 'bg-[#1C1B1A] text-white shadow-xs'
                      : 'bg-[#F2EFE6] text-[#66645E] hover:text-[#1C1B1A] hover:bg-[#E5E2D8]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          {loadingHubResources ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#1C1B1A] animate-spin" />
              <p className="text-xs text-[#66645E]">Loading team learning materials...</p>
            </div>
          ) : filteredLeadResources.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-[#E0DDD0] p-6 space-y-3">
              <BookOpen className="w-10 h-10 text-[#C8C5BB] mx-auto" />
              <div className="text-sm font-bold text-[#1C1B1A]">No resources found</div>
              <p className="text-xs text-[#66645E] max-w-sm mx-auto">
                No resources match your active search or filter. You can upload documents, spreadsheets, or link DSA problems anytime.
              </p>
              <button
                type="button"
                onClick={() => setIsResourceUploadOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Resource</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeadResources.map((resItem) => {
                const isFile = ['pdf', 'doc', 'excel', 'image'].includes(resItem.type);
                const isCloudinary = Boolean(resItem.cloudinaryPublicId);

                return (
                  <div
                    key={resItem._id}
                    className="p-5 bg-white rounded-2xl border border-[#E0DDD0] hover:border-[#1C1B1A]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#F8F7F2] border border-[#E0DDD0] flex items-center justify-center flex-shrink-0">
                            {getResourceIcon(resItem.type)}
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#F2EFE6] text-[#66645E] text-[10px] font-semibold uppercase tracking-wider">
                              {getResourceLabel(resItem.type)}
                            </span>
                            {resItem.difficulty && (
                              <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                {resItem.difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        {isCloudinary && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-medium">
                            Cloudinary
                          </span>
                        )}
                      </div>

                      <h4 className="mt-3 text-sm font-bold text-[#1C1B1A] leading-snug line-clamp-2">
                        {resItem.title}
                      </h4>

                      {resItem.description && (
                        <p className="mt-1 text-xs text-[#66645E] line-clamp-2 leading-relaxed">
                          {resItem.description}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-[#F2EFE6] flex items-center justify-between text-[11px] text-[#66645E]">
                        <span className="font-medium text-[#1C1B1A]/80 truncate max-w-[150px]">
                          {resItem.topic || 'General'}
                        </span>
                        <div className="flex items-center gap-2">
                          {resItem.fileSize && <span>{formatResourceSize(resItem.fileSize)}</span>}
                          {resItem.fileFormat && (
                            <span className="uppercase font-semibold text-neutral-500">
                              {resItem.fileFormat}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E0DDD0] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleResourceCompletion(resItem)}
                        disabled={submittingCompletion}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          resItem.isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-[#F2EFE6] text-[#66645E] hover:text-[#1C1B1A] hover:bg-[#E5E2D8]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{resItem.isCompleted ? 'Completed ✓' : 'Mark Done'}</span>
                      </button>

                      <a
                        href={resItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={isFile}
                        onClick={() => handleDownloadOrOpenResource(resItem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition shadow-2xs"
                      >
                        {isFile ? (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Link</span>
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



        {/* Interactive Mark as Completed Prompt Modal */}
        {promptCompletionResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#FDFCF9] border border-[#E0DDD0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E0DDD0]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-[#1C1B1A]">Mark as Completed?</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setPromptCompletionResource(null)}
                  className="w-7 h-7 rounded-full bg-[#F2EFE6] flex items-center justify-center text-[#1C1B1A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E0DDD0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F8F7F2] border border-[#E0DDD0] flex items-center justify-center flex-shrink-0">
                  {getResourceIcon(promptCompletionResource.type)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-[#1C1B1A] truncate">
                    {promptCompletionResource.title}
                  </div>
                  <div className="text-[11px] text-[#66645E]">
                    {promptCompletionResource.topic || 'Learning Material'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#66645E] leading-relaxed">
                You just downloaded or opened this resource. Would you like to mark it as completed to track your progress?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromptCompletionResource(null)}
                  className="px-4 py-2 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] text-xs font-medium text-[#1C1B1A] cursor-pointer"
                >
                  Maybe Later
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleResourceCompletion(promptCompletionResource)}
                  disabled={submittingCompletion}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Completed ✓</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resource Upload Modal for Team Lead */}
        <ResourceUploadModal
          isOpen={isResourceUploadOpen}
          onClose={() => setIsResourceUploadOpen(false)}
          onResourceUploaded={() => {
            fetchHubResources();
            showToast('Resource uploaded successfully!');
          }}
          apiBaseUrl={API_BASE_URL}
          token={token}
        />

        {/* Resource Upload Modal for Direct Task Specification */}
        <ResourceUploadModal
          isOpen={isUploadModalForTaskOpen}
          onClose={() => setIsUploadModalForTaskOpen(false)}
          onResourceUploaded={(newResource) => {
            fetchHubResources();
            if (newResource && newResource._id) {
              setTaskRelatedResources((prev) => [...prev, newResource]);
              showToast(`Uploaded and attached "${newResource.title}" to this task! ✓`);
            } else {
              showToast('Resource uploaded! Select it from the picker.');
            }
          }}
          apiBaseUrl={API_BASE_URL}
          token={token}
        />
          </div>
        </main>
      </div>
    </div>
  );
}
