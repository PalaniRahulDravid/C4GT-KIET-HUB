import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileDetailsModal from '../../components/ProfileDetailsModal';
import C4GTLogo from '../../components/C4GTLogo';
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
  Menu,
  X,
  User,
  Users,
  Award,
  ArrowRight,
  Bell,
  Activity,
  PlayCircle,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, logout, apiBaseUrl } = useAuth();
  const navigate = useNavigate();

  // Mobile sidebar visibility toggle state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Profile Details Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('profile') === 'true' || searchParams.get('tab') === 'profile') {
      setShowProfileModal(true);
    }
  }, [searchParams]);

  // Active Sidebar Navigation — derived from URL path (no local state needed)
  const location = useLocation();
  const activeNav = (() => {
    const p = location.pathname;
    if (p.includes('/student/my-tasks')) return 'my-tasks';
    if (p.includes('/student/progress')) return 'progress';
    return 'dashboard';
  })();

  // Redirect bare /student to /student/overview
  useEffect(() => {
    if (location.pathname === '/student' || location.pathname === '/student/') {
      navigate('/student/overview', { replace: true });
    }
  }, [location.pathname]);

  // Student Tasks & Resources State
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [expandedResources, setExpandedResources] = useState({});
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'admin' | 'teamlead'
  const [overviewTaskFilter, setOverviewTaskFilter] = useState('all'); // 'all' | 'admin' | 'teamlead'

  // MY TASKS -> Selected Task Overview Modal State
  const [selectedOverviewTask, setSelectedOverviewTask] = useState(null);

  // AUTOMATIC TASK COMPLETION -> Resource Progress State (Persisted from MongoDB)
  const [resourceProgressMap, setResourceProgressMap] = useState({});

  // BELL NOTIFICATION POPOVER STATE
  const [notificationsPopoverOpen, setNotificationsPopoverOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const notificationsRef = useRef(null);

  // STUDENT COHORT TEAM & TEAM INVITATIONS STATE
  const [studentTeam, setStudentTeam] = useState(null);
  const [teamInvitations, setTeamInvitations] = useState([]);
  const [respondingInviteId, setRespondingInviteId] = useState(null);

  // Active Media Viewer Modal State (Video / Document)
  const [activeMediaResource, setActiveMediaResource] = useState(null);
  const [videoWatchedSecs, setVideoWatchedSecs] = useState(0);
  const [videoDurSecs, setVideoDurSecs] = useState(120);
  const videoRef = useRef(null);
  const lastHtml5TimeRef = useRef(0);
  const ytPlayerRef = useRef(null);

  // YouTube Helper & Time Format Utilities
  const isYouTubeUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    return /youtube\.com|youtu\.be/.test(url);
  };

  const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const formatTimeSecs = (secs) => {
    const total = Math.max(0, Math.floor(Number(secs) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
        if (data && data.success && Array.isArray(data.tasks)) {
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
      setTasks([]);
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
            todayActiveSeconds: Number(data.todayActiveSeconds) || 0,
            todayStreakCompleted: Boolean(data.todayStreakCompleted),
            weeklyActivity: Array.isArray(data.weeklyActivity) ? data.weeklyActivity : [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load student streak:', err);
    }
  };

  const fetchResourceProgress = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/resource-progress`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.progress)) {
          const pMap = {};
          data.progress.forEach((p) => {
            const key = `${p.taskId}_${p.resourceId}`;
            pMap[key] = p;
          });
          setResourceProgressMap(pMap);
        }
      }
    } catch (err) {
      console.error('Failed to load resource progress:', err);
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

  const handleMarkNotificationRead = async (notification) => {
    if (!notification || !notification._id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/${notification._id}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationsList((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        if (data && data.unreadCount !== undefined) {
          setUnreadNotificationsCount(data.unreadCount);
        } else {
          setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    // Close popover and navigate/open overview modal for target task if available
    setNotificationsPopoverOpen(false);
    if (notification.taskId) {
      const matchedTask = safeTasks.find(
        (t) => t && (t._id === notification.taskId || String(t._id) === String(notification.taskId))
      );
      if (matchedTask) {
        setSelectedOverviewTask(matchedTask);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Close notifications and profile popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsPopoverOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchStudentTeam = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/team`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hasTeam) {
          setStudentTeam(data.team);
        } else {
          setStudentTeam(null);
        }
      }
    } catch (err) {
      console.error('Failed to load student team:', err);
    }
  };

  const fetchStudentInvitations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/team-invitations`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.invitations)) {
          setTeamInvitations(data.invitations);
        }
      }
    } catch (err) {
      console.error('Failed to load team invitations:', err);
    }
  };

  const handleRespondInvitation = async (invitationId, action) => {
    try {
      setRespondingInviteId(invitationId);
      const res = await fetch(`${API_BASE_URL}/student/team-invitations/${invitationId}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchStudentInvitations();
        fetchStudentTeam();
        fetchNotifications();
      } else {
        alert(data.message || 'Failed to process team invitation');
      }
    } catch (err) {
      console.error('Failed to respond to team invitation:', err);
    } finally {
      setRespondingInviteId(null);
    }
  };

  useEffect(() => {
    fetchStudentTasks();
    fetchStudentStreak();
    fetchResourceProgress();
    fetchNotifications();
    fetchStudentTeam();
    fetchStudentInvitations();
  }, [user]);

  // Real Session Heartbeat Tracking
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
          if (data && data.success) {
            setStreakData((prev) => {
              const newTodaySecs = Number(data.activeSeconds) || 0;
              const newIsCompleted = Boolean(data.isStreakCompleted);
              const updatedWeekly = (prev.weeklyActivity || []).map((day) => {
                if (day && day.isToday) {
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
                currentStreak: newlyCompleted ? (prev.currentStreak || 0) + 1 : (prev.currentStreak || 0),
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

  // Record resource progress & trigger automatic task status updates
  const recordResourceProgress = async ({
    taskId,
    resourceId,
    resourceType,
    watchedSeconds = 0,
    durationSeconds = 120,
    totalTaskResourcesCount = 4,
  }) => {
    if (!taskId || !resourceId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/student/resource-progress`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId,
          resourceId,
          resourceType,
          watchedSeconds,
          durationSeconds,
          totalTaskResourcesCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.progress) {
          const key = `${taskId}_${resourceId}`;
          setResourceProgressMap((prev) => ({
            ...prev,
            [key]: data.progress,
          }));

          // If task status was automatically updated, update local tasks state
          if (data.taskStatus) {
            setTasks((prev) =>
              prev.map((t) =>
                t && (t._id === taskId || String(t._id) === String(taskId))
                  ? {
                      ...t,
                      status: data.taskStatus,
                      completedAt: data.isTaskCompleted ? new Date().toISOString() : t.completedAt,
                    }
                  : t
              )
            );
          }
        }
      }
    } catch (err) {
      console.error('Resource progress error:', err);
    }
  };

  // Dynamically load YouTube IFrame API script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // YouTube IFrame Player Lifecycle Management
  useEffect(() => {
    if (!activeMediaResource || activeMediaResource.type !== 'video') return;
    const resUrl = activeMediaResource.url || activeMediaResource.name || '';
    const yId = getYouTubeVideoId(resUrl);

    if (!yId) return;

    let player = null;
    let interval = null;
    let lastTime = 0;

    const initYTPlayer = () => {
      const container = document.getElementById('yt-player-iframe');
      if (!container || !window.YT || !window.YT.Player) return;

      try {
        player = new window.YT.Player('yt-player-iframe', {
          videoId: yId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              const dur = Math.floor(event.target.getDuration() || 0);
              if (dur > 0) setVideoDurSecs(dur);
            },
            onStateChange: (event) => {
              // YT.PlayerState.PLAYING === 1
              if (event.data === 1) {
                lastTime = player.getCurrentTime ? player.getCurrentTime() : 0;
                if (interval) clearInterval(interval);
                interval = setInterval(() => {
                  if (!player || typeof player.getCurrentTime !== 'function') return;
                  const curr = player.getCurrentTime();
                  const delta = curr - lastTime;
                  // Count ONLY actual linear playback time (delta between 0 and 2.5s)
                  if (delta > 0 && delta <= 2.5) {
                    setVideoWatchedSecs((prev) => {
                      const next = prev + delta;
                      const dur = Math.floor(player.getDuration ? player.getDuration() : videoDurSecs || 180);
                      if (Math.floor(next) % 5 === 0 || next >= 0.5 * dur) {
                        recordResourceProgress({
                          taskId: activeMediaResource.task._id,
                          resourceId: activeMediaResource.resourceId,
                          resourceType: 'video',
                          watchedSeconds: Math.floor(next),
                          durationSeconds: dur,
                          totalTaskResourcesCount: activeMediaResource.totalTaskResourcesCount,
                        });
                      }
                      return next;
                    });
                  }
                  lastTime = curr;
                }, 1000);
              } else {
                // Paused, Ended, Buffering
                if (interval) clearInterval(interval);
              }
            },
          },
        });
        ytPlayerRef.current = player;
      } catch (err) {
        console.error('Failed to initialize YT Player:', err);
      }
    };

    const timerId = setTimeout(initYTPlayer, 150);

    return () => {
      clearTimeout(timerId);
      if (interval) clearInterval(interval);
      if (player && typeof player.destroy === 'function') {
        player.destroy();
      }
    };
  }, [activeMediaResource]);

  // Open Media Resource Viewer Modal
  const openMediaResource = (task, resourceItem, index) => {
    if (!task || !resourceItem) return;
    let nameStr = typeof resourceItem === 'string' ? resourceItem : resourceItem.name || resourceItem.title || 'Deliverable Spec';
    let resUrl = typeof resourceItem === 'object' && resourceItem.url ? resourceItem.url : '';
    let lower = (nameStr + ' ' + resUrl).toLowerCase();
    let type = lower.includes('demo') || lower.includes('video') || lower.includes('youtube') || lower.includes('youtu.be') ? 'video' : lower.includes('pdf') ? 'pdf' : lower.includes('code') || lower.includes('repo') ? 'link' : 'note';

    const rId = `res-${index}`;
    const key = `${task._id}_${rId}`;
    const existing = resourceProgressMap[key];

    setActiveMediaResource({
      task,
      resourceId: rId,
      name: nameStr,
      url: resUrl,
      type,
      totalTaskResourcesCount: Array.isArray(task.deliverables) && task.deliverables.length > 0 ? task.deliverables.length : 4,
    });

    if (type === 'video') {
      const initWatched = existing ? existing.watchedSeconds || 0 : 0;
      const initDur = existing ? existing.durationSeconds || 180 : 180;
      setVideoWatchedSecs(initWatched);
      setVideoDurSecs(initDur);
      lastHtml5TimeRef.current = 0;
    } else {
      // Document/Link: auto mark as viewed/completed immediately upon opening
      recordResourceProgress({
        taskId: task._id,
        resourceId: rId,
        resourceType: type,
        watchedSeconds: 0,
        durationSeconds: 0,
        totalTaskResourcesCount: Array.isArray(task.deliverables) && task.deliverables.length > 0 ? task.deliverables.length : 4,
      });
    }
  };

  // Close Media Resource Viewer Modal & Save Final Progress
  const closeMediaResource = () => {
    if (activeMediaResource && activeMediaResource.type === 'video') {
      recordResourceProgress({
        taskId: activeMediaResource.task._id,
        resourceId: activeMediaResource.resourceId,
        resourceType: 'video',
        watchedSeconds: Math.floor(videoWatchedSecs),
        durationSeconds: Math.floor(videoDurSecs),
        totalTaskResourcesCount: activeMediaResource.totalTaskResourcesCount,
      });
    }
    setActiveMediaResource(null);
  };

  // Handle HTML5 Video playback progress tracking (Actual linear time only, no seeking forward)
  const handleHtml5TimeUpdate = (e) => {
    if (!activeMediaResource || activeMediaResource.type !== 'video') return;
    const vid = e.target;
    if (!vid) return;

    const current = vid.currentTime;
    const duration = Math.floor(vid.duration || videoDurSecs);
    const delta = current - lastHtml5TimeRef.current;

    // Count ONLY actual playback time: not paused, not seeking, delta between 0 and 2.5s
    if (!vid.paused && !vid.seeking && delta > 0 && delta <= 2.5) {
      setVideoWatchedSecs((prev) => {
        const next = prev + delta;
        if (duration > 0) setVideoDurSecs(duration);
        if (Math.floor(next) % 5 === 0 || next >= 0.5 * duration) {
          recordResourceProgress({
            taskId: activeMediaResource.task._id,
            resourceId: activeMediaResource.resourceId,
            resourceType: 'video',
            watchedSeconds: Math.floor(next),
            durationSeconds: duration,
            totalTaskResourcesCount: activeMediaResource.totalTaskResourcesCount,
          });
        }
        return next;
      });
    }
    lastHtml5TimeRef.current = current;
  };

  // Toggle expanded resources for a task
  const toggleTaskResources = (taskId) => {
    if (!taskId) return;
    setExpandedResources((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const safeTasks = Array.isArray(tasks) ? tasks.filter(Boolean) : [];

  // Categorize tasks into Admin Tasks and Team Lead Tasks
  const isTeamLeadTask = (t) => {
    const role = t?.createdBy?.role;
    return role === 'teamlead' || role === 'team_lead';
  };

  const adminTasks = safeTasks.filter((t) => !isTeamLeadTask(t));
  const teamLeadTasks = safeTasks.filter((t) => isTeamLeadTask(t));

  // Task & Statistics Calculations (Real Data)
  const totalTasks = safeTasks.length;
  const completedTasksCount = safeTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasksCount = safeTasks.filter(
    (t) => t.status === 'in_progress' || (t.status !== 'completed' && t.status !== 'not_completed')
  ).length;

  // Due Soon: Pending tasks with deadline within the next 5 days
  const dueSoonTasksCount = safeTasks.filter((t) => {
    if (t.status === 'completed' || !t.deadline) return false;
    try {
      const diffMs = new Date(t.deadline).getTime() - new Date().getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= -1 && diffDays <= 5;
    } catch {
      return false;
    }
  }).length;

  // Overall Completion Percentage
  const overallProgressPercentage = totalTasks > 0
    ? Math.round((completedTasksCount / totalTasks) * 100)
    : 0;

  // Pending / Incomplete Tasks sorted by deadline
  const incompleteTasks = safeTasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return (isNaN(dateA) ? Infinity : dateA) - (isNaN(dateB) ? Infinity : dateB);
    });

  // Prominent Priority / Continue Task (Nearest incomplete task or first task)
  const priorityTask = incompleteTasks.length > 0 ? incompleteTasks[0] : (safeTasks[0] || null);

  // Recent Tasks preview list (up to 4 tasks)
  const myTasksPreviewList = safeTasks.slice(0, 4);

  // Extract all deliverables across assigned tasks for Recent Resources Preview
  const allResources = [];
  safeTasks.forEach((task) => {
    const list = Array.isArray(task.deliverables) && task.deliverables.length > 0
      ? task.deliverables
      : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'];

    list.forEach((item, idx) => {
      let itemName = 'Deliverable Spec';
      if (typeof item === 'string') {
        itemName = item;
      } else if (item && typeof item === 'object') {
        itemName = item.name || item.title || item.label || 'Deliverable Spec';
      }
      allResources.push({
        name: String(itemName),
        taskTitle: typeof task.title === 'string' ? task.title : 'Engineering Task',
        taskId: task._id ? String(task._id) : 'task',
        taskObj: task,
        resourceIndex: idx,
      });
    });
  });
  const recentResourcesPreview = allResources.slice(0, 4);

  // Dynamic Subject/Domain Task Progress Breakdown (Requirement 2)
  const subjectMap = {};
  safeTasks.forEach((t) => {
    const domain = t.topic && typeof t.topic === 'string' && t.topic.trim() ? t.topic.trim() : 'Engineering Track';
    if (!subjectMap[domain]) {
      subjectMap[domain] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
    }
    subjectMap[domain].total += 1;
    if (t.status === 'completed') {
      subjectMap[domain].completed += 1;
    } else if (t.status === 'in_progress') {
      subjectMap[domain].inProgress += 1;
    } else {
      subjectMap[domain].pending += 1;
    }
  });

  const subjectList = Object.keys(subjectMap).map((subject) => {
    const { total, completed, inProgress, pending } = subjectMap[subject];
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { subject, total, completed, inProgress, pending, percentage };
  });

  // Derived Recent Activity Log from real student data
  const recentActivityLog = [];
  safeTasks.forEach((t, idx) => {
    const tId = t._id ? String(t._id) : `t-${idx}`;
    const titleStr = typeof t.title === 'string' ? t.title : 'Task';
    if (t.status === 'completed' && t.completedAt) {
      recentActivityLog.push({
        id: `act-${tId}`,
        title: `Completed task: ${titleStr}`,
        time: formatDate(t.completedAt),
        type: 'completed',
      });
    } else {
      recentActivityLog.push({
        id: `act-assign-${tId}`,
        title: `Assigned task: ${titleStr}`,
        time: formatDate(t.createdAt || t.deadline),
        type: 'assigned',
      });
    }
  });
  if (streakData && streakData.currentStreak > 0) {
    recentActivityLog.unshift({
      id: 'act-streak',
      title: `Achieved ${streakData.currentStreak}-day activity streak milestone 🔥`,
      time: 'Today',
      type: 'streak',
    });
  }
  const activityLogPreview = recentActivityLog.slice(0, 4);

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  }

  function getInitials(name) {
    if (!name || typeof name !== 'string') return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // 3 Student Sidebar Items (Resources removed)
  const sidebarNavItems = [
    {
      id: 'dashboard',
      path: '/student/overview',
      name: 'Overview',
      description: 'Overview & learning workspace',
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
    },
    {
      id: 'my-tasks',
      path: '/student/my-tasks',
      name: 'My Tasks',
      description: 'All assigned tasks & specs',
      icon: <CheckSquare className="w-4.5 h-4.5" />,
    },
    {
      id: 'progress',
      path: '/student/progress',
      name: 'Progress',
      description: 'Status & completion tracking',
      icon: <TrendingUp className="w-4.5 h-4.5" />,
    },
  ];

  const getPageInfo = () => {
    switch (activeNav) {
      case 'my-tasks':
        return { breadcrumb: 'My Tasks', title: 'My Tasks' };
      case 'progress':
        return { breadcrumb: 'Progress', title: 'Progress' };
      case 'dashboard':
      default:
        return { breadcrumb: 'Overview', title: 'Overview' };
    }
  };

  const pageInfo = getPageInfo();

  // Helper renderer for consistent, interactive task cards — clean simple design
  const renderTaskCard = (task, idx, type) => {
    if (!task) return null;
    const isCompleted = task.status === 'completed';
    const isLeadTask = type === 'teamlead' || isTeamLeadTask(task);
    const accentColor = isLeadTask ? '#10b981' : '#7c3aed';

    return (
      <div
        key={task._id || idx}
        onClick={() => setSelectedOverviewTask(task)}
        className="bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="p-5">
          {/* Title + Status row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-[15px] font-semibold text-gray-900 leading-snug flex-1">
              {task.title}
            </h4>
            <span
              className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isCompleted ? '✓ Done' : 'In Progress'}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {task.topic && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  {task.topic}
                </span>
              )}
              <span>
                By <strong className="text-gray-700">{task.createdBy?.name || (isLeadTask ? 'Team Lead' : 'Admin')}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 font-mono">
                Due {formatDate(task.deadline)}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedOverviewTask(task); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="w-full min-h-screen lg:h-screen lg:max-h-screen flex bg-[#F7F5EE] font-sans antialiased text-[#1C1B1A] select-none overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Profile Details Modal */}
      <ProfileDetailsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* ==================== TASK OVERVIEW MODAL (Requirement 1) ==================== */}
      {selectedOverviewTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-[700px] w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E0DDD0] pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${selectedOverviewTask.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66645E]">
                  Task Overview Specs
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOverviewTask(null)}
                className="p-1 rounded-lg text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#EEECDF] text-[#1C1B1A] rounded-full border border-[#E0DDD0]">
                  {selectedOverviewTask.topic || 'Engineering Track'}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                    isTeamLeadTask(selectedOverviewTask)
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  {isTeamLeadTask(selectedOverviewTask) ? 'Team Lead Task' : 'Admin Task'}
                </span>
                {selectedOverviewTask.priority && (
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-amber-50 text-amber-900 rounded-full border border-amber-200">
                    {selectedOverviewTask.priority} Priority
                  </span>
                )}
                <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border ${selectedOverviewTask.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  {selectedOverviewTask.status === 'completed' ? '✓ Completed' : 'Pending / In Progress'}
                </span>
              </div>
              <h2 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">
                {selectedOverviewTask.title}
              </h2>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-[#66645E]">Task Description:</div>
              <p className="text-sm text-[#66645E] leading-relaxed bg-[#F4F1E8]/60 p-4 rounded-xl border border-[#E0DDD0] whitespace-pre-wrap">
                {selectedOverviewTask.description || 'No additional specification details provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-white rounded-xl border border-[#E0DDD0] space-y-1">
                <div className="text-[#66645E]">Deadline Date:</div>
                <div className="font-bold text-[#1C1B1A] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#1C1B1A]" />
                  {formatDate(selectedOverviewTask.deadline)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E0DDD0] space-y-1">
                <div className="text-[#66645E]">Assigned By:</div>
                <div className="font-bold text-[#1C1B1A] flex items-center gap-1.5">
                  <span>{selectedOverviewTask.createdBy?.name || (isTeamLeadTask(selectedOverviewTask) ? 'Team Lead' : 'Platform Admin')}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded ${
                      isTeamLeadTask(selectedOverviewTask)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {isTeamLeadTask(selectedOverviewTask) ? 'TEAM LEAD' : 'ADMIN'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase text-[#66645E]">Assigned Deliverables / Requirements:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Array.isArray(selectedOverviewTask.deliverables) && selectedOverviewTask.deliverables.length > 0
                  ? selectedOverviewTask.deliverables
                  : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation']
                ).map((deliv, dIdx) => (
                  <div key={dIdx} className="p-3 bg-white border border-[#E0DDD0] rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[#1C1B1A]">{typeof deliv === 'string' ? deliv : deliv.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E0DDD0]">
              <button
                type="button"
                onClick={() => setSelectedOverviewTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E0DDD0] text-[#1C1B1A] hover:bg-[#F8F6F0] cursor-pointer"
              >
                Close Overview
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedResourceTaskId(selectedOverviewTask._id);
                  setSelectedOverviewTask(null);
                  navigate('/student/resources');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1B1A] text-white hover:bg-black transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <FolderKanban className="w-4 h-4" />
                <span>View Task Resources ({Array.isArray(selectedOverviewTask.deliverables) ? selectedOverviewTask.deliverables.length : 4})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTIVE MEDIA RESOURCE VIEWER MODAL (Requirement 3) ==================== */}
      {activeMediaResource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-[760px] w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E0DDD0] pb-4">
              <div className="flex items-center gap-2.5">
                {activeMediaResource.type === 'video' ? (
                  <Video className="w-5 h-5 text-indigo-600" />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-600" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-[#1C1B1A]">{activeMediaResource.name}</h3>
                  <p className="text-[11px] text-[#66645E]">Task: {activeMediaResource.task.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMediaResource(null)}
                className="p-1 rounded-lg text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeMediaResource.type === 'video' ? (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-[#E0DDD0]">
                  <video
                    ref={videoRef}
                    controls
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full h-full object-contain"
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>

                <div className="bg-[#EEECDF]/80 border border-[#E0DDD0] p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-[#1C1B1A]">Automatic Video Completion Requirement:</span>
                    <span className="font-bold text-[#1C1B1A]">
                      Watched: {Math.floor(videoWatchedSecs / 60)}m {videoWatchedSecs % 60}s / {Math.floor(videoDurSecs / 60)}m {videoDurSecs % 60}s
                    </span>
                  </div>

                  <div className="w-full bg-[#E0DDD0] h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${videoWatchedSecs >= 0.5 * videoDurSecs ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, Math.round((videoWatchedSecs / (videoDurSecs || 1)) * 100))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#66645E]">
                    {videoWatchedSecs >= 0.5 * videoDurSecs
                      ? '✓ 50%+ Watch Goal Reached! This video resource is marked completed.'
                      : `Must watch at least 50% (${Math.ceil(0.5 * videoDurSecs)} seconds) of the total video duration to automatically mark as completed.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6 bg-[#F4F1E8]/60 border border-[#E0DDD0] rounded-xl text-center space-y-3">
                <FileCode className="w-10 h-10 text-[#1C1B1A] mx-auto" />
                <h4 className="font-serif text-xl font-bold text-[#1C1B1A]">{activeMediaResource.name}</h4>
                <p className="text-xs text-[#66645E] max-w-md mx-auto leading-relaxed">
                  Resource spec opened and verified. Viewing this document has automatically recorded your completion progress in MongoDB Atlas.
                </p>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resource Verified &amp; Completed
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E0DDD0]">
              <button
                type="button"
                onClick={() => setActiveMediaResource(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black cursor-pointer shadow-2xs"
              >
                Done Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LEFT FIXED LIGHT SIDEBAR ==================== */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[290px] h-full flex-shrink-0 bg-[#F2EFE6] text-[#1C1B1A] flex flex-col justify-between border-r border-[#E0DDD0] transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding & Navigation */}
        <div className="p-6 overflow-y-auto">
          {/* C4GT Brand Logo */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex flex-col gap-1 group">
              <div className="flex items-center gap-3">
                <C4GTLogo showText={false} imgClassName="h-11" />
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md bg-[#1C1B1A] text-white">
                  STUDENT
                </span>
              </div>
              <span className="text-base font-bold text-[#1C1B1A] font-serif tracking-tight mt-1.5 group-hover:text-black transition-colors">
                C4GT KIET HUB
              </span>
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-[#66645E] hover:text-[#1C1B1A] p-1 rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>


          {/* Navigation Section Label */}
          <div className="mb-3 px-2 flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-widest text-[#66645E] uppercase">Student Workspace</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>

          {/* STRICT 4 STUDENT NAVIGATION ITEMS */}
          <nav className="space-y-1.5">
            {sidebarNavItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`relative w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border text-left cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1C1B1A] font-semibold shadow-2xs border-[#E0DDD0]'
                      : 'hover:bg-black/5 text-[#66645E] hover:text-[#1C1B1A] border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#1C1B1A]" />
                  )}
                  <div className={`mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-[#1C1B1A]' : 'text-[#66645E]'}`}>
                    {item.icon}
                  </div>
                  <div className="leading-tight flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className={`text-[14px] ${isActive ? 'font-bold text-[#1C1B1A]' : 'font-medium'}`}>
                        {item.name}
                      </div>
                      {item.id === 'my-tasks' && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                          isActive ? 'bg-[#EEECDF] text-[#1C1B1A]' : 'bg-black/5 text-[#66645E]'
                        }`}>
                          {totalTasks}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] font-normal mt-0.5 truncate ${isActive ? 'text-[#4A4843]' : 'text-[#88867E]'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="p-5 border-t border-[#E0DDD0] bg-[#EEECDF]/60 space-y-3 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F8F6F0] text-[#1C1B1A] text-xs font-medium border border-[#E0DDD0] shadow-2xs transition-colors group cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-[#66645E]" />
              Exit to Main Site
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#66645E] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E0DDD0] shadow-2xs">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 overflow-hidden text-left hover:opacity-90 transition-opacity cursor-pointer group flex-1 min-w-0"
              title="Click to view & edit Profile Details"
            >
              <div className="w-9 h-9 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs shadow-inner flex-shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="truncate leading-tight min-w-0">
                <div className="font-semibold text-xs text-[#1C1B1A] truncate group-hover:text-black">
                  {user?.name || 'Student Account'}
                </div>
                <div className="text-[11px] text-[#66645E] font-mono truncate">
                  {user?.email || 'student@c4gt.in'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                    <span className="inline-block px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      LEAD
                    </span>
                  )}
                  <span className="inline-block px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded bg-[#1C1B1A]/[0.08] text-[#1C1B1A] border border-[#1C1B1A]/10">
                    STUDENT
                  </span>
                  <span className="text-[9px] text-[#1C1B1A] font-semibold underline">Profile Details</span>
                </div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              title="Log out"
              className="w-8 h-8 rounded-lg hover:bg-black/5 text-[#66645E] hover:text-rose-600 flex items-center justify-center transition-colors flex-shrink-0 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden min-w-0">
        {/* Sticky Header */}
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
                <Link to="/student" className="hover:text-[#1C1B1A] transition-colors">
                  Student Workspace
                </Link>
                <span className="text-[#9E9C94]">/</span>
                <span className="text-[#1C1B1A] font-semibold">{pageInfo.breadcrumb}</span>
              </div>
              <h1 className="font-['Instrument_Serif',serif] text-2xl sm:text-[28px] lg:text-[30px] font-semibold text-[#1C1B1A] tracking-tight leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bell Notification Popover Container */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsPopoverOpen((prev) => !prev)}
                className="relative p-2 rounded-full text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 transition-colors border border-[#E0DDD0] bg-white shadow-2xs cursor-pointer flex items-center justify-center"
                title="Notifications & Alerts"
              >
                <Bell className="w-4 h-4 text-[#1C1B1A]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-mono font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {notificationsPopoverOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                  <div className="p-4 border-b border-[#E0DDD0] flex items-center justify-between bg-[#F4F1E8]/70">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#1C1B1A]" />
                      <span className="font-serif text-lg font-bold text-[#1C1B1A]">Notifications</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                          {unreadNotificationsCount} Unread
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-mono font-semibold text-[#1C1B1A] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E0DDD0]/60 p-2">
                    {notificationsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#66645E]">
                        No notifications available right now.
                      </div>
                    ) : (
                      notificationsList.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkNotificationRead(n)}
                          className={`p-3 rounded-xl transition-colors cursor-pointer text-xs space-y-1.5 ${
                            !n.isRead ? 'bg-[#EEECDF]/80 hover:bg-[#EEECDF]' : 'hover:bg-[#F4F1E8]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-rose-500' : 'bg-[#E0DDD0]'}`} />
                              <span className="font-bold text-[#1C1B1A] truncate">{n.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#66645E] shrink-0">{formatDate(n.createdAt)}</span>
                          </div>
                          <p className="text-[#66645E] text-[11px] leading-relaxed pl-3.5">
                            {n.message}
                          </p>
                          {n.deadline && (
                            <div className="text-[10px] font-mono text-[#1C1B1A] pl-3.5">
                              Due: {formatDate(n.deadline)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Top Profile Header with Dropdown (Switch to Team Lead & Profile Routes) */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-black/5 transition-all cursor-pointer border ${
                  profileDropdownOpen ? 'border-[#1C1B1A] ring-2 ring-black/5 bg-[#F4F1E8]' : 'border-[#E0DDD0] bg-white'
                } shadow-2xs`}
                title="Account & Navigation Menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="w-8 h-8 rounded-full object-cover border border-[#E0DDD0]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1C1B1A] text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#1C1B1A] leading-tight flex items-center gap-1.5">
                    <span className="truncate max-w-[110px]">{user?.name || 'Student'}</span>
                    {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                      <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        LEAD
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-[#66645E] font-medium leading-tight">
                    {user?.role === 'teamlead' || user?.role === 'team_lead' ? 'Team Lead & Student' : 'Student Account'}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#66645E] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-[#1C1B1A]' : ''}`} />
              </button>

              {/* Profile Dropdown Popover */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header Card */}
                  <div className="p-4 border-b border-[#E0DDD0] bg-[#F4F1E8]/70">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name || 'User'} className="w-10 h-10 rounded-full object-cover border border-[#E0DDD0]" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1C1B1A] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-[#1C1B1A] truncate">{user?.name || 'Student Account'}</div>
                        <div className="text-[11px] text-[#66645E] font-mono truncate">{user?.email || 'student@c4gt.in'}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              TEAM LEAD
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-[#1C1B1A]/[0.08] text-[#1C1B1A] border border-[#1C1B1A]/10">
                            STUDENT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation & Actions */}
                  <div className="p-2 space-y-1">
                    {/* Switch to Team Lead Route (for Team Leads) */}
                    {(user?.role === 'teamlead' || user?.role === 'team_lead') && (
                      <Link
                        to="/teamlead"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-[#F7FDF9] hover:from-emerald-100/90 hover:to-emerald-50 border border-emerald-200/80 text-emerald-950 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-900 leading-tight flex items-center gap-1.5">
                              Switch to Team Lead
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-emerald-200/80 text-emerald-900">
                                Portal
                              </span>
                            </p>
                            <p className="text-[10px] text-emerald-700/90">Manage roster, invite members & tasks</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}

                    {/* Profile Route / Details */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F2EFE6] text-[#1C1B1A] transition-colors group cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E0DDD0] text-[#1C1B1A] flex items-center justify-center shadow-2xs group-hover:bg-[#1C1B1A] group-hover:text-white transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1C1B1A] leading-tight">My Profile</p>
                          <p className="text-[10px] text-[#66645E]">View & edit student details and track</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9E9C94] group-hover:text-[#1C1B1A] group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Exit to Main Site */}
                    <Link
                      to="/"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F2EFE6] text-[#1C1B1A] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E0DDD0] text-[#66645E] flex items-center justify-center shadow-2xs group-hover:text-[#1C1B1A]">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1C1B1A] leading-tight">Exit to Main Site</p>
                          <p className="text-[10px] text-[#66645E]">Return to public LMS landing page</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9E9C94] group-hover:text-[#1C1B1A] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="p-2 border-t border-[#E0DDD0] bg-[#F4F1E8]/30">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeNav === 'dashboard' && (
            <div className="max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-200">
              
              {/* 1. GREETING HERO BANNER */}
              <div className="relative rounded-2xl bg-gradient-to-r from-[#EBF3EA]/60 via-[#F8F6F0] to-[#FCEEE9]/50 border border-[#E0DDD0] p-8 text-[#1C1B1A] overflow-hidden shadow-2xs">
                <div className="relative z-10 max-w-[680px] space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-black/10 text-[11px] font-mono font-semibold tracking-wider uppercase shadow-2xs text-[#1C1B1A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#1C1B1A]" />
                    Learning Platform Workspace
                  </div>
                  <h2 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1B1A]">
                    Welcome back, {user?.name || 'Student'}!
                  </h2>
                  <p className="text-[#66645E] text-sm leading-relaxed">
                    Here is your task-focused learning overview. Track admin-assigned tasks, upcoming deadlines, sprint deliverables, and your activity progress.
                  </p>
                </div>
              </div>

              {/* TEAM INVITATIONS BANNER (When student has pending invites) */}
              {teamInvitations && teamInvitations.length > 0 && (
                <div className="space-y-4">
                  {teamInvitations.map((inv) => (
                    <div
                      key={inv._id}
                      className="rounded-2xl bg-gradient-to-r from-amber-50 via-[#FFFDF5] to-orange-50 border-2 border-amber-300 p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 animate-in slide-in-from-top-3 duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#1C1B1A] text-white flex items-center justify-center flex-shrink-0 font-bold font-mono text-sm shadow-xs">
                          {inv.teamId?.teamNumber || 'T'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-wider">
                              Team Invitation
                            </span>
                            <span className="text-xs text-[#66645E]">
                              Capacity: {(inv.teamId?.members?.length || 0) + (inv.teamId?.teamLeadId ? 1 : 0)} / {inv.teamId?.maxMembers || 9}
                            </span>
                          </div>
                          <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                            You have been invited to join {inv.teamId?.name || 'a Team'}!
                          </h3>
                          <p className="text-xs text-[#66645E]">
                            <strong>{inv.teamLeadId?.name || 'Team Lead'}</strong> ({inv.teamLeadId?.email}) invited you to join their team for <strong>{inv.teamId?.track || 'Track'}</strong>.
                          </p>
                          {inv.message && (
                            <div className="text-xs italic text-[#4A4843] bg-white/80 p-2.5 rounded-xl border border-amber-200/80 mt-1">
                              "{inv.message}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'reject')}
                          disabled={respondingInviteId === inv._id}
                          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-xs font-semibold text-[#66645E] hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'accept')}
                          disabled={respondingInviteId === inv._id}
                          className="px-5 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          {respondingInviteId === inv._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          <span>Accept & Join Team</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MY COHORT TEAM WIDGET (When user belongs to a team) */}
              {studentTeam && (
                <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E0DDD0]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center font-bold font-mono text-sm">
                        {studentTeam.teamNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase text-[#1C1B1A]">
                            MY COHORT TEAM
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded-full font-semibold">
                            ACTIVE MEMBER
                          </span>
                        </div>
                        <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                          {studentTeam.name} • {studentTeam.track || 'Engineering Track'}
                        </h3>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-[#66645E] bg-[#F2EFE6] px-3 py-1 rounded-xl border border-[#E0DDD0]">
                      Roster: {(studentTeam.members?.length || 0) + (studentTeam.teamLeadId ? 1 : 0)} / {studentTeam.maxMembers || 9} Members
                    </div>
                  </div>

                  {/* Team Lead & Teammates List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Team Lead */}
                    <div className="p-3.5 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0] text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-[#66645E]">Team Lead</span>
                      <p className="font-bold text-[#1C1B1A]">{studentTeam.teamLeadId?.name || 'Assigned Lead'}</p>
                      {studentTeam.teamLeadId?.email && (
                        <p className="text-[11px] text-[#66645E] font-mono truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                          <a href={`mailto:${studentTeam.teamLeadId.email}`} className="hover:underline">
                            {studentTeam.teamLeadId.email}
                          </a>
                        </p>
                      )}
                      {(studentTeam.teamLeadId?.phone || studentTeam.teamLeadId?.phoneNumber) && (
                        <p className="text-[11px] text-emerald-800 font-mono truncate flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <a
                            href={`tel:${studentTeam.teamLeadId.phone || studentTeam.teamLeadId.phoneNumber}`}
                            className="hover:underline font-semibold"
                          >
                            {studentTeam.teamLeadId.phone || studentTeam.teamLeadId.phoneNumber}
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Fellow Members Preview */}
                    <div className="md:col-span-2 p-3.5 bg-white rounded-xl border border-[#E0DDD0] text-xs">
                      <span className="text-[10px] font-mono uppercase text-[#66645E]">
                        Team Members ({(studentTeam.members?.length || 0)} Joined)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {studentTeam.members && studentTeam.members.length > 0 ? (
                          studentTeam.members.map((m, idx) => (
                            <div
                              key={m._id || idx}
                              className={`p-2.5 rounded-xl text-xs border flex flex-col justify-between ${
                                m._id === user?._id || m.email === user?.email
                                  ? 'bg-[#1C1B1A] text-white border-black shadow-xs'
                                  : 'bg-[#FDFCF9] text-[#1C1B1A] border-[#E0DDD0]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate">
                                  {m.name || 'Student'} {m._id === user?._id ? '(You)' : ''}
                                </span>
                                <span className={`text-[10px] font-mono ${m._id === user?._id ? 'text-amber-300 font-semibold' : 'text-[#88867E]'}`}>
                                  {m.rollNumber || ''}
                                </span>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                <div className={`text-[10px] font-mono truncate flex items-center gap-1 ${m._id === user?._id ? 'text-gray-300' : 'text-[#66645E]'}`}>
                                  <Mail className="w-2.5 h-2.5 shrink-0 opacity-70" />
                                  <span className="truncate">{m.email}</span>
                                </div>
                                {(m.phone || m.phoneNumber) && (
                                  <div className={`text-[10px] font-mono truncate flex items-center gap-1 ${m._id === user?._id ? 'text-emerald-300' : 'text-emerald-700 font-medium'}`}>
                                    <Phone className="w-2.5 h-2.5 shrink-0" />
                                    <span>{m.phone || m.phoneNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#88867E] italic">You are the first member to join!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. STATS CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Total Tasks */}
                <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Total Tasks</span>
                    <div className="w-8 h-8 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center shadow-2xs">
                      <ListTodo className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">{totalTasks}</div>
                    <span className="text-[11px] font-mono font-medium text-[#1C1B1A] bg-[#EEECDF] px-2.5 py-0.5 rounded-full border border-[#E0DDD0]">
                      Assigned
                    </span>
                  </div>
                  <p className="text-xs text-[#66645E] mt-1 font-mono">
                    {adminTasks.length} Admin • {teamLeadTasks.length} Team Lead
                  </p>
                </div>

                {/* Completed */}
                <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Completed</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">{completedTasksCount}</div>
                    <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Finished
                    </span>
                  </div>
                  <p className="text-xs text-[#66645E] mt-1">Successfully completed</p>
                </div>

                {/* In Progress */}
                <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">In Progress</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">{inProgressTasksCount}</div>
                    <span className="text-[11px] font-mono font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#66645E] mt-1">Tasks underway</p>
                </div>

                {/* Due Soon */}
                <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Due Soon</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-200">
                      <Calendar className="w-4 h-4 text-rose-700" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">{dueSoonTasksCount}</div>
                    <span className="text-[11px] font-mono font-medium text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Urgent
                    </span>
                  </div>
                  <p className="text-xs text-[#66645E] mt-1">Next 5 days deadline</p>
                </div>

                {/* COMPACT ACTIVITY STREAK CARD */}
                <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Activity Streak</span>
                    <div className="w-8 h-8 rounded-xl bg-[#1C1B1A] text-amber-400 flex items-center justify-center shadow-2xs">
                      <Flame className="w-4 h-4 fill-amber-400" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">{streakData?.currentStreak || 0}</div>
                    <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" /> Days
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E0DDD0]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => {
                      const dayObj = streakData?.weeklyActivity && streakData.weeklyActivity[idx];
                      const isDone = dayObj && dayObj.isStreakCompleted;
                      const isToday = dayObj && dayObj.isToday;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-0.5" title={d}>
                          <span className="text-[9px] font-mono text-[#66645E]">{d}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isDone
                                ? 'bg-emerald-600'
                                : isToday
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-[#E0DDD0]'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. PROMINENT CONTINUE / PRIORITY TASK CARD */}
              {priorityTask && (
                <div className="bg-[#FDFCF9] rounded-2xl border-2 border-[#1C1B1A]/20 p-6 sm:p-8 shadow-2xs space-y-5 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0DDD0] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#1C1B1A] text-white">
                            Priority Action Item
                          </span>
                          {priorityTask.priority && typeof priorityTask.priority === 'string' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0]">
                              {priorityTask.priority} Priority
                            </span>
                          )}
                        </div>
                        <h3 className="font-['Instrument_Serif',serif] text-2xl sm:text-3xl font-semibold text-[#1C1B1A] mt-1">
                          {typeof priorityTask.title === 'string' ? priorityTask.title : 'Engineering Sprint Task'}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs text-[#66645E] bg-[#EEECDF]/80 px-3 py-1.5 rounded-xl border border-[#E0DDD0]">
                      <Calendar className="w-4 h-4 text-[#1C1B1A]" />
                      <span>Due: {formatDate(priorityTask.deadline)}</span>
                    </div>
                  </div>

                  {priorityTask.description && (
                    <p className="text-sm text-[#66645E] leading-relaxed max-w-[850px] line-clamp-3">
                      {typeof priorityTask.description === 'string' ? priorityTask.description : String(priorityTask.description)}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#1C1B1A]">Task Milestone Progress</span>
                      <span className="font-mono font-bold text-[#1C1B1A]">
                        {priorityTask.status === 'completed' ? '100%' : priorityTask.status === 'in_progress' ? '50%' : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-[#E0DDD0] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          priorityTask.status === 'completed' ? 'bg-emerald-600 w-full' : priorityTask.status === 'in_progress' ? 'bg-amber-500 w-1/2' : 'bg-[#1C1B1A] w-1/12'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3 text-xs text-[#66645E] flex-wrap">
                      <span className="bg-[#EEECDF] text-[#1C1B1A] px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border border-[#E0DDD0]">
                        Track: {priorityTask.topic || 'Engineering Track'}
                      </span>
                      <span>Assigned by: <strong className="text-[#1C1B1A]">{priorityTask.createdBy?.name || 'Admin'}</strong></span>
                    </div>

                    <div className="flex items-center gap-3">
                      {priorityTask.status === 'completed' ? (
                        <span className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Task Finished
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedOverviewTask(priorityTask)}
                          className="bg-[#1C1B1A] hover:bg-black text-white font-semibold text-xs rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          Open Task Specs
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MY TASKS PREVIEW SECTION */}
              <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#1C1B1A]" />
                      My Tasks Overview
                    </h3>
                    <p className="text-xs text-[#66645E] mt-0.5">
                      Assigned sprint deliverables divided into Admin and Team Lead sections.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-[#F2EFE6] p-1 rounded-xl border border-[#E0DDD0] text-xs">
                      <button
                        type="button"
                        onClick={() => setOverviewTaskFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          overviewTaskFilter === 'all' ? 'bg-[#1C1B1A] text-white shadow-2xs' : 'text-[#66645E]'
                        }`}
                      >
                        All ({totalTasks})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverviewTaskFilter('admin')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          overviewTaskFilter === 'admin' ? 'bg-purple-700 text-white shadow-2xs' : 'text-[#66645E]'
                        }`}
                      >
                        Admin ({adminTasks.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverviewTaskFilter('teamlead')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          overviewTaskFilter === 'teamlead' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-[#66645E]'
                        }`}
                      >
                        Team Lead ({teamLeadTasks.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/student/my-tasks')}
                      className="text-xs font-semibold text-[#1C1B1A] hover:underline flex items-center gap-1 cursor-pointer pl-1"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {loadingTasks ? (
                    <div className="p-6 text-center text-xs text-[#66645E] flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#1C1B1A]" />
                      <span>Loading assigned tasks...</span>
                    </div>
                  ) : safeTasks.length === 0 ? (
                    <div className="p-5 text-center text-xs text-[#66645E] bg-[#F4F1E8]/50 rounded-xl border border-[#E0DDD0]">
                      No tasks assigned currently.
                    </div>
                  ) : (
                    <>
                      {/* SECTION 1: ADMIN TASKS PREVIEW */}
                      {(overviewTaskFilter === 'all' || overviewTaskFilter === 'admin') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-950">
                                Admin Curriculum Tasks ({adminTasks.length})
                              </h4>
                            </div>
                            <span className="text-[11px] font-mono text-[#66645E]">
                              {adminTasks.filter((t) => t.status === 'completed').length} completed
                            </span>
                          </div>

                          {adminTasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#66645E] bg-[#F4F1E8]/40 rounded-xl border border-[#E0DDD0]">
                              No Admin tasks assigned yet.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {adminTasks.slice(0, 2).map((t, idx) => (
                                <div
                                  key={t._id || idx}
                                  className="p-4 rounded-xl border border-purple-200/80 bg-white hover:border-purple-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs cursor-pointer"
                                  onClick={() => setSelectedOverviewTask(t)}
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                      <h4 className="font-bold text-[#1C1B1A] truncate text-sm font-serif">
                                        {typeof t.title === 'string' ? t.title : 'Task Item'}
                                      </h4>
                                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">
                                        ADMIN
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#66645E] truncate">{t.topic || 'Engineering Track'}</p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] font-mono text-[#66645E]">
                                      Due {formatDate(t.deadline)}
                                    </span>
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                                        t.status === 'completed'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : 'bg-[#EEECDF] text-[#1C1B1A] border-[#E0DDD0]'
                                      }`}
                                    >
                                      {t.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOverviewTask(t);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                                    >
                                      View Overview
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 2: TEAM LEAD TASKS PREVIEW */}
                      {(overviewTaskFilter === 'all' || overviewTaskFilter === 'teamlead') && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                                Team Lead Tasks ({teamLeadTasks.length})
                              </h4>
                            </div>
                            <span className="text-[11px] font-mono text-[#66645E]">
                              {teamLeadTasks.filter((t) => t.status === 'completed').length} completed
                            </span>
                          </div>

                          {teamLeadTasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#66645E] bg-[#F4F1E8]/40 rounded-xl border border-[#E0DDD0]">
                              No tasks assigned by your Team Lead yet.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {teamLeadTasks.slice(0, 2).map((t, idx) => (
                                <div
                                  key={t._id || idx}
                                  className="p-4 rounded-xl border border-emerald-200/80 bg-white hover:border-emerald-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs cursor-pointer"
                                  onClick={() => setSelectedOverviewTask(t)}
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                      <h4 className="font-bold text-[#1C1B1A] truncate text-sm font-serif">
                                        {typeof t.title === 'string' ? t.title : 'Task Item'}
                                      </h4>
                                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        TEAM LEAD
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#66645E] truncate">
                                      Lead: {t.createdBy?.name || 'Team Lead'} • {t.topic || 'Sprint'}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] font-mono text-[#66645E]">
                                      Due {formatDate(t.deadline)}
                                    </span>
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                                        t.status === 'completed'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : 'bg-emerald-50/50 text-emerald-900 border-emerald-200'
                                      }`}
                                    >
                                      {t.status === 'completed' ? 'Completed' : 'Pending'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOverviewTask(t);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                                    >
                                      View Overview
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 5. TWO-COLUMN LOWER DASHBOARD GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: OVERALL PROGRESS, UPCOMING DEADLINES, RECENT ACTIVITY */}
                <div className="space-y-6">
                  
                  {/* OVERALL PROGRESS CARD */}
                  <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-[#1C1B1A]" />
                          Overall Progress
                        </h3>
                        <p className="text-xs text-[#66645E] mt-0.5">
                          Cohort milestone completion rate
                        </p>
                      </div>
                      <span className="text-xl font-mono font-bold text-[#1C1B1A]">
                        {overallProgressPercentage}%
                      </span>
                    </div>

                    <div className="w-full bg-[#E0DDD0] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${overallProgressPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#66645E] font-mono pt-1">
                      <span>{completedTasksCount} of {totalTasks} Tasks Completed</span>
                      <span>Target: 100%</span>
                    </div>
                  </div>

                  {/* UPCOMING DEADLINES MODULE */}
                  <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
                    <div className="p-6 border-b border-[#E0DDD0] flex items-center justify-between">
                      <div>
                        <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#1C1B1A]" />
                          Upcoming Deadlines
                        </h3>
                        <p className="text-xs text-[#66645E] mt-0.5">
                          Incomplete tasks sorted by nearest due date.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {incompleteTasks.length} Pending
                      </span>
                    </div>
                    <div className="p-6 space-y-3">
                      {incompleteTasks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#66645E] bg-[#F4F1E8]/50 rounded-xl border border-[#E0DDD0]">
                          No upcoming deadlines! All tasks completed. 🎉
                        </div>
                      ) : (
                        incompleteTasks.slice(0, 4).map((t, idx) => (
                          <div
                            key={t._id || idx}
                            onClick={() => setSelectedOverviewTask(t)}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-[#E0DDD0] bg-white hover:border-[#1C1B1A]/40 transition-all text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              <div className="truncate">
                                <h4 className="font-bold text-[#1C1B1A] truncate">{t.title}</h4>
                                <p className="text-[11px] text-[#66645E] truncate">{t.topic || 'Engineering Task'}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              Due {formatDate(t.deadline)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* RECENT ACTIVITY LOG */}
                  <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
                    <div className="p-6 border-b border-[#E0DDD0] flex items-center justify-between">
                      <div>
                        <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#1C1B1A]" />
                          Recent Activity Log
                        </h3>
                        <p className="text-xs text-[#66645E] mt-0.5">
                          Latest learning events &amp; status updates.
                        </p>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      {activityLogPreview.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#66645E] bg-[#F4F1E8]/50 rounded-xl border border-[#E0DDD0]">
                          No activity logged yet.
                        </div>
                      ) : (
                        activityLogPreview.map((act) => (
                          <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E0DDD0] text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              <span className="font-medium text-[#1C1B1A] truncate">{act.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#66645E] shrink-0 ml-2">{act.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY TASKS (DIVIDED INTO ADMIN TASKS & TEAM LEAD TASKS) */}
          {activeNav === 'my-tasks' && (
            <div className="max-w-[1240px] mx-auto space-y-6 animate-in fade-in duration-200">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
                  <p className="text-sm text-gray-500 mt-0.5">All tasks assigned to you by Admin and Team Lead.</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setTaskFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      taskFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    All <span className="ml-1 text-xs text-gray-400">({totalTasks})</span>
                  </button>
                  <button type="button" onClick={() => setTaskFilter('admin')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      taskFilter === 'admin' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    Admin <span className="ml-1 text-xs text-gray-400">({adminTasks.length})</span>
                  </button>
                  <button type="button" onClick={() => setTaskFilter('teamlead')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      taskFilter === 'teamlead' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    Team Lead <span className="ml-1 text-xs text-gray-400">({teamLeadTasks.length})</span>
                  </button>
                </div>
              </div>

              {loadingTasks ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading tasks...</span>
                </div>
              ) : safeTasks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <p className="text-base font-semibold text-gray-800">No tasks assigned yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Tasks from Admin and Team Lead will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SECTION 1: ADMIN TASKS */}
                  {(taskFilter === 'all' || taskFilter === 'admin') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Admin Tasks</h3>
                          <span className="text-xs text-gray-400">({adminTasks.length})</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {adminTasks.filter((t) => t.status === 'completed').length} of {adminTasks.length} completed
                        </span>
                      </div>
                      {adminTasks.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-slate-200">
                          No Admin tasks assigned yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {adminTasks.map((task, idx) => renderTaskCard(task, idx, 'admin'))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: TEAM LEAD TASKS */}
                  {(taskFilter === 'all' || taskFilter === 'teamlead') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Team Lead Tasks</h3>
                          <span className="text-xs text-gray-400">({teamLeadTasks.length})</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {teamLeadTasks.filter((t) => t.status === 'completed').length} of {teamLeadTasks.length} completed
                        </span>
                      </div>
                      {teamLeadTasks.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-slate-200">
                          No Team Lead tasks assigned yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teamLeadTasks.map((task, idx) => renderTaskCard(task, idx, 'teamlead'))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* TAB 4: PROGRESS (Requirement 2: Subject/Domain Bar Graph & Breakdown) */}
          {activeNav === 'progress' && (
            <div className="max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-200">
              {/* OVERALL PROGRESS TOP CONTAINER */}
              <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#1C1B1A]" />
                      Progress &amp; Completion Tracking
                    </h3>
                    <p className="text-xs text-[#66645E] mt-0.5">
                      Real-time subject/domain breakdown and automatic completion tracking.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#1C1B1A] bg-[#EEECDF] border border-[#E0DDD0] px-3 py-1 rounded-full">
                    {completedTasksCount} of {totalTasks} Completed ({overallProgressPercentage}%)
                  </span>
                </div>

                {/* REQUIREMENT 2: BAR GRAPH SHOWING TASK PROGRESS BY SUBJECT/DOMAIN */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-mono font-bold text-[#1C1B1A] uppercase tracking-wider">
                      Subject / Domain Task Progress Bar Graph
                    </h4>
                    <p className="text-xs text-[#66645E]">
                      Dynamic completion breakdown across assigned learning tracks.
                    </p>
                  </div>

                  {subjectList.length === 0 ? (
                    <div className="p-8 text-center text-[#66645E] bg-[#F4F1E8]/50 rounded-xl border border-[#E0DDD0] text-xs">
                      No subject task data available yet.
                    </div>
                  ) : (
                    <div className="space-y-5 bg-[#F4F1E8]/60 p-6 rounded-2xl border border-[#E0DDD0]">
                      <div className="space-y-4">
                        {subjectList.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-[#1C1B1A]">{item.subject}</span>
                              <span className="text-[#66645E]">
                                <strong>{item.completed}</strong> / {item.total} Tasks ({item.percentage}%)
                              </span>
                            </div>

                            {/* Stacked Bar Graph Visual */}
                            <div className="w-full bg-[#E0DDD0] h-4 rounded-full overflow-hidden flex shadow-inner">
                              {item.completed > 0 && (
                                <div
                                  className="bg-emerald-600 h-full transition-all duration-500"
                                  style={{ width: `${(item.completed / item.total) * 100}%` }}
                                  title={`Completed: ${item.completed}`}
                                />
                              )}
                              {item.inProgress > 0 && (
                                <div
                                  className="bg-amber-500 h-full transition-all duration-500"
                                  style={{ width: `${(item.inProgress / item.total) * 100}%` }}
                                  title={`In Progress: ${item.inProgress}`}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-6 pt-3 border-t border-[#E0DDD0] text-xs font-mono text-[#66645E]">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                          <span>Completed Tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                          <span>In Progress / Pending</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED SUBJECT CARDS BREAKDOWN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectList.map((item, idx) => (
                  <div key={idx} className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#EEECDF] text-[#1C1B1A] px-2.5 py-0.5 rounded-full border border-[#E0DDD0]">
                          Domain Track
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1C1B1A]">
                          {item.percentage}% Done
                        </span>
                      </div>
                      <h4 className="font-serif text-xl font-bold text-[#1C1B1A] pt-1">{item.subject}</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                        <div className="font-bold text-base">{item.completed}</div>
                        <div className="text-[10px]">Completed</div>
                      </div>
                      <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                        <div className="font-bold text-base">{item.inProgress}</div>
                        <div className="text-[10px]">In Progress</div>
                      </div>
                      <div className="p-2.5 bg-[#EEECDF] text-[#1C1B1A] rounded-xl border border-[#E0DDD0]">
                        <div className="font-bold text-base">{item.pending}</div>
                        <div className="text-[10px]">Pending</div>
                      </div>
                    </div>

                    <div className="w-full bg-[#E0DDD0] h-2 rounded-full overflow-hidden pt-1">
                      <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== SELECTED TASK OVERVIEW MODAL ==================== */}
      {selectedOverviewTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedOverviewTask(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-[#66645E] hover:text-[#1C1B1A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1C1B1A] text-white px-2.5 py-0.5 rounded-full">
                  Task Overview
                </span>
                {selectedOverviewTask.topic && (
                  <span className="text-[10px] font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] px-2.5 py-0.5 rounded-full border border-[#E0DDD0]">
                    Domain: {selectedOverviewTask.topic}
                  </span>
                )}
                <span
                  className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                    selectedOverviewTask.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {selectedOverviewTask.status === 'completed' ? '✓ Completed' : 'Pending / In Progress'}
                </span>
              </div>
              <h2 className="font-['Instrument_Serif',serif] text-3xl font-bold text-[#1C1B1A]">
                {selectedOverviewTask.title}
              </h2>
            </div>

            <div className="space-y-3 bg-[#F4F1E8]/60 p-4 rounded-xl border border-[#E0DDD0]">
              <h4 className="text-xs font-mono font-bold text-[#1C1B1A] uppercase tracking-wider">
                Task Specifications &amp; Description
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed whitespace-pre-line">
                {selectedOverviewTask.description || 'No detailed description specified.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono border-t border-[#E0DDD0]">
                <div>
                  <span className="text-[#66645E] text-[10px] block">Deadline:</span>
                  <span className="font-bold text-[#1C1B1A]">{formatDate(selectedOverviewTask.deadline)}</span>
                </div>
                <div>
                  <span className="text-[#66645E] text-[10px] block">Priority:</span>
                  <span className="font-bold text-[#1C1B1A]">{selectedOverviewTask.priority || 'Normal'}</span>
                </div>
                <div>
                  <span className="text-[#66645E] text-[10px] block">Created By:</span>
                  <span className="font-bold text-[#1C1B1A]">{selectedOverviewTask.createdBy?.name || 'Admin'}</span>
                </div>
              </div>
            </div>

            {/* Resources List in Overview */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-[#1C1B1A] uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Task Resources ({Array.isArray(selectedOverviewTask.deliverables) ? selectedOverviewTask.deliverables.length : 4})</span>
                <span className="text-[10px] font-normal text-[#66645E]">50%+ watch time required for videos</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(Array.isArray(selectedOverviewTask.deliverables) && selectedOverviewTask.deliverables.length > 0
                  ? selectedOverviewTask.deliverables
                  : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation']
                ).map((item, idx) => {
                  const itemName = typeof item === 'string' ? item : item.name || 'Resource';
                  const key = `${selectedOverviewTask._id}_res-${idx}`;
                  const prog = resourceProgressMap[key];
                  const isDone = Boolean(prog && prog.isCompleted);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-[#E0DDD0] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#1C1B1A] shrink-0" />
                        <span className="font-semibold text-[#1C1B1A] truncate">{String(itemName)}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#EEECDF] text-[#1C1B1A] border-[#E0DDD0]'
                        }`}
                      >
                        {isDone ? '✓ Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0DDD0]">
              <button
                type="button"
                onClick={() => setSelectedOverviewTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66645E] hover:bg-black/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedResourceTaskId(selectedOverviewTask._id);
                  setActiveNav('resources');
                  setSelectedOverviewTask(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <span>View Task Resources</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTIVE MEDIA / VIDEO VIEWER MODAL ==================== */}
      {activeMediaResource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] max-w-3xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <button
              type="button"
              onClick={closeMediaResource}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-[#66645E] hover:text-[#1C1B1A] transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1C1B1A] text-white px-2.5 py-0.5 rounded-full">
                  Resource Viewer
                </span>
                <span className="text-[10px] font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] px-2.5 py-0.5 rounded-full border border-[#E0DDD0]">
                  Task: {activeMediaResource.task?.title}
                </span>
              </div>
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                {activeMediaResource.name}
              </h3>
            </div>

            {/* Video Player or Document Spec Viewer */}
            {activeMediaResource.type === 'video' ? (
              <div className="space-y-4">
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md relative">
                  {isYouTubeUrl(activeMediaResource.url || activeMediaResource.name) ? (
                    <div id="yt-player-iframe" className="w-full h-full" />
                  ) : (
                    <video
                      ref={videoRef}
                      controls
                      src={activeMediaResource.url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                      onTimeUpdate={handleHtml5TimeUpdate}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Video Watch Progress Tracker */}
                <div className="p-4 bg-[#F4F1E8]/70 rounded-xl border border-[#E0DDD0] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#1C1B1A]">
                      Watch Time Progress: {formatTimeSecs(videoWatchedSecs)} / {formatTimeSecs(videoDurSecs)}
                    </span>
                    <span className="font-bold text-[#1C1B1A]">
                      {videoDurSecs > 0 ? Math.min(100, Math.round((videoWatchedSecs / videoDurSecs) * 100)) : 0}%
                    </span>
                  </div>

                  <div className="w-full bg-[#E0DDD0] h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        videoWatchedSecs >= 0.5 * videoDurSecs ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${videoDurSecs > 0 ? Math.min(100, (videoWatchedSecs / videoDurSecs) * 100) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                    <span className="text-[#66645E]">
                      Required: At least 50% watch time ({formatTimeSecs(0.5 * videoDurSecs)})
                    </span>
                    {videoWatchedSecs >= 0.5 * videoDurSecs ? (
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ 50%+ Watched - Completed!
                      </span>
                    ) : (
                      <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Watching in progress...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4 bg-[#F4F1E8]/60 rounded-xl border border-[#E0DDD0]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#1C1B1A] text-base">Deliverable Resource Verified</h4>
                  <p className="text-xs text-[#66645E]">
                    Opening and viewing this deliverable specification automatically marked it completed in your progress log.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-[#E0DDD0]">
              <button
                type="button"
                onClick={closeMediaResource}
                className="px-5 py-2.5 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                Close &amp; Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
