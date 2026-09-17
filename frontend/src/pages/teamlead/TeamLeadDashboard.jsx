import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import ResourceUploadModal from '../../components/ResourceUploadModal';
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
  CheckSquare,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  Code2,
  GitBranch,
  Phone,
  Mail,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  Check,
  User as UserIcon,
  Crown,
  Sparkles,
  Filter,
  ArrowUpDown,
  Layers,
  AlertTriangle,
  UserCheck,
  Eye,
  MessageSquare,
} from 'lucide-react';

export default function TeamLeadDashboard() {
  const { user, token, apiBaseUrl, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Sub-route derivation
  const activeTab = useMemo(() => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/teamlead/roster') || p.includes('/team-lead/roster')) return 'roster';
    if (p.includes('/teamlead/resources') || p.includes('/team-lead/resources')) return 'resources';
    if (
      p.includes('/teamlead/tasks') ||
      p.includes('/teamlead/give-tasks') ||
      p.includes('/team-lead/tasks')
    ) {
      return 'tasks';
    }
    const tab = searchParams.get('tab');
    if (tab === 'roster') return 'roster';
    if (tab === 'resources') return 'resources';
    return 'tasks';
  }, [location.pathname, searchParams]);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Team data & tasks
  const [teamData, setTeamData] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Task Filtering, Person Division & Time Ordering States
  const [taskAudienceFilter, setTaskAudienceFilter] = useState('all'); // 'all', 'students', 'team_lead'
  const [selectedPersonFilter, setSelectedPersonFilter] = useState('all'); // 'all', 'team_lead', or studentId
  const [taskTimeSort, setTaskTimeSort] = useState('due_asc'); // 'due_asc', 'due_desc', 'created_desc', 'created_asc'
  const [taskStatusFilter, setTaskStatusFilter] = useState('all'); // 'all', 'review_needed', 'completed', 'pending'
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  // Task creation state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskAssigneeType, setTaskAssigneeType] = useState('all_students'); // 'all_students', 'specific_students'
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskDeadlineDate, setTaskDeadlineDate] = useState('');
  const [taskDeadlineTime, setTaskDeadlineTime] = useState('23:59');
  const [taskPriority, setTaskPriority] = useState('Normal');
  const defaultDeliverables = ['Documentation / Spec', 'Demo / Presentation'];
  const [taskDeliverables, setTaskDeliverables] = useState([...defaultDeliverables]);
  const [customDeliverableInput, setCustomDeliverableInput] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [submittingTask, setSubmittingTask] = useState(false);

  // Review & revision state
  const [reviewingKey, setReviewingKey] = useState(null);
  const [revisionModalTask, setRevisionModalTask] = useState(null);
  const [revisionModalStudent, setRevisionModalStudent] = useState(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState('');

  // Learning resources state
  const [hubResources, setHubResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategory, setResourceCategory] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // API Fetching
  // ---------------------------------------------------------------------------

  const fetchMyTeam = async () => {
    try {
      setLoadingTeam(true);
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
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoadingTeam(false);
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
      console.error('Failed to load tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchHubResources = async () => {
    try {
      setLoadingResources(true);
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
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
    fetchTeamTasks();
    fetchHubResources();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyTeam();
    fetchTeamTasks();
    fetchHubResources();
    showToast('Workspace data refreshed ✓');
  };

  // ---------------------------------------------------------------------------
  // Task Creation & Submission Review Handlers
  // ---------------------------------------------------------------------------

  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    if (!taskTitle.trim() || !taskDescription.trim() || !taskDeadlineDate) {
      showToast('Please provide Title, Description, and Deadline Date', 'error');
      return;
    }

    if (taskAssigneeType === 'specific_students' && selectedStudentIds.length === 0) {
      showToast('Please select at least one student to assign the task', 'error');
      return;
    }

    const fullDeadline = `${taskDeadlineDate}T${taskDeadlineTime || '23:59'}:00`;

    let payloadScope = 'students';
    let payloadAssignedTo = 'all_students';

    if (taskAssigneeType === 'specific_students') {
      payloadScope = 'individual';
      payloadAssignedTo = selectedStudentIds;
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
          topic: taskTopic.trim() || teamData?.team?.track || 'Sprint Milestone',
          deadline: fullDeadline,
          priority: taskPriority,
          deliverables: taskDeliverables,
          relatedResources: selectedResourceIds,
          taskScope: payloadScope,
          assignedTo: payloadAssignedTo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Task assigned successfully! ✓');
        setTaskTitle('');
        setTaskDescription('');
        setTaskTopic('');
        setTaskDeadlineDate('');
        setTaskDeadlineTime('23:59');
        setTaskAssigneeType('all_students');
        setSelectedStudentIds([]);
        setTaskDeliverables([...defaultDeliverables]);
        setSelectedResourceIds([]);
        setShowTaskModal(false);
        fetchTeamTasks();
      } else {
        showToast(data.message || 'Failed to create task', 'error');
      }
    } catch (err) {
      console.error('Create task error:', err);
      showToast('Error assigning task', 'error');
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
        showToast('Task deleted successfully');
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
            ? 'Work approved and marked completed! Progress updated ✓'
            : 'Revision feedback sent to member.'
        );
        setRevisionModalTask(null);
        setRevisionModalStudent(null);
        setRevisionNotesInput('');
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
        showToast(`${memberName} removed from team.`);
        fetchMyTeam();
      } else {
        showToast(data.message || 'Failed to remove member.', 'error');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      showToast('Error removing member.', 'error');
    }
  };

  const handleDownloadResource = (resource) => {
    if (!resource) return;
    const targetUrl = resource.cloudinaryPublicId
      ? `${API_BASE_URL}/resources/${resource._id}/file`
      : resource.url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // ---------------------------------------------------------------------------
  // Derived Sprint Progress & Person Categorization
  // ---------------------------------------------------------------------------

  const team = teamData?.team;
  const maxMembers = teamData?.maxMembers || 9;
  const totalCount = teamData?.totalTeamCount || 0;
  const members = useMemo(() => teamData?.members || team?.members || [], [teamData, team]);

  // Find active student when filtered by single student
  const activeFilteredStudent = useMemo(() => {
    if (selectedPersonFilter === 'all' || selectedPersonFilter === 'team_lead') return null;
    return members.find((m) => m._id === selectedPersonFilter) || null;
  }, [selectedPersonFilter, members]);

  // Calculate high-level sprint statistics
  const sprintStats = useMemo(() => {
    const studentTasks = teamTasks.filter(
      (t) => t.audience === 'students' || t.audience === 'individual' || t.isCreatedByLead
    );
    const leadTasks = teamTasks.filter(
      (t) =>
        t.audience === 'team_lead' ||
        t.isCreatedByAdmin ||
        (t.assignedTo && t.assignedTo.some((u) => (u._id || u).toString() === user?._id?.toString()))
    );

    let totalExpected = 0;
    let totalCompleted = 0;
    let totalSubmitted = 0;

    teamTasks.forEach((t) => {
      const assignments = t.assignments || [];
      assignments.forEach((a) => {
        if (a.status === 'completed') totalCompleted++;
        if (a.status === 'submitted') totalSubmitted++;
      });
      totalExpected += t.totalAssigned || 1;
    });

    const pct = totalExpected > 0 ? Math.min(100, Math.round((totalCompleted / totalExpected) * 100)) : 0;
    return {
      totalExpected,
      totalCompleted,
      totalSubmitted,
      pct,
      studentTasksCount: studentTasks.length,
      leadTasksCount: leadTasks.length,
      totalTasksCount: teamTasks.length,
    };
  }, [teamTasks, user]);

  // Format deadline date & relative time calculation
  const getDeadlineInfo = (deadlineStr) => {
    if (!deadlineStr) return { text: 'No deadline', status: 'normal', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    const due = new Date(deadlineStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = due.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = due.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffMs < 0) {
      const overDays = Math.abs(diffDays) || 1;
      return {
        text: `Overdue by ${overDays} ${overDays === 1 ? 'day' : 'days'}`,
        subtext: `Was due ${formattedDate}, ${formattedTime}`,
        status: 'overdue',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'destructive',
      };
    } else if (diffHours <= 24) {
      return {
        text: `Due Today at ${formattedTime}`,
        subtext: `${formattedDate}`,
        status: 'urgent',
        color: 'bg-amber-50 text-amber-800 border-amber-300',
        badgeColor: 'warning',
      };
    } else if (diffHours <= 48) {
      return {
        text: `Due Tomorrow at ${formattedTime}`,
        subtext: `${formattedDate}`,
        status: 'soon',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeColor: 'warning',
      };
    } else if (diffDays <= 7) {
      return {
        text: `Due in ${diffDays} days`,
        subtext: `${formattedDate}, ${formattedTime}`,
        status: 'upcoming',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'secondary',
      };
    } else {
      return {
        text: `Due ${formattedDate}`,
        subtext: formattedTime,
        status: 'normal',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeColor: 'outline',
      };
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered & Chronologically Ordered Tasks
  // ---------------------------------------------------------------------------

  const processedTasks = useMemo(() => {
    let result = [...teamTasks];

    // 1. Filter by Task Role / Audience Tab
    if (taskAudienceFilter === 'students') {
      result = result.filter(
        (t) => t.audience === 'students' || t.audience === 'individual' || t.isCreatedByLead
      );
    } else if (taskAudienceFilter === 'team_lead') {
      result = result.filter(
        (t) =>
          t.audience === 'team_lead' ||
          t.isCreatedByAdmin ||
          (t.assignedTo && t.assignedTo.some((u) => (u._id || u).toString() === user?._id?.toString()))
      );
    }

    // 2. Filter by Specific Person (Assignee)
    if (selectedPersonFilter === 'team_lead') {
      result = result.filter(
        (t) =>
          t.audience === 'team_lead' ||
          t.isCreatedByAdmin ||
          (t.assignedTo && t.assignedTo.some((u) => (u._id || u).toString() === user?._id?.toString()))
      );
    } else if (selectedPersonFilter !== 'all') {
      // Single student selected: show only tasks relevant to this student
      result = result.filter((t) => {
        if (Array.isArray(t.assignedTo) && t.assignedTo.length > 0) {
          return t.assignedTo.some(
            (u) => (u._id || u).toString() === selectedPersonFilter
          );
        }
        return t.audience !== 'team_lead';
      });
    }

    // 3. Filter by Submission / Review Status
    if (taskStatusFilter === 'review_needed') {
      result = result.filter((t) => (t.submittedCount || 0) > 0);
    } else if (taskStatusFilter === 'completed') {
      result = result.filter((t) => (t.completedCount || 0) >= (t.totalAssigned || 1));
    } else if (taskStatusFilter === 'pending') {
      result = result.filter((t) => (t.completedCount || 0) < (t.totalAssigned || 1));
    }

    // 4. Search Filter
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.topic?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // 5. Chronological Time-based Sorting
    result.sort((a, b) => {
      const deadlineA = new Date(a.deadline).getTime();
      const deadlineB = new Date(b.deadline).getTime();
      const createdA = new Date(a.createdAt || a.deadline).getTime();
      const createdB = new Date(b.createdAt || b.deadline).getTime();

      if (taskTimeSort === 'due_asc') {
        return deadlineA - deadlineB; // Soonest deadline first
      } else if (taskTimeSort === 'due_desc') {
        return deadlineB - deadlineA; // Furthest deadline first
      } else if (taskTimeSort === 'created_desc') {
        return createdB - createdA; // Newest created first
      } else if (taskTimeSort === 'created_asc') {
        return createdA - createdB; // Oldest created first
      }
      return deadlineA - deadlineB;
    });

    return result;
  }, [
    teamTasks,
    taskAudienceFilter,
    selectedPersonFilter,
    taskStatusFilter,
    taskSearchQuery,
    taskTimeSort,
    user,
  ]);

  // Student specific stats when a single student is selected in person filter
  const singleStudentStats = useMemo(() => {
    if (!activeFilteredStudent) return null;
    const sId = activeFilteredStudent._id;

    let assignedCount = 0;
    let completedCount = 0;
    let submittedCount = 0;
    let pendingCount = 0;

    teamTasks.forEach((t) => {
      if (t.audience === 'team_lead') return;
      const isAssigned =
        !t.assignedTo ||
        t.assignedTo.length === 0 ||
        t.assignedTo.some((u) => (u._id || u).toString() === sId.toString());

      if (isAssigned) {
        assignedCount++;
        const a = t.assignments?.find(
          (asg) => (asg.studentId?._id || asg.studentId).toString() === sId.toString()
        );
        if (a?.status === 'completed') completedCount++;
        else if (a?.status === 'submitted') submittedCount++;
        else pendingCount++;
      }
    });

    const completionRate =
      assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

    return {
      assignedCount,
      completedCount,
      submittedCount,
      pendingCount,
      completionRate,
    };
  }, [activeFilteredStudent, teamTasks]);

  // Filtered resources
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
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-slate-50/70 font-sans text-slate-900 overflow-hidden">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold animate-in fade-in ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen} animate={true}>
        <SidebarBody className="bg-neutral-900 border-r border-neutral-800 h-full flex flex-col justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
            <SidebarLogo
              logo={{
                href: '/teamlead/tasks',
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

            <SidebarSectionLabel label="Team Lead Workspace" />

            <nav className="mt-2 space-y-1">
              <SidebarLink
                link={{
                  href: '/teamlead/tasks',
                  label: 'Tasks & Milestones',
                  icon: <CheckSquare className="w-4 h-4" />,
                  badge: teamTasks.length > 0 ? teamTasks.length : undefined,
                }}
                isActive={activeTab === 'tasks'}
                onClick={() => {
                  navigate('/teamlead/tasks');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/teamlead/roster',
                  label: 'Team Roster',
                  icon: <Users className="w-4 h-4" />,
                  badge: `${totalCount}/${maxMembers}`,
                }}
                isActive={activeTab === 'roster'}
                onClick={() => {
                  navigate('/teamlead/roster');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/teamlead/resources',
                  label: 'Learning Resources',
                  icon: <BookOpen className="w-4 h-4" />,
                  badge: hubResources.length > 0 ? hubResources.length : undefined,
                }}
                isActive={activeTab === 'resources'}
                onClick={() => {
                  navigate('/teamlead/resources');
                  setMobileSidebarOpen(false);
                }}
              />

              <SidebarLink
                link={{
                  href: '/student',
                  label: 'Student Dashboard',
                  icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
                }}
                isActive={false}
                onClick={() => setMobileSidebarOpen(false)}
              />
            </nav>
          </div>

          <SidebarUser
            user={user}
            getInitials={(name) => (name ? name.slice(0, 2).toUpperCase() : 'TL')}
            onProfileClick={() => setShowProfileModal(true)}
            onLogout={handleLogout}
          />
        </SidebarBody>
      </Sidebar>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <CheckSquare className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span>{team?.name || 'Cohort Team'}</span>
                <span>•</span>
                <span>{team?.track || 'Engineering Track'}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 capitalize">
                {activeTab === 'tasks' && 'Team Tasks & Milestone Management'}
                {activeTab === 'roster' && 'Team Roster & Capacity'}
                {activeTab === 'resources' && 'Learning Resources & Practice Hub'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/student')}
              className="gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Student Dashboard</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* ============================================================= */}
            {/* VIEW 1: TASKS & MILESTONE MANAGEMENT */}
            {/* ============================================================= */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Team Lead & Student Tasks Workspace
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track student assignments, filter by person, and review submitted deliverables.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowTaskModal(true)}
                    className="gap-2 self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign New Task</span>
                  </Button>
                </div>

                {/* Team Sprint Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <Card className="border-slate-200 shadow-2xs">
                    <CardHeader className="pb-1.5 pt-4 px-4">
                      <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Sprint Completion
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {sprintStats.pct}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <Progress value={sprintStats.pct} className="h-1.5" />
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                        {sprintStats.totalCompleted} of {sprintStats.totalExpected} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-2xs">
                    <CardHeader className="pb-1.5 pt-4 px-4">
                      <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>Student Tasks</span>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-blue-700">
                        {sprintStats.studentTasksCount}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Assigned to team members
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-2xs">
                    <CardHeader className="pb-1.5 pt-4 px-4">
                      <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-purple-600" />
                        <span>Team Lead Tasks</span>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-purple-700">
                        {sprintStats.leadTasksCount}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Admin milestones for team lead
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-2xs bg-amber-50/40 border-amber-200/70">
                    <CardHeader className="pb-1.5 pt-4 px-4">
                      <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Needs Review</span>
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-amber-600">
                        {sprintStats.totalSubmitted} Submissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-[11px] text-amber-700/80 font-medium">
                        Submissions awaiting approval
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* ========================================================= */}
                {/* PERSON DIVISION & CHRONOLOGICAL FILTER CONTROLS BAR */}
                {/* ========================================================= */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                  {/* Row 1: Task Persona Tabs (All / Student Tasks / Team Lead Tasks) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      <button
                        onClick={() => {
                          setTaskAudienceFilter('all');
                          if (selectedPersonFilter === 'team_lead') setSelectedPersonFilter('all');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          taskAudienceFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>All Tasks</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                          {teamTasks.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setTaskAudienceFilter('students');
                          if (selectedPersonFilter === 'team_lead') setSelectedPersonFilter('all');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          taskAudienceFilter === 'students'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>Student Tasks</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                          {sprintStats.studentTasksCount}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setTaskAudienceFilter('team_lead');
                          setSelectedPersonFilter('team_lead');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          taskAudienceFilter === 'team_lead'
                            ? 'bg-white text-purple-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5 text-purple-600" />
                        <span>Team Lead (My Tasks)</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                          {sprintStats.leadTasksCount}
                        </span>
                      </button>
                    </div>

                    {/* Time Sorting Selector */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <span>Order by:</span>
                      </span>
                      <select
                        value={taskTimeSort}
                        onChange={(e) => setTaskTimeSort(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                      >
                        <option value="due_asc">⏰ Deadline: Soonest First</option>
                        <option value="due_desc">⏳ Deadline: Furthest First</option>
                        <option value="created_desc">🆕 Created: Newest First</option>
                        <option value="created_asc">📅 Created: Oldest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Person / Assignee Filter + Status Filter + Search */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Person Selector Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        <span>Filter by Person:</span>
                      </label>
                      <select
                        value={selectedPersonFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPersonFilter(val);
                          if (val === 'team_lead') {
                            setTaskAudienceFilter('team_lead');
                          } else if (val !== 'all' && taskAudienceFilter === 'team_lead') {
                            setTaskAudienceFilter('students');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                      >
                        <option value="all">👥 All Team Members & Lead</option>
                        <option value="team_lead">👑 Team Lead: {user?.name || 'You'}</option>
                        {members.map((m) => (
                          <option key={m._id} value={m._id}>
                            🎓 {m.name} {m.rollNumber ? `(${m.rollNumber})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <span>Status Filter:</span>
                      </label>
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => setTaskStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="review_needed">⏳ Needs Review ({sprintStats.totalSubmitted})</option>
                        <option value="completed">✓ Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Search className="w-3 h-3 text-slate-400" />
                        <span>Search Tasks:</span>
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={taskSearchQuery}
                          onChange={(e) => setTaskSearchQuery(e.target.value)}
                          placeholder="Search title, topic..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* ACTIVE PERSON FILTER BANNER (When single student is chosen) */}
                {/* ========================================================= */}
                {activeFilteredStudent && singleStudentStats && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {activeFilteredStudent.name ? activeFilteredStudent.name.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Viewing Tasks for: {activeFilteredStudent.name}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 font-mono">
                            Student
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {activeFilteredStudent.email} {activeFilteredStudent.rollNumber ? `• Roll: ${activeFilteredStudent.rollNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-slate-700 shadow-2xs">
                        <span>Progress: </span>
                        <span className="text-blue-700 font-bold">
                          {singleStudentStats.completedCount}/{singleStudentStats.assignedCount} Completed ({singleStudentStats.completionRate}%)
                        </span>
                        {singleStudentStats.submittedCount > 0 && (
                          <span className="ml-1.5 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md text-[10px]">
                            {singleStudentStats.submittedCount} Submitted
                          </span>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPersonFilter('all')}
                        className="text-xs text-slate-600 hover:text-slate-900 h-8"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Clear Filter</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Team Lead Self Milestone Banner */}
                {selectedPersonFilter === 'team_lead' && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            Team Lead Tasks & Admin Milestones (You)
                          </h3>
                          <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800 font-mono">
                            Team Lead Scope
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tasks assigned to you by administrators for {team?.name}.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPersonFilter('all');
                        setTaskAudienceFilter('all');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 h-8 self-start sm:self-auto"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      <span>View All Tasks</span>
                    </Button>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TASKS LIST */}
                {/* ========================================================= */}
                {loadingTasks ? (
                  <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Loading tasks and deliverables in chronological order...</span>
                  </div>
                ) : processedTasks.length === 0 ? (
                  <Card className="p-12 text-center bg-white border-dashed rounded-2xl">
                    <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">No Tasks Match Current Filters</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {taskSearchQuery || selectedPersonFilter !== 'all' || taskStatusFilter !== 'all'
                        ? 'Try clearing your search or person filters to see other tasks.'
                        : 'Click "Assign New Task" above to assign sprint milestones to your students.'}
                    </p>
                    {(taskSearchQuery || selectedPersonFilter !== 'all' || taskStatusFilter !== 'all' || taskAudienceFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTaskSearchQuery('');
                          setSelectedPersonFilter('all');
                          setTaskStatusFilter('all');
                          setTaskAudienceFilter('all');
                        }}
                        className="mt-3 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {processedTasks.map((task) => {
                      const deadlineInfo = getDeadlineInfo(task.deadline);
                      const isExpanded = expandedTaskIds.has(task._id) || selectedPersonFilter !== 'all';
                      const isLeadTask =
                        task.audience === 'team_lead' ||
                        task.isCreatedByAdmin ||
                        (task.assignedTo && task.assignedTo.some((u) => (u._id || u).toString() === user?._id?.toString()));

                      // Relevant members for this task
                      const targetMembers = members.filter((m) => {
                        if (selectedPersonFilter !== 'all' && selectedPersonFilter !== 'team_lead') {
                          return m._id === selectedPersonFilter;
                        }
                        if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
                          return task.assignedTo.some((u) => (u._id || u).toString() === m._id.toString());
                        }
                        return true;
                      });

                      const unreviewedCount = task.assignments?.filter(
                        (a) =>
                          a.status === 'submitted' &&
                          (selectedPersonFilter === 'all' || (a.studentId?._id || a.studentId).toString() === selectedPersonFilter)
                      ).length || 0;

                      return (
                        <Card
                          key={task._id}
                          className={`overflow-hidden border transition-all duration-200 ${
                            deadlineInfo.status === 'overdue'
                              ? 'border-rose-200 shadow-xs'
                              : isLeadTask
                              ? 'border-purple-200/80 shadow-2xs'
                              : 'border-slate-200 shadow-2xs hover:border-slate-300'
                          }`}
                        >
                          {/* Card Header */}
                          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-slate-50/60">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                {/* Scope & Target Tags */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {isLeadTask ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 font-mono">
                                      <Crown className="w-3 h-3" />
                                      <span>Team Lead Task</span>
                                    </span>
                                  ) : task.audience === 'individual' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[11px] font-bold border border-sky-200 font-mono">
                                      <UserIcon className="w-3 h-3" />
                                      <span>Specific Student(s)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200 font-mono">
                                      <GraduationCap className="w-3 h-3" />
                                      <span>Student Task</span>
                                    </span>
                                  )}

                                  {task.topic && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[11px] font-semibold">
                                      {task.topic}
                                    </span>
                                  )}

                                  {task.priority && task.priority !== 'Normal' && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                                        task.priority === 'Urgent'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {task.priority} Priority
                                    </span>
                                  )}
                                </div>

                                {/* Task Title */}
                                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                  {task.title}
                                </CardTitle>

                                {/* Task Description */}
                                <CardDescription className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                  {task.description}
                                </CardDescription>
                              </div>

                              {/* Time / Deadline & Actions */}
                              <div className="flex flex-row md:flex-col md:items-end justify-between items-center gap-2 shrink-0 pt-1 md:pt-0">
                                {/* Time Deadline Badge */}
                                <div
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${deadlineInfo.color}`}
                                >
                                  {deadlineInfo.status === 'overdue' ? (
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 animate-pulse" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <div className="flex flex-col text-left md:text-right">
                                    <span className="font-bold leading-tight">{deadlineInfo.text}</span>
                                    {deadlineInfo.subtext && (
                                      <span className="text-[10px] opacity-75 font-mono leading-tight">
                                        {deadlineInfo.subtext}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Creator & Delete */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {task.isCreatedByLead
                                      ? 'Assigned by You'
                                      : `By Admin: ${task.createdBy?.name || 'Administrator'}`}
                                  </span>

                                  {task.isCreatedByLead && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteTask(task._id)}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          {/* Card Content: Deliverables & Attached Resources */}
                          <CardContent className="p-4 sm:p-5 space-y-3.5">
                            {/* Deliverables Tags */}
                            {Array.isArray(task.deliverables) && task.deliverables.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 mr-1">
                                  Deliverables:
                                </span>
                                {task.deliverables.map((d, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80"
                                  >
                                    📄 {typeof d === 'string' ? d : d.name || 'Deliverable'}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Related Hub Resources if attached */}
                            {Array.isArray(task.relatedResources) && task.relatedResources.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-[11px] font-semibold text-slate-500 mr-1">
                                  Resources:
                                </span>
                                {task.relatedResources.map((resItem) => (
                                  <button
                                    key={resItem._id}
                                    onClick={() => handleDownloadResource(resItem)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium border border-indigo-200 transition-colors cursor-pointer"
                                  >
                                    <BookOpen className="w-3 h-3 text-indigo-500" />
                                    <span>{resItem.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-indigo-400 ml-0.5" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* =================================================== */}
                            {/* SUBMISSIONS SUMMARY & COLLAPSIBLE DRAWER */}
                            {/* =================================================== */}
                            <div className="pt-2 border-t border-slate-100 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                {/* Summary Badge & Progress */}
                                <div className="flex items-center gap-3">
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-slate-500" />
                                    <span>
                                      {task.completedCount || 0} of {task.totalAssigned || 1} Approved
                                    </span>
                                  </div>

                                  {unreviewedCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold font-mono animate-pulse">
                                      ⚠️ {unreviewedCount} Awaiting Review
                                    </span>
                                  )}
                                </div>

                                {/* Expand / Collapse Toggle Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleTaskExpanded(task._id)}
                                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 h-8 gap-1.5 self-start sm:self-auto"
                                >
                                  <span>
                                    {isExpanded ? 'Hide Member Submissions' : `Review Submissions (${targetMembers.length} members)`}
                                  </span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </Button>
                              </div>

                              {/* Progress bar */}
                              <Progress
                                value={
                                  task.totalAssigned
                                    ? Math.round(((task.completedCount || 0) / task.totalAssigned) * 100)
                                    : 0
                                }
                                className="h-1.5"
                              />

                              {/* Expanded Member Submissions Table */}
                              {isExpanded && (
                                <div className="mt-3 divide-y divide-slate-100 border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
                                  {targetMembers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400">
                                      No members assigned to this task.
                                    </div>
                                  ) : (
                                    targetMembers.map((member) => {
                                      const studentId = member._id;
                                      const assignment = task.assignments?.find(
                                        (a) =>
                                          (a.studentId?._id || a.studentId).toString() === studentId.toString()
                                      );
                                      const status = assignment?.status || 'pending';
                                      const submissions = assignment?.submissions || [];
                                      const isReviewing = reviewingKey === `${task._id}_${studentId}`;

                                      return (
                                        <div
                                          key={studentId}
                                          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                                        >
                                          {/* Student Details */}
                                          <div className="flex items-center gap-3 min-w-[220px]">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                              {member.name ? member.name.slice(0, 2).toUpperCase() : 'ST'}
                                            </div>
                                            <div className="truncate">
                                              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                <span>{member.name}</span>
                                                {member.rollNumber && (
                                                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                                                    ({member.rollNumber})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                                {member.email}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Submitted Links & Notes */}
                                          <div className="flex-1 flex flex-wrap items-center gap-2">
                                            {submissions.length > 0 ? (
                                              submissions.map((sub, sIdx) => {
                                                const linkUrl = sub.link || sub.fileUrl;
                                                if (!linkUrl) return null;
                                                const isDoc = sub.deliverableName?.toLowerCase().includes('doc');
                                                const isSlide =
                                                  sub.deliverableName?.toLowerCase().includes('demo') ||
                                                  sub.deliverableName?.toLowerCase().includes('presentation');

                                                return (
                                                  <a
                                                    key={sIdx}
                                                    href={linkUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-semibold border border-slate-200 transition-colors"
                                                  >
                                                    <span>{isDoc ? '📄 Doc' : isSlide ? '📊 Slides' : '🔗 Drive Link'}</span>
                                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                                  </a>
                                                );
                                              })
                                            ) : (
                                              <span className="text-xs text-slate-400 italic">
                                                No Google Drive links submitted yet
                                              </span>
                                            )}
                                          </div>

                                          {/* Status & Review Action */}
                                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                            {status === 'completed' ? (
                                              <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                                ✓ Completed & Approved
                                              </Badge>
                                            ) : status === 'submitted' ? (
                                              <div className="flex items-center gap-2">
                                                <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200 animate-pulse">
                                                  ⏳ Awaiting Review
                                                </Badge>
                                                <Button
                                                  size="sm"
                                                  disabled={isReviewing}
                                                  onClick={() =>
                                                    handleReviewSubmission(task._id, studentId, 'accept')
                                                  }
                                                  className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                  <span>Accept & Complete</span>
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  disabled={isReviewing}
                                                  onClick={() => {
                                                    setRevisionModalTask(task);
                                                    setRevisionModalStudent(member);
                                                  }}
                                                  className="h-8 text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
                                                >
                                                  Request Revision
                                                </Button>
                                              </div>
                                            ) : status === 'revision_requested' ? (
                                              <Badge variant="destructive">⚠️ Revision In Progress</Badge>
                                            ) : (
                                              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                Pending Submission
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 2: TEAM ROSTER */}
            {/* ============================================================= */}
            {activeTab === 'roster' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Team Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold">
                          TEAM {team?.teamNumber || '6'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Cohort 2026 – 2027</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 mt-1">
                        {team?.name || 'Cohort Team'}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {team?.track || 'Engineering Track'} • Capacity: {totalCount} / {maxMembers} Members
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>Team Capacity ({totalCount} / {maxMembers})</span>
                          <span>{totalCount >= maxMembers ? 'Team Full' : `${maxMembers - totalCount} slots available`}</span>
                        </div>
                        <Progress value={(totalCount / maxMembers) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Lead Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Team Lead (You)
                      </CardDescription>
                      <CardTitle className="text-base font-bold text-slate-900 mt-1">
                        {user?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Lead Status Active</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Team Members List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Assigned Team Members ({members.length} Members)
                  </h3>

                  {members.length === 0 ? (
                    <Card className="p-8 text-center bg-white border-dashed">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        No team members allocated to your roster yet. Members are assigned by the Administrator.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members.map((member) => (
                        <Card key={member._id} className="p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <div className="flex items-start gap-3">
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
                              {(member.branch || member.year || member.rollNumber) && (
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  {member.branch} {member.year ? `• Year ${member.year}` : ''} {member.rollNumber ? `• ${member.rollNumber}` : ''}
                                </p>
                              )}
                              {(member.phone || member.phoneNumber) && (
                                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono mt-1">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <a href={`tel:${member.phone || member.phoneNumber}`} className="hover:underline">
                                    {member.phone || member.phoneNumber}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonFilter(member._id);
                                navigate('/teamlead/tasks');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2.5 gap-1 border-blue-200"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Tasks</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member._id, member.name)}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              <span>Remove</span>
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* VIEW 3: LEARNING RESOURCES */}
            {/* ============================================================= */}
            {activeTab === 'resources' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Learning Resources & Practice Materials
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Share study materials, problem links, and PDFs with your team members.
                    </p>
                  </div>

                  <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2 self-start sm:self-auto">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Resource</span>
                  </Button>
                </div>

                {/* Filter tabs & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={resourceSearch}
                      onChange={(e) => setResourceSearch(e.target.value)}
                      placeholder="Search resources..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>

                {/* Resources Grid */}
                {loadingResources ? (
                  <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading resources...</span>
                  </div>
                ) : filteredResources.length === 0 ? (
                  <Card className="p-12 text-center bg-white border-dashed">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-900">No resources found</h3>
                    <p className="text-xs text-slate-500 mt-1">Adjust search or upload a resource above.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map((resItem) => (
                      <Card key={resItem._id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                              {getResourceIcon(resItem.type)}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              ⬇ {resItem.downloadsCount || 0}
                            </span>
                          </div>

                          <CardTitle className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                            {resItem.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 line-clamp-2">
                            {resItem.description || 'Study guide & practice reference.'}
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
          </div>
        </main>
      </div>

      {/* ============================================================= */}
      {/* ASSIGN TASK MODAL WITH PERSON TARGETING & TIME PICKER */}
      {/* ============================================================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Task & Milestone
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target all students or specific individual members with a defined deadline.
                </p>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Target Assignee Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800">
                  Assign Task To: *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTaskAssigneeType('all_students')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      taskAssigneeType === 'all_students'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>All Students</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      All {members.length} team members
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaskAssigneeType('specific_students')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      taskAssigneeType === 'specific_students'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Specific Student(s)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Select individual members
                    </div>
                  </button>
                </div>

                {/* Specific Student Selector Checkboxes */}
                {taskAssigneeType === 'specific_students' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Select Team Members ({selectedStudentIds.length} selected):</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedStudentIds.length === members.length) {
                            setSelectedStudentIds([]);
                          } else {
                            setSelectedStudentIds(members.map((m) => m._id));
                          }
                        }}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        {selectedStudentIds.length === members.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {members.map((m) => {
                        const isChecked = selectedStudentIds.includes(m._id);
                        return (
                          <label
                            key={m._id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedStudentIds((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== m._id)
                                    : [...prev, m._id]
                                );
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span className="truncate">{m.name}</span>
                            {m.rollNumber && (
                              <span className="text-[10px] font-mono text-slate-400 font-normal">
                                ({m.rollNumber})
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Build API Endpoints for User Auth"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Topic */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Topic / Domain</label>
                <input
                  type="text"
                  value={taskTopic}
                  onChange={(e) => setTaskTopic(e.target.value)}
                  placeholder={team?.track || 'e.g. Backend Development'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Task Instructions & Description *</label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe what needs to be built and deliverables to include..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {/* Deadline & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={taskDeadlineDate}
                    onChange={(e) => setTaskDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Deadline Time</label>
                  <input
                    type="time"
                    value={taskDeadlineTime}
                    onChange={(e) => setTaskDeadlineTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-800">
                  Required Student Deliverables (Google Drive / Doc / Repo Links)
                </label>
                <div className="flex flex-wrap gap-2">
                  {taskDeliverables.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                    >
                      <span>📄 {d}</span>
                      <button
                        type="button"
                        onClick={() => setTaskDeliverables((prev) => prev.filter((item) => item !== d))}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={customDeliverableInput}
                    onChange={(e) => setCustomDeliverableInput(e.target.value)}
                    placeholder="Add custom deliverable..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customDeliverableInput.trim() && !taskDeliverables.includes(customDeliverableInput.trim())) {
                        setTaskDeliverables((prev) => [...prev, customDeliverableInput.trim()]);
                        setCustomDeliverableInput('');
                      }
                    }}
                    className="text-xs h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingTask} className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
                  {submittingTask ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Dispatch Task</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* REQUEST REVISION MODAL */}
      {/* ============================================================= */}
      {revisionModalTask && revisionModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Request Revision from {revisionModalStudent.name}
              </h3>
              <button
                onClick={() => {
                  setRevisionModalTask(null);
                  setRevisionModalStudent(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800">
                Feedback & Required Changes:
              </label>
              <textarea
                rows={3}
                required
                value={revisionNotesInput}
                onChange={(e) => setRevisionNotesInput(e.target.value)}
                placeholder="Explain what needs to be revised in their Google Doc or presentation..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRevisionModalTask(null);
                  setRevisionModalStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleReviewSubmission(
                    revisionModalTask._id,
                    revisionModalStudent._id,
                    'request_revision',
                    revisionNotesInput
                  )
                }
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Send Revision Feedback
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cloudinary Resource Upload Modal */}
      {isUploadModalOpen && (
        <ResourceUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onResourceUploaded={() => {
            fetchHubResources();
            showToast('Resource uploaded to Cloudinary successfully! ✓');
          }}
          apiBaseUrl={API_BASE_URL}
          token={token}
        />
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
