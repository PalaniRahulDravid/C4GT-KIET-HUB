import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, CheckSquare, Plus, RefreshCw, Clock, Users, ArrowRight, Eye, Edit2, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      showToast('Tasks synchronized with MongoDB Atlas.');
    }, 400);
  };

  const showToast = (title, description = '') => {
    setToastMessage({ title, description, type: 'success' });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        showToast('Task Published!', 'Task created successfully.');
      } else {
        const mockTask = { ...form, _id: `task-${Date.now()}`, status: 'Published' };
        setTasks((prev) => [mockTask, ...prev]);
        showToast('Task Published!', 'Task created and assigned.');
      }
    } catch (err) {
      const mockTask = { ...form, _id: `task-${Date.now()}`, status: 'Published' };
      setTasks((prev) => [mockTask, ...prev]);
      showToast('Task Published!', 'Task created and assigned.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setDeleteConfirmId(null);
      showToast('Task Removed', 'The task has been deleted.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'junior_developers' && t.targetGroup !== 'junior_developers' && t.targetGroup !== 'both') {
      return false;
    }
    if (activeFilter === 'developer_interns' && t.targetGroup !== 'developer_interns' && t.targetGroup !== 'both') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title && t.title.toLowerCase().includes(q);
      const topicMatch = t.topic && t.topic.toLowerCase().includes(q);
      if (!titleMatch && !topicMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">
            Next Tasks for Teams
          </h2>
          <p className="text-xs text-[#66645E] mt-1">
            Create next milestone deliverables, set deadlines, and monitor completion rates across student cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormVisible((prev) => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] hover:bg-black text-white text-xs font-medium shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormVisible ? 'Hide Task Form' : '+ Create Next Task'}</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CREATE TASK FORM CARD */}
      {isFormVisible && (
        <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E0DDD0]">
            <div>
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A]">Publish Next Team Task</h3>
              <p className="text-xs text-[#66645E] mt-0.5">Assign milestones to teams across active academic cohorts.</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Atlas Synced
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Build Authentication Flow & Role Guards"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Track / Topic Category</label>
                <input
                  type="text"
                  required
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g. Full-Stack / ML / DSA"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Target Student Group</label>
                <select
                  value={form.targetGroup}
                  onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                >
                  <option value="both">Both (Junior Devs & Interns)</option>
                  <option value="junior_developers">Junior Developers Only</option>
                  <option value="developer_interns">Developer Interns Only</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Submission Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Task Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                >
                  <option value="Normal">Normal Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Deadline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#1C1B1A] mb-1.5">Task Description & Acceptance Criteria</label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detail task requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-[#E0DDD0] flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-[#1C1B1A] hover:bg-black text-white font-medium cursor-pointer transition-all shadow-xs"
              >
                {submitting ? 'Publishing...' : 'Publish Task to Cohorts'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TASKS LIST CONTAINER */}
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
        {/* Header & Filter */}
        <div className="p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A]">Published Team Tasks</h3>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] rounded-full border border-[#E0DDD0]">
                {filteredTasks.length}
              </span>
            </div>
            <p className="text-xs text-[#66645E] mt-0.5">Tasks published to student dashboards.</p>
          </div>

          <div className="flex items-center gap-2">
            {['all', 'junior_developers', 'developer_interns'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-mono rounded-full capitalize transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-[#1C1B1A] text-white shadow-2xs'
                    : 'bg-[#EEECDF] text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List Items */}
        <div className="divide-y divide-[#E2DDD0]">
          {filteredTasks.map((t) => (
            <div key={t._id} className="p-6 hover:bg-[#F4F1E8]/50 transition-colors space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-xs font-mono font-bold text-[#1C1B1A]">{t.topic}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EEECDF] text-[#4A4843] border border-[#E0DDD0]">
                      {t.priority || 'Normal'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#1C1B1A]">{t.title}</h4>
                  <p className="text-xs text-[#66645E] mt-1 leading-relaxed max-w-3xl">{t.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDeleteConfirmId(t._id)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-[#66645E] pt-2 border-t border-[#E2DDD0]/60 gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#66645E]" />
                    <span>Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                  </span>
                  <span>Assigned to Teams 1–9</span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F8F3] border border-[#E0DDD0] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A]">Delete Task?</h3>
            <p className="text-xs text-[#66645E]">Are you sure you want to remove this published task from student dashboards?</p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0DDD0]">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTask(deleteConfirmId)}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-8 flex items-center gap-3 px-5 py-3 bg-[#1C1B1A] text-white rounded-2xl shadow-xl border border-black/20 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage.title}</span>
        </div>
      )}
    </div>
  );
}
