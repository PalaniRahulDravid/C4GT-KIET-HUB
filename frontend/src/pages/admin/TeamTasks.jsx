import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

export default function TeamTasks() {
  const { token, apiBaseUrl } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetFilter, setTargetFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New task form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: '',
    targetGroup: 'both',
    deadline: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/admin/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.deadline) {
      setActionMessage({
        type: 'error',
        text: 'Title, description, and deadline are required.',
      });
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage(null);

      const res = await fetch(`${apiBaseUrl}/admin/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setTasks((prev) => [data.task, ...prev]);
        setActionMessage({
          type: 'success',
          text: 'Next task created and assigned successfully to teams.',
        });
        setForm({
          title: '',
          description: '',
          topic: '',
          targetGroup: 'both',
          deadline: '',
        });
        setIsCreating(false);
      } else {
        setActionMessage({
          type: 'error',
          text: data.message || 'Failed to create task.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'An error occurred while creating task.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this task?')) return;

    try {
      const res = await fetch(`${apiBaseUrl}/admin/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setActionMessage({
          type: 'success',
          text: 'Task removed successfully.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: 'Failed to delete task.',
      });
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (targetFilter === 'all') return true;
    return t.targetGroup === targetFilter;
  });

  const getTargetGroupBadge = (group) => {
    switch (group) {
      case 'junior_developers':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'developer_interns':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'both':
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getTargetGroupLabel = (group) => {
    switch (group) {
      case 'junior_developers':
        return 'Junior Developers';
      case 'developer_interns':
        return 'Developer Interns';
      case 'both':
      default:
        return 'All Cohort Teams';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Next Tasks for Teams</h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign, schedule, and track milestone tasks, technical deliverables, and deadlines for cohort teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={loading}
            className="cursor-pointer"
          >
            <svg className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreating((prev) => !prev)}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {isCreating ? 'Cancel Form' : 'Create Next Task'}
          </Button>
        </div>
      </div>

      {/* Action Message Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-gray-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Create Task Collapsible Card */}
      {isCreating && (
        <Card className="border-purple-200 shadow-md bg-white">
          <CardHeader className="pb-3 border-b border-purple-100">
            <CardTitle className="text-base text-purple-900">Publish Next Task for Cohort Teams</CardTitle>
            <CardDescription>
              New tasks will be immediately visible to students and team leads across all participating teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build Authentication Flow & Role Guards"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Topic / Domain Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack / Frontend / API Design"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Group *
                  </label>
                  <select
                    value={form.targetGroup}
                    onChange={(e) => setForm({ ...form, targetGroup: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="both">Both (Junior Devs & Interns)</option>
                    <option value="junior_developers">Junior Developers Only</option>
                    <option value="developer_interns">Developer Interns Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Deadline Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Task Description & Deliverables *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Outline the goals, required deliverables, PR submission instructions, and review criteria..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {submitting ? 'Publishing...' : 'Publish Task to Teams'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Target Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 mr-1">Filter Tasks:</span>
        {['all', 'both', 'junior_developers', 'developer_interns'].map((key) => {
          const labels = {
            all: 'All Tasks',
            both: 'All Teams',
            junior_developers: 'Junior Developers',
            developer_interns: 'Developer Interns',
          };
          return (
            <button
              key={key}
              onClick={() => setTargetFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                targetFilter === key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
          <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading team tasks from MongoDB Atlas...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-gray-300">
          <CardContent>
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">No tasks created yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Click &quot;Create Next Task&quot; above to schedule and assign the next milestone task for your cohort teams.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task._id} className="shadow-xs border-gray-200 hover:border-purple-200 transition-colors">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTargetGroupBadge(
                          task.targetGroup
                        )}`}
                      >
                        {getTargetGroupLabel(task.targetGroup)}
                      </span>

                      {task.topic && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {task.topic}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Deadline & Actions */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Deadline
                      </p>
                      <p className="text-xs font-bold text-purple-700">
                        {new Date(task.deadline).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>
                    Created by:{' '}
                    <strong className="text-gray-600 font-semibold">
                      {task.createdBy?.name || 'Administrator'}
                    </strong>
                  </span>
                  <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
