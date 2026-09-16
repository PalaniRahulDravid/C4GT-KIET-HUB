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
  UploadCloud,
  Check,
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

  // Task creation state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
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
          topic: taskTopic.trim() || teamData?.team?.track || 'Sprint Milestone',
          deadline: taskDeadline,
          priority: taskPriority,
          deliverables: taskDeliverables,
          relatedResources: selectedResourceIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Task assigned to team members successfully! ✓');
        setTaskTitle('');
        setTaskDescription('');
        setTaskDeadline('');
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
  // Derived Sprint Progress
  // ---------------------------------------------------------------------------

  const team = teamData?.team;
  const maxMembers = teamData?.maxMembers || 9;
  const totalCount = teamData?.totalTeamCount || 0;
  const members = teamData?.members || team?.members || [];

  const sprintStats = useMemo(() => {
    const totalExpected = teamTasks.length * Math.max(1, members.length);
    let totalCompleted = 0;
    let totalSubmitted = 0;

    teamTasks.forEach((t) => {
      const assignments = t.assignments || [];
      assignments.forEach((a) => {
        if (a.status === 'completed') totalCompleted++;
        if (a.status === 'submitted') totalSubmitted++;
      });
    });

    const pct = totalExpected > 0 ? Math.min(100, Math.round((totalCompleted / totalExpected) * 100)) : 0;
    return { totalExpected, totalCompleted, totalSubmitted, pct };
  }, [teamTasks, members]);

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
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-slate-50/60 font-sans text-slate-900 overflow-hidden">
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
                  label: 'Give Tasks to Students',
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
              <div className="text-xs text-slate-500 font-medium">
                {team?.name || 'Cohort Team'} • {team?.track || 'Engineering Track'}
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 capitalize">
                {activeTab === 'tasks' && 'Give Tasks & Review Submissions'}
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
            {/* VIEW 1: GIVE TASKS TO STUDENTS */}
            {/* ============================================================= */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      Give Tasks to Team Members
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign milestones with required Google Docs & Slides deliverables, and review submitted work.
                    </p>
                  </div>
                  <Button onClick={() => setShowTaskModal(true)} className="gap-2 self-start sm:self-auto">
                    <Plus className="w-4 h-4" />
                    <span>Assign New Task</span>
                  </Button>
                </div>

                {/* Team Sprint Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sprint Completion Progress
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {sprintStats.pct}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={sprintStats.pct} className="h-2" />
                      <p className="text-xs text-slate-500 mt-2 font-medium">
                        {sprintStats.totalCompleted} of {sprintStats.totalExpected} member submissions verified
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Tasks
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {teamTasks.length} Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-500 font-medium">
                        Active sprints configured across {members.length} team members
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Submissions Awaiting Review
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold text-amber-600">
                        {sprintStats.totalSubmitted} Submissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-500 font-medium">
                        Open and review Google Drive links below to approve work
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tasks & Deliverables Queue */}
                {loadingTasks ? (
                  <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading team tasks...</span>
                  </div>
                ) : teamTasks.length === 0 ? (
                  <Card className="p-12 text-center bg-white border-dashed">
                    <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">No Tasks Assigned Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Click "Assign New Task" above to dispatch the first sprint milestone to your students.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {teamTasks.map((task) => (
                      <Card key={task._id} className="overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="default">Sprint Task</Badge>
                                {task.topic && (
                                  <span className="text-xs text-slate-500 font-medium">
                                    • {task.topic}
                                  </span>
                                )}
                              </div>
                              <CardTitle className="text-base font-bold text-slate-900">
                                {task.title}
                              </CardTitle>
                              <CardDescription className="text-xs text-slate-600 mt-1">
                                {task.description}
                              </CardDescription>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Due: {new Date(task.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Member Submissions Table */}
                        <CardContent className="p-4 space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Member Submission Roster
                          </h4>

                          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                            {members.map((member) => {
                              const studentId = member._id;
                              const assignment = task.assignments?.find(
                                (a) => a.studentId === studentId || a.studentId?._id === studentId
                              );
                              const status = assignment?.status || 'pending';
                              const submissions = assignment?.submissions || [];
                              const isReviewing = reviewingKey === `${task._id}_${studentId}`;

                              return (
                                <div
                                  key={studentId}
                                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                                >
                                  {/* Student Info */}
                                  <div className="flex items-center gap-3 min-w-[200px]">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                                      {member.name ? member.name.slice(0, 2).toUpperCase() : 'ST'}
                                    </div>
                                    <div className="truncate">
                                      <div className="text-xs font-bold text-slate-900 truncate">
                                        {member.name}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono truncate">
                                        {member.email}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Submitted Links */}
                                  <div className="flex-1 flex flex-wrap items-center gap-2">
                                    {submissions.length > 0 ? (
                                      submissions.map((sub, sIdx) => {
                                        const linkUrl = sub.link || sub.fileUrl;
                                        if (!linkUrl) return null;
                                        const isDoc = sub.deliverableName?.toLowerCase().includes('doc');
                                        const isSlide = sub.deliverableName?.toLowerCase().includes('demo') || sub.deliverableName?.toLowerCase().includes('presentation');

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
                                      <Badge variant="success">✓ Completed & Approved</Badge>
                                    ) : status === 'submitted' ? (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="warning">⏳ Submitted</Badge>
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
                                      <Badge variant="secondary">Pending Submission</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

                          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
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
      {/* ASSIGN TASK MODAL */}
      {/* ============================================================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Assign Sprint Task to Team
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Task Instructions & Description *</label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe what students must build and what deliverables to include in their Google Drive submission..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
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
                  Required Student Deliverables (Google Drive Links)
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
                <Button type="submit" size="sm" disabled={submittingTask} className="gap-1.5">
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
                    'revision_requested',
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
