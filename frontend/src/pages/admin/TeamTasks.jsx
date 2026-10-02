import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
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
  ExternalLink,
  Eye,
  UserCheck,
  MessageSquare,
  Check,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Skeleton, SkeletonTaskCard } from '../../components/skeleton';

export default function TeamTasks() {
  const { token, apiBaseUrl } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Review Submissions Modal State
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'submitted', 'completed', 'revision_requested', 'pending'
  const [reviewLoadingStudentId, setReviewLoadingStudentId] = useState(null);
  const [reviewNotesMap, setReviewNotesMap] = useState({});

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

  // Pagination states (6 tasks per page as requested)
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 6;
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const SUBMISSIONS_PER_PAGE = 6;

  const defaultDeliverables = [];

  const suggestedDeliverables = [
    'Source Code Repo',
    'GitHub Pull Request',
    'Documentation / Spec',
    'Demo / Presentation',
    'Live Deployment Link',
  ];

  const initialForm = {
    title: '',
    topic: '',
    targetGroup: 'both',
    deadline: '',
    description: '',
    priority: 'Normal',
    assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    deliverables: [],
  };

  const [form, setForm] = useState(initialForm);
  const [deadlineDaysInput, setDeadlineDaysInput] = useState('');
  const [customDeliverableInput, setCustomDeliverableInput] = useState('');
  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Helper for temporary auto-disappearing toast notification (3.5s)
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('all');

  const fetchTasks = async (batchToQuery = selectedBatch) => {
    try {
      setLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const url = batchToQuery && batchToQuery !== 'all'
        ? `${API_BASE_URL}/admin/tasks?batch=${encodeURIComponent(batchToQuery)}`
        : `${API_BASE_URL}/admin/tasks`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          // Keep review modal data synchronized
          setSelectedTaskForReview((prev) => {
            if (!prev) return null;
            return data.tasks.find((t) => t._id === prev._id) || prev;
          });
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/batches`, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.batches)) {
          setBatches(data.batches);
          const active = data.batches.find((b) => b.status === 'Active Batch');
          if (active) {
            const defaultBatchId = active.id || active.year;
            setSelectedBatch(defaultBatchId);
            fetchTasks(defaultBatchId);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
    fetchTasks('all');
  };

  const handleAdminReview = async (taskId, studentId, action, reviewNotes = '') => {
    try {
      setReviewLoadingStudentId(studentId);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/tasks/${taskId}/review/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ action, reviewNotes }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          action === 'accept'
            ? 'Work approved and marked as completed! ✓'
            : 'Revision feedback sent to student.',
          'success'
        );
        fetchTasks();
      } else {
        showToast(data.message || 'Failed to review submission', 'error');
      }
    } catch (err) {
      console.error('Review submission error:', err);
      showToast('Network error while reviewing submission', 'error');
    } finally {
      setReviewLoadingStudentId(null);
    }
  };

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/resources`, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
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
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
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
    fetchBatches();
    fetchResources();
    fetchTeamsData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTasks(selectedBatch), fetchResources(), fetchTeamsData()]);
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
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/resources`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          title: newResourceTitle,
          type: newResourceType,
          url: newResourceUrl,
          description: newResourceDesc,
          topic: form.topic || 'General',
          visibility: 'library',
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

  const handleDaysInputChange = (daysVal) => {
    setDeadlineDaysInput(daysVal);
    if (daysVal === '' || isNaN(daysVal) || Number(daysVal) < 0) {
      return;
    }
    const days = parseInt(daysVal, 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newDeadline = `${year}-${month}-${day}T23:59`;
    setForm((prev) => ({ ...prev, deadline: newDeadline }));
  };

  const syncDaysFromDate = (dateStr) => {
    if (!dateStr) {
      setDeadlineDaysInput('');
      return;
    }
    const target = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetMidnight = new Date(target);
    targetMidnight.setHours(0, 0, 0, 0);
    const diffMs = targetMidnight.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      setDeadlineDaysInput(String(diffDays));
    } else {
      setDeadlineDaysInput('');
    }
  };

  // Helpers for deadline presets
  const getTodayDateTimeLocal = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00`;
  };

  const getFutureDateTimeLocal = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59`;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.deadline) {
      showToast('Please set a submission deadline', 'error');
      return;
    }
    const deadlineDate = new Date(form.deadline);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (deadlineDate < todayStart) {
      showToast('Deadline cannot be in the past. Please select today or an upcoming date.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const chosenBatch = form.batch || (selectedBatch !== 'all' ? selectedBatch : (batches[0]?.id || '2026-2027'));
      const payload = {
        ...form,
        batch: chosenBatch,
        relatedResources: selectedResources.map((r) => r._id).filter(Boolean),
      };

      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        fetchTasks(selectedBatch);
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
          deliverables: [],
        });
        setDeadlineDaysInput('');
        setCustomDeliverableInput('');
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
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    // Only display tasks created by Admin in Admin Task Management
    const creatorRole = t.createdBy?.role ? String(t.createdBy.role).toLowerCase().trim() : '';
    if (t.createdBy && creatorRole && creatorRole !== 'admin') {
      return false;
    }
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

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE) || 1;

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Adjust if out of bounds (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    return filteredTasks.slice(start, start + TASKS_PER_PAGE);
  }, [filteredTasks, currentPage]);

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
              Assign milestones to teams across active academic C4GT HUB batches.
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

            {/* Target Group, Deadline, Priority - Balanced Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5 truncate">Target Student Group</label>
                <select
                  value={form.targetGroup}
                  onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                  className="w-full h-[42px] px-3 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none text-xs font-medium"
                >
                  <option value="both">Both (Junior & Interns)</option>
                  <option value="junior_developers">Junior Devs Only</option>
                  <option value="developer_interns">Interns Only</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-medium text-[#1C1B1A]">Submission Deadline *</label>
                  <span className="text-[11px] text-[#88867E]">Pick date or type days</span>
                </div>
                {/* Unified, attractive input container without awkward wide gaps */}
                <div className="flex items-center rounded-xl border border-[#E0DDD0] bg-white hover:border-[#C8C5B9] focus-within:border-[#1C1B1A] focus-within:ring-1 focus-within:ring-[#1C1B1A] transition-all p-1 h-[42px]">
                  <input
                    type="datetime-local"
                    required
                    min={getTodayDateTimeLocal()}
                    value={form.deadline}
                    onChange={(e) => {
                      setForm({ ...form, deadline: e.target.value });
                      syncDaysFromDate(e.target.value);
                    }}
                    className="flex-1 min-w-0 px-2 text-xs font-medium text-[#1C1B1A] bg-transparent focus:outline-none cursor-pointer"
                  />
                  <div className="h-5 w-[1px] bg-[#E8E5DC] mx-1 shrink-0" />
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F5F3EC] rounded-lg text-xs shrink-0">
                    <span className="text-[11px] font-medium text-[#7C7A72]">In</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3"
                      value={deadlineDaysInput}
                      onChange={(e) => handleDaysInputChange(e.target.value)}
                      className="w-12 h-6 text-center font-bold text-xs rounded bg-white border border-[#D5D1C6] text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A]"
                      title="Enter days from today"
                    />
                    <span className="text-[11px] font-medium text-[#7C7A72]">days</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1.5 truncate">Task Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-[42px] px-3 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none text-xs font-medium"
                >
                  <option value="Normal">Normal Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent</option>
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

            {/* REQUIRED DELIVERABLES SECTION */}
            <div className="pt-4 border-t border-[#E0DDD0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-sm text-[#1C1B1A] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4E7A53]" />
                    <span>Required Student Deliverables</span>
                  </label>
                  <p className="text-xs text-[#66645E] mt-0.5">
                    Select or add specific proof links required for submission. If none are selected, students will not be asked for proof links.
                  </p>
                </div>
                {form.deliverables.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deliverables: [] })}
                    className="text-xs text-[#9E3B3B] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Selected Deliverables */}
              {form.deliverables.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white border border-[#E0DDD0]">
                  {form.deliverables.map((d, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E3EFE1] text-[#2F5233] text-xs font-semibold border border-[#CDE0CB] shadow-2xs"
                    >
                      <span>📄 {d}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            deliverables: form.deliverables.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-[#4E7A53] hover:text-[#9E3B3B] cursor-pointer"
                        title="Remove deliverable"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#F7F6F1] border border-[#E0DDD0] text-xs text-[#66645E]">
                  <em>No deliverables selected. Students will not be prompted for proof links or remarks by default.</em>
                </div>
              )}

              {/* Suggested Quick-Add Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#66645E] uppercase tracking-wider">
                  Quick Add Suggested:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedDeliverables.map((sug) => {
                    const isSelected = form.deliverables.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setForm({
                              ...form,
                              deliverables: form.deliverables.filter((item) => item !== sug),
                            });
                          } else {
                            setForm({
                              ...form,
                              deliverables: [...form.deliverables, sug],
                            });
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1B1A] text-white border-[#1C1B1A] font-medium'
                            : 'bg-white text-[#4D4B46] border-[#E0DDD0] hover:border-[#1C1B1A]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Deliverable Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDeliverableInput}
                  onChange={(e) => setCustomDeliverableInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customDeliverableInput.trim();
                      if (val && !form.deliverables.includes(val)) {
                        setForm({ ...form, deliverables: [...form.deliverables, val] });
                        setCustomDeliverableInput('');
                      }
                    }
                  }}
                  placeholder="Or type custom deliverable (e.g. Design Figma Link)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customDeliverableInput.trim();
                    if (val && !form.deliverables.includes(val)) {
                      setForm({ ...form, deliverables: [...form.deliverables, val] });
                      setCustomDeliverableInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#E3EFE1] hover:bg-[#D5E8D2] text-[#2F5233] text-xs font-semibold border border-[#CDE0CB] cursor-pointer transition-colors"
                >
                  + Add Deliverable
                </button>
              </div>
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

          <div className="flex flex-wrap items-center gap-3">
            {batches.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8C887B] font-mono">Batch:</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    const newBatch = e.target.value;
                    setSelectedBatch(newBatch);
                    setCurrentPage(1);
                    fetchTasks(newBatch);
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-medium rounded-full bg-white border border-[#E0DDD0] text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A] cursor-pointer"
                >
                  <option value="all">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id || b._id} value={b.id || b.year}>
                      {b.year || b.name || b.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
            paginatedTasks.map((t) => (
              <div key={t._id} className="p-6 hover:bg-[#F4F1E8]/50 transition-colors space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1C1B1A]">{t.topic}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EEECDF] text-[#4A4843] border border-[#E0DDD0]">
                        {t.priority || 'Normal'}
                      </span>
                      {/* Target Group Badge */}
                      {t.targetGroup === 'junior_developers' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                          Junior Developers Only
                        </span>
                      )}
                      {t.targetGroup === 'developer_interns' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Developer Interns Only
                        </span>
                      )}
                      {(t.targetGroup === 'both' || !t.targetGroup || t.targetGroup === 'all') && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Both Junior Devs & Interns
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        <span>Admin Task</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#1C1B1A]">{t.title}</h4>
                    <p className="text-xs text-[#66645E] mt-1 leading-relaxed max-w-3xl">{t.description}</p>

                    {/* Deliverables Required */}
                    {Array.isArray(t.deliverables) && t.deliverables.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium text-[#8C8A84]">Deliverables:</span>
                        {t.deliverables.map((deliv, dIdx) => (
                          <span
                            key={dIdx}
                            className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#EEECDF] text-[#4A4843] border border-[#E0DDD0]"
                          >
                            {typeof deliv === 'string' ? deliv : deliv.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Render attached related resources */}
                    {Array.isArray(t.relatedResources) && t.relatedResources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#E0DDD0]/60 space-y-1.5">
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

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedTaskForReview(t);
                        setReviewFilter('all');
                        setReviewCurrentPage(1);
                        if (!t.assignments || t.assignments.length === 0) {
                          fetchTasks();
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs ${
                        t.submittedCount > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                          : 'bg-[#1C1B1A] hover:bg-black text-white'
                      }`}
                      title="Review student deliverables"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Submissions ({t.submittedCount || 0})</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(t._id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-[#66645E] pt-2.5 border-t border-[#E2DDD0]/60 gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#66645E]" />
                      <span>Deadline: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </span>
                    <span className="font-mono text-[#8C8A84]">
                      Assigned: {t.totalAssignments || 0} students
                    </span>
                    <span className="font-mono text-amber-700 font-semibold">
                      Under Review: {t.submittedCount || 0}
                    </span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      Approved: {t.completedCount || 0}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {filteredTasks.length > TASKS_PER_PAGE && (
          <div className="p-4 sm:p-5 border-t border-[#E2DDD0] bg-[#FDFCF9] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#66645E] font-medium">
              Showing <span className="font-bold text-[#1C1B1A]">{(currentPage - 1) * TASKS_PER_PAGE + 1}</span> to{' '}
              <span className="font-bold text-[#1C1B1A]">{Math.min(currentPage * TASKS_PER_PAGE, filteredTasks.length)}</span> of{' '}
              <span className="font-bold text-[#1C1B1A]">{filteredTasks.length}</span> tasks
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    totalPages > 7 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="px-1 text-xs text-[#8C8A84]">…</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#1C1B1A] text-white shadow-2xs font-bold'
                          : 'bg-white border border-[#E0DDD0] text-[#4D4B46] hover:bg-[#F2EFE6]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                aria-label="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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


      {/* REVIEW SUBMISSIONS MODAL */}
      {selectedTaskForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FFFDF8] border border-[#E0DDD0] rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E0DDD0] gap-2 shrink-0">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#1C1B1A]">
                    {selectedTaskForReview.topic}
                  </span>
                  {selectedTaskForReview.targetGroup === 'junior_developers' && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      Junior Developers Only
                    </span>
                  )}
                  {selectedTaskForReview.targetGroup === 'developer_interns' && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      Developer Interns Only
                    </span>
                  )}
                  {(selectedTaskForReview.targetGroup === 'both' || !selectedTaskForReview.targetGroup || selectedTaskForReview.targetGroup === 'all') && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Both Junior Devs & Interns
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    <span>Admin Review Only</span>
                  </span>
                </div>
                <h3 className="font-bold tracking-tight text-base sm:text-xl text-[#1C1B1A] break-words leading-snug">
                  Review Submissions: {selectedTaskForReview.title}
                </h3>
                <p className="text-xs text-[#66645E] line-clamp-1 sm:line-clamp-none">
                  Inspect student deliverables (proof links & documentation) and approve or request revisions.
                </p>
              </div>

              <button
                onClick={() => setSelectedTaskForReview(null)}
                className="p-1.5 -mr-1 -mt-1 rounded-full hover:bg-black/5 text-[#66645E] cursor-pointer shrink-0"
                aria-label="Close review modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            {(() => {
              const liveTask = tasks.find((t) => t._id === selectedTaskForReview._id) || selectedTaskForReview;
              const rawAssignments = liveTask.assignments || selectedTaskForReview.assignments || [];
              const taskTargetGroup = liveTask.targetGroup || selectedTaskForReview.targetGroup;

              // Strictly exclude students whose current memberType does not match the task targetGroup (e.g. promoted senior devs from junior tasks)
              const allAssignments = rawAssignments.filter((a) => {
                const s = a.studentId;
                if (!s) return false;
                const mType = s.memberType || '';
                if (!taskTargetGroup || taskTargetGroup === 'both' || taskTargetGroup === 'all') return true;
                if (taskTargetGroup === 'junior_developers') return mType === 'junior_developer';
                if (taskTargetGroup === 'developer_interns' || taskTargetGroup === 'senior_developers') {
                  return mType === 'senior_developer' || mType === 'developer_intern';
                }
                return true;
              });

              const submittedList = allAssignments.filter((a) => a.status === 'submitted');
              const completedList = allAssignments.filter((a) => a.status === 'completed');
              const revisionList = allAssignments.filter((a) => a.status === 'revision_requested');
              const pendingList = allAssignments.filter((a) => a.status === 'pending' || a.status === 'in_progress');

              let displayedAssignments = allAssignments;
              if (reviewFilter === 'submitted') displayedAssignments = submittedList;
              else if (reviewFilter === 'completed') displayedAssignments = completedList;
              else if (reviewFilter === 'revision_requested') displayedAssignments = revisionList;
              else if (reviewFilter === 'pending') displayedAssignments = pendingList;

              const reviewTotalPages = Math.ceil(displayedAssignments.length / SUBMISSIONS_PER_PAGE) || 1;
              const paginatedAssignments = displayedAssignments.slice(
                (reviewCurrentPage - 1) * SUBMISSIONS_PER_PAGE,
                reviewCurrentPage * SUBMISSIONS_PER_PAGE
              );

              return (
                <>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 -mx-1 px-1">
                    {[
                      { id: 'all', label: `All (${allAssignments.length})` },
                      { id: 'submitted', label: `Pending Review (${submittedList.length})`, highlight: submittedList.length > 0 },
                      { id: 'completed', label: `Approved (${completedList.length})` },
                      { id: 'revision_requested', label: `Revision Requested (${revisionList.length})` },
                      { id: 'pending', label: `Not Submitted (${pendingList.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setReviewFilter(tab.id);
                          setReviewCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          reviewFilter === tab.id
                            ? 'bg-[#1C1B1A] text-white shadow-2xs font-bold'
                            : tab.highlight
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold hover:bg-amber-200'
                            : 'bg-[#EEECDF] text-[#66645E] hover:text-[#1C1B1A]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Submissions List Container */}
                  <div className="overflow-y-auto flex-1 min-h-0 pr-1 space-y-3.5 custom-scroll">
                    {displayedAssignments.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#8C8A84] bg-[#F9F8F3] rounded-xl border border-[#E0DDD0]">
                        No students found in this category.
                      </div>
                    ) : (
                      paginatedAssignments.map((a) => {
                        const student = a.studentId || {};
                        const sId = student._id || a.studentId;
                        const isReviewing = reviewLoadingStudentId === sId;
                        const hasSubmissions = Array.isArray(a.submissions) && a.submissions.length > 0;
                        const notesVal = reviewNotesMap[sId] !== undefined ? reviewNotesMap[sId] : (a.reviewNotes || '');

                        return (
                          <div
                            key={a._id || sId}
                            className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-3 ${
                              a.status === 'submitted'
                                ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                                : a.status === 'completed'
                                ? 'bg-emerald-50/30 border-emerald-200'
                                : 'bg-white border-[#E0DDD0]'
                            }`}
                          >
                            {/* Student Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <UserAvatar
                                  user={student}
                                  size="w-9 h-9"
                                  rounded="rounded-full"
                                  animate="always"
                                  className="shrink-0 mt-0.5 sm:mt-0 shadow-2xs"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-sm text-[#1C1B1A] break-words">
                                      {student.name || 'Unknown Student'}
                                    </span>
                                    {student.rollNumber && (
                                      <span className="font-mono text-[11px] text-[#66645E]">
                                        ({student.rollNumber})
                                      </span>
                                    )}
                                    {a.teamNumber && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EEECDF] text-[#1C1B1A] shrink-0">
                                        Team {a.teamNumber}
                                      </span>
                                    )}
                                    {student.memberType && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 shrink-0">
                                        {student.memberType.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#8C8A84] font-mono mt-0.5 break-all truncate">
                                    {student.email || 'No email provided'}
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="self-start sm:self-auto shrink-0">
                                {a.status === 'submitted' && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                                    <span>Submitted - Needs Review</span>
                                  </span>
                                )}
                                {a.status === 'completed' && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Approved / Completed</span>
                                  </span>
                                )}
                                {a.status === 'revision_requested' && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                                    <span>Revision Requested</span>
                                  </span>
                                )}
                                {a.status === 'in_progress' && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-100 text-blue-900 border border-blue-300">
                                    In Progress
                                  </span>
                                )}
                                {a.status === 'pending' && (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#EEECDF] text-[#66645E]">
                                    Not Started
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Submitted Deliverables & Proofs */}
                            {hasSubmissions ? (
                              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-[#E0DDD0] space-y-2 text-xs">
                                <div className="font-bold text-[#1C1B1A] flex flex-wrap items-center justify-between gap-1">
                                  <span className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#4E7A53] shrink-0" />
                                    <span>Submitted Proofs & Deliverables ({a.submissions.length})</span>
                                  </span>
                                  {a.submittedAt && (
                                    <span className="font-mono text-[10px] text-[#8C8A84]">
                                      Submitted: {new Date(a.submittedAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {a.submissions.map((sub, sIdx) => {
                                    const linkTarget = sub.link || sub.fileUrl || '';
                                    return (
                                      <div
                                        key={sIdx}
                                        className="p-2.5 rounded-lg bg-[#F9F8F3] border border-[#E0DDD0] flex items-center justify-between gap-2 min-w-0"
                                      >
                                        <div className="min-w-0 flex-1 pr-1">
                                          <div className="font-semibold text-[#1C1B1A] truncate text-[11px]">
                                            {sub.deliverableName}
                                          </div>
                                          {linkTarget ? (
                                            <a
                                              href={linkTarget}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[10px] font-mono text-blue-600 hover:underline truncate block"
                                            >
                                              {linkTarget}
                                            </a>
                                          ) : (
                                            <span className="text-[10px] text-[#8C8A84] italic">No link provided</span>
                                          )}
                                        </div>
                                        {linkTarget && (
                                          <a
                                            href={linkTarget}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 rounded bg-white hover:bg-[#EEECDF] border border-[#E0DDD0] text-[10px] font-bold text-[#1C1B1A] flex items-center gap-1 shrink-0 transition-colors"
                                          >
                                            <ExternalLink className="w-3 h-3 text-[#4E7A53]" />
                                            <span>Open Proof</span>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {a.submissionNotes && (
                                  <div className="pt-2 border-t border-[#E0DDD0]/60">
                                    <span className="font-semibold text-[11px] text-[#1C1B1A]">Student Notes: </span>
                                    <span className="text-[11px] text-[#66645E] italic">"{a.submissionNotes}"</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-[#F9F8F3] border border-dashed border-[#E0DDD0] text-center text-xs text-[#8C8A84]">
                                Student has not submitted deliverables yet.
                              </div>
                            )}

                            {/* Review History */}
                            {a.reviewedAt && a.reviewedBy && (
                              <div className="text-[11px] font-mono text-[#66645E] bg-[#EEECDF]/60 p-2 rounded-lg flex items-center justify-between">
                                <span>
                                  Reviewed by Admin ({a.reviewedBy.name || 'Admin'}) on {new Date(a.reviewedAt).toLocaleDateString()}
                                </span>
                                {a.reviewNotes && (
                                  <span className="italic font-sans text-[11px] text-[#1C1B1A]">"{a.reviewNotes}"</span>
                                )}
                              </div>
                            )}

                            {/* Admin Review Action Controls */}
                            {a.status === 'completed' ? (
                              <div className="pt-2 border-t border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                    <span>Approved & Completed (Finalized)</span>
                                  </span>
                                  {a.completedAt && (
                                    <span className="text-[11px] font-mono text-[#8C8A84]">
                                      Approved on {new Date(a.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-[#8C8A84] italic">
                                  Approval is final and cannot be undone.
                                </span>
                              </div>
                            ) : (hasSubmissions || a.status === 'submitted' || a.status === 'revision_requested') ? (
                              <div className="pt-2 border-t border-[#E0DDD0] space-y-2">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <input
                                    type="text"
                                    value={notesVal}
                                    onChange={(e) =>
                                      setReviewNotesMap((prev) => ({
                                        ...prev,
                                        [sId]: e.target.value,
                                      }))
                                    }
                                    placeholder="Optional feedback / revision notes for student..."
                                    className="flex-1 w-full px-3 py-1.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-none focus:border-[#1C1B1A]"
                                  />

                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={isReviewing}
                                      onClick={() =>
                                        handleAdminReview(
                                          selectedTaskForReview._id,
                                          sId,
                                          'accept',
                                          notesVal
                                        )
                                      }
                                      className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-[#4E7A53] hover:bg-[#3D6341] text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>{isReviewing ? 'Saving...' : 'Approve & Mark Done'}</span>
                                    </button>

                                    <button
                                      disabled={isReviewing}
                                      onClick={() =>
                                        handleAdminReview(
                                          selectedTaskForReview._id,
                                          sId,
                                          'request_revision',
                                          notesVal
                                        )
                                      }
                                      className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold cursor-pointer transition-all shrink-0 disabled:opacity-50 text-center"
                                    >
                                      <span>Request Revision</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Review Submissions Pagination Bar */}
                  {displayedAssignments.length > SUBMISSIONS_PER_PAGE && (
                    <div className="pt-2.5 px-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E0DDD0]/60 shrink-0 text-xs">
                      <div className="text-[11px] text-[#66645E]">
                        Showing <span className="font-bold text-[#1C1B1A]">{(reviewCurrentPage - 1) * SUBMISSIONS_PER_PAGE + 1}</span> -{' '}
                        <span className="font-bold text-[#1C1B1A]">{Math.min(reviewCurrentPage * SUBMISSIONS_PER_PAGE, displayedAssignments.length)}</span> of{' '}
                        <span className="font-bold text-[#1C1B1A]">{displayedAssignments.length}</span> students
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={reviewCurrentPage === 1}
                          onClick={() => setReviewCurrentPage((p) => Math.max(p - 1, 1))}
                          className="px-2.5 py-1 rounded-md border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-[11px] font-medium disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-mono text-[11px] text-[#1C1B1A] font-bold">
                          {reviewCurrentPage} / {reviewTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={reviewCurrentPage === reviewTotalPages}
                          onClick={() => setReviewCurrentPage((p) => Math.min(p + 1, reviewTotalPages))}
                          className="px-2.5 py-1 rounded-md border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-[11px] font-medium disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Footer */}
            <div className="pt-2.5 sm:pt-3 border-t border-[#E0DDD0] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs text-[#66645E] shrink-0">
              <span className="text-[11px] sm:text-xs">
                Changes are dispatched immediately to student dashboards and notifications.
              </span>
              <button
                onClick={() => setSelectedTaskForReview(null)}
                className="w-full sm:w-auto px-6 py-2 rounded-xl sm:rounded-full bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold cursor-pointer text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
