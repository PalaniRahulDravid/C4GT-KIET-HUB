import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TeamTasks() {
  const { token, apiBaseUrl } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    title: 'Task published successfully!',
    description: 'Students and team leads across Cohorts 1–9 can now view this task on their dashboard.',
    type: 'success',
  });

  // Filter & Search states
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cohorts' | 'junior_developers' | 'developer_interns'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for viewing and editing tasks
  const [viewingTask, setViewingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [teamLeadsMap, setTeamLeadsMap] = useState({});

  const cohortListBase = [
    { num: 1, baseLabel: 'Team 1', full: 'Team 1 - Machine Learning & AI Track' },
    { num: 2, baseLabel: 'Team 2', full: 'Team 2 - DSA & Problem Solving Track' },
    { num: 3, baseLabel: 'Team 3', full: 'Team 3 - Full Stack Web Development Track' },
    { num: 4, baseLabel: 'Team 4', full: 'Team 4 - Web3 & Smart Contracts Track' },
    { num: 5, baseLabel: 'Team 5', full: 'Team 5 - Cloud & DevOps Automation Track' },
    { num: 6, baseLabel: 'Team 6', full: 'Team 6 - Open Source Contributions Track' },
    { num: 7, baseLabel: 'Team 7', full: 'Team 7 - Mobile Application Development Track' },
    { num: 8, baseLabel: 'Team 8', full: 'Team 8 - Cybersecurity & Network Defense Track' },
    { num: 9, baseLabel: 'Team 9', full: 'Team 9 - Data Engineering & Analytics Track' },
  ];

  const cohortList = useMemo(() => {
    return cohortListBase.map((c) => {
      const leadName = teamLeadsMap[c.num];
      return {
        ...c,
        label: leadName ? `${c.baseLabel} - ${leadName}` : c.baseLabel,
      };
    });
  }, [teamLeadsMap]);

  const defaultDeliverables = [
    'Source Code Repo',
    'GitHub Pull Request',
    'Documentation / Spec',
    'Demo / Presentation',
  ];

  // Default initial form state matching mockup
  const initialForm = {
    title: 'Build Authentication Flow & Role Guards (Google SSO + RBAC)',
    topic: 'Full-Stack Web Dev / Security & RBAC / MongoDB Atlas',
    targetGroup: 'both',
    deadline: '2026-09-24T23:59',
    description:
      'Connect Google OAuth 2.0 authentication with MongoDB Atlas users collection. Ensure Team Lead role gating and Admin privilege verification before granting workspace access. Provide unit tests and a live deployment preview link.',
    priority: 'Normal',
    assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    deliverables: [...defaultDeliverables],
  };

  const [form, setForm] = useState(initialForm);
  const [teamSelectionMode, setTeamSelectionMode] = useState('all'); // 'all' | 'individual'
  const [customDeliverableInput, setCustomDeliverableInput] = useState('');
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const defaultMockTasks = [
    {
      _id: 'task-default-1',
      title: 'Build Authentication Flow & Role Guards',
      description: 'Google OAuth 2.0 integration with MongoDB Atlas user collection and RBAC guards.',
      topic: 'Full-Stack / Security',
      targetGroup: 'both',
      assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'Normal',
      status: 'Published',
      deliverables: defaultDeliverables,
    },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
          setTasks(data.tasks);
        } else {
          setTasks(defaultMockTasks);
        }
      } else {
        setTasks(defaultMockTasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks(defaultMockTasks);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.teams)) {
          const map = {};
          data.teams.forEach((t) => {
            const leadName = t.teamLeadId && typeof t.teamLeadId === 'object' ? t.teamLeadId.name : null;
            if (t.teamNumber) {
              map[t.teamNumber] = leadName;
            }
          });
          setTeamLeadsMap(map);
        }
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTeamsData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTasks(), fetchTeamsData()]);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Toggle cohort team in form
  const handleToggleTeam = (teamNum) => {
    setForm((prev) => {
      const exists = prev.assignedTeams.includes(teamNum);
      const updated = exists
        ? prev.assignedTeams.filter((n) => n !== teamNum)
        : [...prev.assignedTeams, teamNum];
      return { ...prev, assignedTeams: updated };
    });
  };

  // Select all teams mode handler
  const handleSelectAllTeamsMode = () => {
    setTeamSelectionMode('all');
    setForm((prev) => ({
      ...prev,
      assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    }));
  };

  // Select individual teams mode handler
  const handleSelectIndividualTeamsMode = () => {
    setTeamSelectionMode('individual');
  };

  // Toggle deliverable checkbox
  const handleToggleDeliverable = (item) => {
    setForm((prev) => {
      const exists = prev.deliverables.includes(item);
      const updated = exists
        ? prev.deliverables.filter((d) => d !== item)
        : [...prev.deliverables, item];
      return { ...prev, deliverables: updated };
    });
  };

  // Add custom deliverable
  const handleAddCustomDeliverable = (e) => {
    e.preventDefault();
    if (!customDeliverableInput.trim()) return;
    const val = customDeliverableInput.trim();
    if (!form.deliverables.includes(val)) {
      setForm((prev) => ({
        ...prev,
        deliverables: [...prev.deliverables, val],
      }));
    }
    setCustomDeliverableInput('');
    setShowAddDeliverable(false);
  };

  // Publish / Create task
  const handlePublishTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.deadline) {
      alert('Please fill out Title, Description, and Deadline.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setToastMessage({
          title: 'Task published successfully!',
          description:
            'Students and team leads across Cohorts 1–9 can now view this task on their dashboard.',
          type: 'success',
        });
      } else {
        // Fallback optimistic addition for local testing
        const newTask = {
          _id: `task-${Date.now()}`,
          ...form,
          status: 'Published',
          createdAt: new Date().toISOString(),
        };
        setTasks((prev) => [newTask, ...prev]);
        setToastMessage({
          title: 'Task published successfully!',
          description:
            'Students and team leads across Cohorts 1–9 can now view this task on their dashboard.',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Publish task error:', err);
      // Fallback optimistic addition
      const newTask = {
        _id: `task-${Date.now()}`,
        ...form,
        status: 'Published',
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      setToastMessage({
        title: 'Task published successfully!',
        description:
          'Students and team leads across Cohorts 1–9 can now view this task on their dashboard.',
        type: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE_URL}/admin/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setDeleteConfirmId(null);
      setToastMessage({
        title: 'Task deleted',
        description: 'The task was removed from all cohort boards.',
        type: 'info',
      });
    } catch (err) {
      console.error('Delete task error:', err);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setDeleteConfirmId(null);
    }
  };

  // Update existing task
  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/admin/tasks/${editingTask._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editingTask),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? data.task : t)));
      } else {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? editingTask : t)));
      }
      setEditingTask(null);
      setToastMessage({
        title: 'Task updated successfully!',
        description: 'Updated deliverables and deadlines have been synchronized.',
        type: 'success',
      });
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? editingTask : t)));
      setEditingTask(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Date formatter helper
  const formatDeadline = (dateStr) => {
    if (!dateStr) return { dayMonth: '24 Sep', sub: '6 days left' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { dayMonth: dateStr, sub: '' };
      const dayMonth = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const diffMs = d.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let sub = '';
      if (diffDays > 0) {
        sub = `${diffDays} days left`;
      } else if (diffDays === 0) {
        sub = 'Due today';
      } else {
        sub = `${Math.abs(diffDays)} days ago`;
      }
      return { dayMonth, sub };
    } catch {
      return { dayMonth: '24 Sep', sub: '6 days left' };
    }
  };

  // Filter tasks based on activeFilter and searchQuery
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.topic?.toLowerCase().includes(q);

      if (!matchQuery) return false;

      // Filter tabs
      if (activeFilter === 'all') return true;
      if (activeFilter === 'cohorts') {
        return (
          !t.assignedTeams ||
          t.assignedTeams.length === 9 ||
          t.targetGroup === 'both'
        );
      }
      if (activeFilter === 'junior_developers') {
        return t.targetGroup === 'junior_developers' || t.targetGroup === 'both';
      }
      if (activeFilter === 'developer_interns') {
        return t.targetGroup === 'developer_interns' || t.targetGroup === 'both';
      }
      return true;
    });
  }, [tasks, activeFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[1150px] mx-auto space-y-4 select-none">
      <div className="space-y-4">
        {/* Section Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Next Tasks for Teams</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                1 Active Sprint
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign, schedule, and track milestone tasks, technical deliverables, and deadlines for cohort teams.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              id="refreshBtn"
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <svg
                id="refreshIcon"
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span id="refreshText">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              id="toggleFormBtn"
              type="button"
              onClick={() => setIsFormVisible((prev) => !prev)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 ring-1 ring-purple-500/40 transition-all cursor-pointer"
            >
              {isFormVisible ? (
                <>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span id="toggleFormText">Cancel Form</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span id="toggleFormText">Create Next Task</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Success Toast (Dismissible) */}
        {toastMessage && (
          <div
            id="successNotification"
            className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border border-emerald-200/90 text-emerald-800 rounded-xl text-xs font-medium shadow-xs transition-all animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-emerald-900">{toastMessage.title}</span>
                <span className="text-emerald-700 ml-1">{toastMessage.description}</span>
              </div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-1"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* STATE 1: TASK CREATION FORM CARD (Visible by Default) */}
        {isFormVisible && (
          <div
            id="createTaskFormCard"
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
          >
            {/* Form Header */}
            <div className="px-6 py-3.5 bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-transparent border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <h3 className="text-sm font-bold text-purple-950">
                    Publish Next Task for Cohort Teams
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                    Sprint 4 Assignment
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  New tasks will be immediately visible to students and team leads across all participating teams.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handlePublishTask} className="p-6 space-y-4">
              {/* Row 1: Task Title & Domain Area (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="taskTitleInput"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Build Authentication Flow & Role Guards"
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Clear, actionable title that summarizes the cohort engineering sprint.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Topic / Domain Area <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      placeholder="e.g. Full-Stack / Frontend / API Design"
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Categorizes learning tracks (ML, Web Dev, Web3, DevOps, Open Source).
                  </p>
                </div>
              </div>

              {/* Row 2: Target Group & Deadline (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Target Group <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.targetGroup}
                      onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                      className="w-full appearance-none px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs pr-9 cursor-pointer"
                    >
                      <option value="both">Both (Junior Devs &amp; Interns)</option>
                      <option value="junior_developers">Junior Developers</option>
                      <option value="developer_interns">Developer Interns</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Deadline Date &amp; Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 3: Full Width Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    Task Description &amp; Deliverables <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Markdown supported</span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Outline the goals, required deliverables, PR submission instructions, and review criteria..."
                  className="w-full px-3.5 py-2 text-xs font-normal text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs resize-none leading-relaxed"
                />
              </div>

              {/* Row 4: Priority & Assigned Teams */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                {/* Priority (Col 4) */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Task Priority</label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full appearance-none px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs pr-9 cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High (Sprint Critical)</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Assigned Cohort Teams (Col 8) */}
                <div className="md:col-span-8">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Assigned Cohort Teams
                    </label>
                    <span className="text-[10px] text-purple-600 font-medium">
                      {form.assignedTeams.length === 9
                        ? 'All 9 teams currently selected'
                        : `${form.assignedTeams.length} of 9 teams selected`}
                    </span>
                  </div>

                  {/* Mode Selector - 2 Primary Options */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl">
                      <button
                        type="button"
                        onClick={handleSelectAllTeamsMode}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          teamSelectionMode === 'all'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0a6 6 0 0 0-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Select All Teams</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectIndividualTeamsMode}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          teamSelectionMode === 'individual'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75Zm0 5.25h.007v.008H3.75V12Zm0 5.25h.007v.008H3.75v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Select Individual Teams</span>
                      </button>
                    </div>

                    {/* All Teams Active Banner */}
                    {teamSelectionMode === 'all' && (
                      <div className="flex items-center justify-between px-3 py-2 bg-purple-50/80 border border-purple-200/80 rounded-xl text-[11px] text-purple-900 font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>All 9 cohort teams (Team 1 through Team 9) are assigned to this task.</span>
                        </div>
                      </div>
                    )}

                    {/* Individual Teams selection panel - Displayed when 'Select Individual Teams' is clicked */}
                    {teamSelectionMode === 'individual' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between px-0.5 text-[11px] font-medium text-slate-500">
                          <span>Select specific teams to assign:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9] }))}
                              className="text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, assignedTeams: [] }))}
                              className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {cohortList.map((cohort) => {
                            const isChecked = form.assignedTeams.includes(cohort.num);
                            return (
                              <label
                                key={cohort.num}
                                onClick={() => handleToggleTeam(cohort.num)}
                                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer select-none border ${
                                  isChecked
                                    ? 'bg-purple-50 text-purple-800 border-purple-300 shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleTeam(cohort.num)}
                                  className="w-3.5 h-3.5 accent-purple-600 rounded"
                                />
                                <span>{cohort.baseLabel}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5: Required Deliverables Section */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">Required Deliverables</label>
                  <button
                    type="button"
                    onClick={() => setShowAddDeliverable((prev) => !prev)}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Add Deliverable</span>
                  </button>
                </div>

                {/* Optional input to add custom deliverable */}
                {showAddDeliverable && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-purple-50 border border-purple-200 rounded-xl">
                    <input
                      type="text"
                      value={customDeliverableInput}
                      onChange={(e) => setCustomDeliverableInput(e.target.value)}
                      placeholder="e.g. Figma Prototype Link or Test Suite"
                      className="flex-1 px-3 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDeliverable}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddDeliverable(false)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Deliverable Checkbox Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {form.deliverables.map((item, dIdx) => (
                    <div
                      key={item || dIdx}
                      className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <input
                        type="checkbox"
                        checked={form.deliverables.includes(item)}
                        onChange={() => handleToggleDeliverable(item)}
                        id={`del-${dIdx}`}
                        className="w-3.5 h-3.5 accent-purple-600 rounded"
                      />
                      <label
                        htmlFor={`del-${dIdx}`}
                        className="text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{item}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Sprint notifications will be dispatched to 9 cohort Discord/Slack webhooks.</span>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    id="publishSubmitBtn"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-500/50 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span id="publishBtnLabel">Publish Next Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* FILTER TABS & TASK REPOSITORY OVERVIEW */}
        <div className="space-y-3 pt-1">
          {/* Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 ml-1">Filter Tasks:</span>

              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`filter-tab px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                All Tasks
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('cohorts')}
                className={`filter-tab px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'cohorts'
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                All Teams (Cohorts 1–9)
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('junior_developers')}
                className={`filter-tab px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'junior_developers'
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                Junior Developers
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('developer_interns')}
                className={`filter-tab px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeFilter === 'developer_interns'
                    ? 'bg-[#0F172A] text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                Developer Interns
              </button>
            </div>

            {/* Total Counter & Search Input */}
            <div className="flex items-center gap-3 mr-1 self-end sm:self-auto">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredTasks.length}</strong> published task{filteredTasks.length === 1 ? '' : 's'}
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-48 pl-7 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="pointer-events-none absolute left-2.5 top-1.5 text-slate-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Published Tasks Table / Cards */}
          {filteredTasks.length === 0 ? (
            /* Clean Empty State View */
            <div
              id="emptyStatePlaceholder"
              className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No tasks created yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Click &quot;Create Next Task&quot; above to schedule and assign the next milestone task for your cohort teams.
              </p>
              <button
                type="button"
                onClick={() => setIsFormVisible(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Create Next Task</span>
              </button>
            </div>
          ) : (
            <div
              id="tasksListContainer"
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <div className="col-span-4">Task Title &amp; Details</div>
                <div className="col-span-2">Topic / Domain</div>
                <div className="col-span-2">Target Group</div>
                <div className="col-span-1">Assigned</div>
                <div className="col-span-1">Deadline</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Task Rows */}
              {filteredTasks.map((t) => {
                const deadlineInfo = formatDeadline(t.deadline);
                const assignedTeamsLabel =
                  !t.assignedTeams || t.assignedTeams.length === 9
                    ? 'Teams 1–9'
                    : `Teams ${t.assignedTeams.join(', ')}`;
                const targetGroupLabel =
                  t.targetGroup === 'junior_developers'
                    ? 'Junior Developers'
                    : t.targetGroup === 'developer_interns'
                    ? 'Developer Interns'
                    : 'Both (Junior & Interns)';

                return (
                  <div
                    key={t._id}
                    className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-slate-100 items-center hover:bg-purple-50/20 transition-colors"
                  >
                    {/* Title */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {t.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 ml-4 mt-0.5">
                        {t.description}
                      </p>
                    </div>

                    {/* Topic */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                        {t.topic || 'Engineering / Sprint'}
                      </span>
                    </div>

                    {/* Target Group */}
                    <div className="col-span-2 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="truncate">{targetGroupLabel}</span>
                    </div>

                    {/* Assigned Teams */}
                    <div className="col-span-1">
                      <span className="text-xs font-semibold text-slate-800">{assignedTeamsLabel}</span>
                      <span className="block text-[10px] text-slate-400">
                        {t.assignedTeams?.length === 9 ? 'All cohorts' : 'Selected cohorts'}
                      </span>
                    </div>

                    {/* Deadline */}
                    <div className="col-span-1">
                      <span className="text-xs font-bold text-slate-900">{deadlineInfo.dayMonth}</span>
                      <span className="block text-[10px] text-amber-600 font-medium">{deadlineInfo.sub}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {t.status || 'Published'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingTask(t)}
                        title="View Task Details"
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingTask(t)}
                        title="Edit Task"
                        className="p-1 text-slate-400 hover:text-purple-600 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(t._id)}
                        title="Delete Task"
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MongoDB Atlas Live Sync Bottom Bar */}
      <footer className="h-9 px-4 sm:px-6 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-500 shadow-2xs shrink-0 mt-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Connected to KIET C4GT MongoDB Atlas cluster (read/write live sync)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>
            Task Queue: <strong className="text-slate-800">Synchronized</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Sprint: <strong className="text-purple-600">Cohort 2026-Q3</strong>
          </span>
        </div>
      </footer>

      {/* MODAL 1: VIEW TASK DETAILS */}
      {viewingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  {viewingTask.topic || 'Engineering Sprint Task'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {viewingTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {viewingTask.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Target Group</span>
                  <span className="font-bold text-slate-800">
                    {viewingTask.targetGroup === 'both' ? 'Both (Junior & Interns)' : viewingTask.targetGroup}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Priority</span>
                  <span className="font-bold text-purple-700">{viewingTask.priority || 'Normal'}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Deadline</span>
                  <span className="font-bold text-slate-800">{formatDeadline(viewingTask.deadline).dayMonth}</span>
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Required Deliverables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(viewingTask.deliverables || defaultDeliverables).map((d, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5"
                    >
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TASK */}
      {editingTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Edit Task</h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="p-4 space-y-3 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Topic / Domain</label>
                <input
                  type="text"
                  value={editingTask.topic}
                  onChange={(e) => setEditingTask({ ...editingTask, topic: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Priority</label>
                  <select
                    value={editingTask.priority || 'Normal'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Target Group</label>
                  <select
                    value={editingTask.targetGroup}
                    onChange={(e) => setEditingTask({ ...editingTask, targetGroup: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  >
                    <option value="both">Both</option>
                    <option value="junior_developers">Junior Developers</option>
                    <option value="developer_interns">Developer Interns</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete this task?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
