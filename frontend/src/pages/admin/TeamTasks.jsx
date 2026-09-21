import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  RefreshCw,
  Clock,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Search,
  Link as LinkIcon,
  FileText,
  FileCode,
} from 'lucide-react';
import { Skeleton, SkeletonTaskCard } from '../../components/skeleton';

export default function TeamTasks() {
  const { token, apiBaseUrl } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Temporary toast notification state (auto-disappears after 3.5 seconds)
  const [toastMessage, setToastMessage] = useState(null);

  // Available Resources from backend
  const [availableResources, setAvailableResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Resource Selection & Modal state
  const [selectedResources, setSelectedResources] = useState([]);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');

  // Quick Custom Resource Creation inside modal
  const [showAddNewResourceForm, setShowAddNewResourceForm] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('link');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDesc, setNewResourceDesc] = useState('');

  // Filter & Search states for published tasks
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [teamLeadsMap, setTeamLeadsMap] = useState({});

  const defaultDeliverables = [
    'Source Code Repo',
    'GitHub Pull Request',
    'Documentation / Spec',
    'Demo / Presentation',
  ];

  const initialForm = {
    title: '',
    topic: '',
    targetGroup: 'both',
    deadline: '',
    description: '',
    priority: 'Normal',
    assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    deliverables: [...defaultDeliverables],
  };

  const [form, setForm] = useState(initialForm);
  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Helper for temporary auto-disappearing toast notification (3.5s)
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await fetch(`${API_BASE_URL}/admin/resources`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.resources)) {
          setAvailableResources(data.resources);
        }
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoadingResources(false);
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
    fetchResources();
    fetchTeamsData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTasks(), fetchResources(), fetchTeamsData()]);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Toggle resource selection
  const handleToggleSelectResource = (resItem) => {
    setSelectedResources((prev) => {
      const exists = prev.some((r) => (r._id && r._id === resItem._id) || r.title === resItem.title);
      if (exists) {
        return prev.filter((r) => (r._id ? r._id !== resItem._id : r.title !== resItem.title));
      } else {
        return [...prev, resItem];
      }
    });
  };

  // Remove selected resource from form
  const handleRemoveSelectedResource = (resourceIdOrTitle) => {
    setSelectedResources((prev) =>
      prev.filter((r) => (r._id ? r._id !== resourceIdOrTitle : r.title !== resourceIdOrTitle))
    );
  };

  // Create & attach custom resource link on the fly
  const handleCreateAndAttachCustomResource = async () => {
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) {
      alert('Resource title and URL are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/resources`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: newResourceTitle,
          type: newResourceType,
          url: newResourceUrl,
          description: newResourceDesc,
          topic: form.topic || 'General',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.resource) {
        setAvailableResources((prev) => [data.resource, ...prev]);
        setSelectedResources((prev) => [...prev, data.resource]);
      } else {
        const fallbackRes = {
          _id: `res-${Date.now()}`,
          title: newResourceTitle,
          type: newResourceType,
          url: newResourceUrl,
          description: newResourceDesc,
        };
        setSelectedResources((prev) => [...prev, fallbackRes]);
      }

      // Reset custom resource form
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceDesc('');
      setShowAddNewResourceForm(false);
    } catch (err) {
      console.error('Resource creation error:', err);
      const fallbackRes = {
        _id: `res-${Date.now()}`,
        title: newResourceTitle,
        type: newResourceType,
        url: newResourceUrl,
        description: newResourceDesc,
      };
      setSelectedResources((prev) => [...prev, fallbackRes]);
      setNewResourceTitle('');
      setNewResourceUrl('');
      setNewResourceDesc('');
      setShowAddNewResourceForm(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...form,
        relatedResources: selectedResources.map((r) => r._id).filter(Boolean),
      };

      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        showToast('Task published successfully!', 'success');
        // Reset form
        setForm({
          title: '',
          topic: '',
          targetGroup: 'both',
          deadline: '',
          description: '',
          priority: 'Normal',
          assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          deliverables: [...defaultDeliverables],
        });
        setSelectedResources([]);
      } else {
        showToast('Unable to publish task. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Publish error:', err);
      showToast('Unable to publish task. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteTask = async (id) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // ONLY remove task from React state after successful HTTP response from backend
        setTasks((prev) => prev.filter((t) => t._id !== id));
        setDeleteConfirmId(null);
        showToast('Task deleted successfully.', 'success');
      } else {
        showToast(data.message || 'Unable to delete task. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Delete API error:', err);
      showToast('Unable to delete task. Please try again.', 'error');
    } finally {
      setDeletingId(null);
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

  const filteredAvailableResources = availableResources.filter((r) => {
    if (!resourceSearchQuery.trim()) return true;
    const q = resourceSearchQuery.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.topic && r.topic.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">
            Next Tasks for Teams
          </h2>
          <p className="text-xs text-[#66645E] mt-1">
            Create next milestone deliverables, set deadlines, attach related resources, and monitor completion.
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
          <div className="pb-4 border-b border-[#E0DDD0]">
            <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">
              Publish Next Team Task
            </h3>
            <p className="text-xs text-[#66645E] mt-0.5">
              Assign milestones to teams across active academic cohorts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Task Title & Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Task Title *</label>
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

            {/* Target Group, Deadline, Priority */}
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
                <label className="block font-medium text-[#1C1B1A] mb-1.5">Submission Deadline *</label>
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

            {/* Description & Acceptance Criteria */}
            <div>
              <label className="block font-medium text-[#1C1B1A] mb-1.5">
                Task Description & Acceptance Criteria *
              </label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detail task requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
              />
            </div>

            {/* RELATED RESOURCES SECTION */}
            <div className="pt-4 border-t border-[#E0DDD0] space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-[#1C1B1A] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#4E7A53]" />
                  <span>Related Resources</span>
                </h4>
                <p className="text-xs text-[#66645E] mt-0.5">
                  Add learning resources or reference links related to this task.
                </p>
              </div>

              {/* Selected resources compact cards */}
              {selectedResources.length > 0 ? (
                <div className="space-y-2">
                  {selectedResources.map((resItem) => (
                    <div
                      key={resItem._id || resItem.title}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E0DDD0] text-xs shadow-2xs hover:border-[#CDE0CB] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-[#3B6940] font-bold text-sm shrink-0">✓</span>
                        <div className="truncate">
                          <span className="font-bold text-[#1C1B1A]">{resItem.title}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#66645E]">
                            <span className="px-2 py-0.5 rounded-md bg-[#E3EFE1] text-[#2F5233] font-mono uppercase text-[10px] font-semibold border border-[#CDE0CB]">
                              {resItem.type || 'link'}
                            </span>
                            {resItem.url && (
                              <span className="truncate max-w-xs font-mono text-[#8C8A84]">{resItem.url}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedResource(resItem._id || resItem.title)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F9F8F3] border border-dashed border-[#E0DDD0] text-center text-xs text-[#8C8A84]">
                  No related resources attached yet. Click below to add reference guides, documentation, or links.
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsResourceModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#4E7A53]" />
                <span>+ Add Resource</span>
              </button>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-[#E0DDD0] flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-[#1C1B1A] hover:bg-black text-white font-medium cursor-pointer transition-all shadow-xs"
              >
                {submitting ? 'Publishing...' : 'Publish Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TASKS LIST CONTAINER */}
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">
                Published Team Tasks
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] rounded-full border border-[#E0DDD0]">
                {loading ? '...' : filteredTasks.length}
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

        {/* Tasks List */}
        <div className="divide-y divide-[#E2DDD0]">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonTaskCard key={idx} />
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#66645E]">
              No tasks found for this filter.
            </div>
          ) : (
            filteredTasks.map((t) => (
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

                    {/* Render attached related resources */}
                    {Array.isArray(t.relatedResources) && t.relatedResources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#E0DDD0]/60 space-y-1.5">
                        <div className="text-[11px] font-bold text-[#1C1B1A] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#4E7A53]" />
                          <span>Attached Related Resources ({t.relatedResources.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {t.relatedResources.map((res, idx) => (
                            <a
                              key={res._id || idx}
                              href={res.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E0DDD0] hover:border-[#4E7A53] text-[11px] text-[#1C1B1A] transition-colors"
                            >
                              <span className="px-1.5 py-0.2 rounded bg-[#E3EFE1] text-[#2F5233] font-mono text-[9px] font-bold uppercase">
                                {res.type || 'link'}
                              </span>
                              <span className="font-semibold">{res.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </span>
                    <span>Assigned to Teams 1–9</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RESOURCE SELECTION MODAL */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#E2DDD0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DDD0]">
              <div>
                <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">
                  Select Related Resources
                </h3>
                <p className="text-xs text-[#66645E]">Choose from existing resources or add a custom resource link.</p>
              </div>
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#66645E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={resourceSearchQuery}
                onChange={(e) => setResourceSearchQuery(e.target.value)}
                placeholder="Search resources by title or topic..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A]"
              />
            </div>

            {/* Resource List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 max-h-[280px]">
              {loadingResources ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-[#E0DDD0] bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-40 h-4" />
                      <Skeleton className="w-12 h-3.5 rounded" />
                    </div>
                    <Skeleton className="w-3/4 h-3" />
                  </div>
                ))
              ) : filteredAvailableResources.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8C8A84] bg-[#F9F8F3] rounded-xl border border-[#E0DDD0]">
                  No matching resources found.
                </div>
              ) : (
                filteredAvailableResources.map((resItem) => {
                  const isSelected = selectedResources.some(
                    (r) => (r._id && r._id === resItem._id) || r.title === resItem.title
                  );
                  return (
                    <div
                      key={resItem._id || resItem.title}
                      onClick={() => handleToggleSelectResource(resItem)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? 'bg-[#E3EFE1]/50 border-[#4E7A53] shadow-2xs'
                          : 'bg-white border-[#E0DDD0] hover:border-[#B5B0A2]'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1C1B1A] truncate">{resItem.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#EEECDF] text-[#4A4843]">
                            {resItem.type}
                          </span>
                        </div>
                        {resItem.description && (
                          <p className="text-[11px] text-[#66645E] line-clamp-1">{resItem.description}</p>
                        )}
                        <p className="text-[10px] font-mono text-[#8C8A84] truncate">{resItem.url}</p>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#4E7A53] text-white text-[10px] font-bold">
                            Selected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0DDD0] text-[#1C1B1A] text-[10px] font-semibold hover:bg-[#F2EFE6]">
                            + Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create Custom Resource Section */}
            <div className="pt-3 border-t border-[#E0DDD0] space-y-3">
              {!showAddNewResourceForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddNewResourceForm(true)}
                  className="text-xs text-[#4E7A53] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  + Create & Attach New Custom Resource
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F9F8F3] border border-[#E0DDD0] space-y-3 text-xs">
                  <div className="font-semibold text-[#1C1B1A]">Add New Resource</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Resource Title *"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white text-[#1C1B1A] text-xs"
                    />
                    <select
                      value={newResourceType}
                      onChange={(e) => setNewResourceType(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white text-[#1C1B1A] text-xs"
                    >
                      <option value="link">Link</option>
                      <option value="note">Note</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Resource URL / Link *"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white text-[#1C1B1A] text-xs font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={newResourceDesc}
                    onChange={(e) => setNewResourceDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white text-[#1C1B1A] text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNewResourceForm(false)}
                      className="px-3 py-1 rounded-lg border border-[#E0DDD0] bg-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAndAttachCustomResource}
                      className="px-4 py-1 rounded-lg bg-[#1C1B1A] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save & Attach
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Done Action */}
            <div className="pt-3 border-t border-[#E0DDD0] flex justify-end">
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="px-6 py-2 rounded-full bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold cursor-pointer"
              >
                Done ({selectedResources.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#E0DDD0] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">
              Delete Task?
            </h3>
            <p className="text-xs text-[#66645E] leading-relaxed">
              This will permanently delete this task and its associated assignments.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E0DDD0]">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deletingId === deleteConfirmId}
                className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                {deletingId === deleteConfirmId ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Task</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Temporary Auto-Disappearing Toast Notification (3.5 seconds) */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-8 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border z-50 animate-in fade-in slide-in-from-bottom duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 border-rose-800 text-white'
              : 'bg-[#1C1B1A] border-black/20 text-white'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-medium">{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
