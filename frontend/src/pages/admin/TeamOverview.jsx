import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import {
  Layers,
  Users,
  Award,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  ArrowRight,
  X,
  Search,
  UserPlus,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Mail,
  Phone,
  Edit2,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import { Skeleton, SkeletonCohortCard } from '../../components/skeleton';
import AddStudentModal from '../../components/AddStudentModal';

export default function TeamOverview() {
  const { token, apiBaseUrl } = useAuth();
  const [teams, setTeams] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'assigned' | 'pending'
  const [assigningId, setAssigningId] = useState(null);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [toast, setToast] = useState({
    message: 'C4GT HUB teams loaded from MongoDB Atlas.',
    type: 'success',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [editingProjects, setEditingProjects] = useState({});
  const [savingProjectId, setSavingProjectId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const teamsRes = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.success && Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams);
          // If modal open, update selected team
          if (viewingTeam) {
            const updatedView = teamsData.teams.find((t) => t._id === viewingTeam._id);
            if (updatedView) setViewingTeam(updatedView);
          }
        }
      }

      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          setEligibleUsers(usersData.users);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_BASE_URL]);

  const handleRefreshTeams = () => {
    setIsRefreshing(true);
    fetchData();
    showToast('Refreshed teams and members from MongoDB Atlas.');
  };

  const handleSaveProject = async (teamId, teamNumber) => {
    const currentTeam = teams.find((t) => t._id === teamId);
    const newProject =
      editingProjects[teamId] !== undefined
        ? editingProjects[teamId]
        : (currentTeam?.project || '');

    if (!newProject || !newProject.trim()) {
      showToast('Project name cannot be empty.', 'error');
      return;
    }

    try {
      setSavingProjectId(teamId);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ project: newProject.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.team) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId || t.teamNumber === teamNumber ? data.team : t))
        );
        if (viewingTeam && viewingTeam._id === teamId) {
          setViewingTeam(data.team);
        }
        showToast(`Team ${teamNumber} project saved in MongoDB Atlas.`, 'success');
      } else {
        showToast(data.message || 'Failed to update team project.', 'error');
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      showToast('Error updating team project in MongoDB Atlas.', 'error');
    } finally {
      setSavingProjectId(null);
    }
  };

  const handleAssignLead = async (teamId, teamNumber, userIdToAssign) => {
    try {
      setAssigningId(teamId);
      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: userIdToAssign || null }),
      });

      const data = await res.json();
      if (data.team) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId || t.teamNumber === teamNumber ? data.team : t))
        );
        if (viewingTeam && viewingTeam._id === teamId) {
          setViewingTeam(data.team);
        }
        showToast(`Team Lead ${userIdToAssign ? 'assigned' : 'removed'} for Team ${teamNumber}.`, 'success');
      } else {
        showToast(data.message || 'Failed to update team lead.', 'error');
      }
    } catch (err) {
      console.error('Failed to assign team lead:', err);
      showToast('Error assigning team lead.', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemoveMember = async (teamId, memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.team) {
        setTeams((prev) => prev.map((t) => (t._id === teamId ? data.team : t)));
        if (viewingTeam && viewingTeam._id === teamId) {
          setViewingTeam(data.team);
        }
        showToast(`${memberName} removed from team.`, 'success');
      } else {
        showToast(data.message || 'Failed to remove member.', 'error');
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      showToast('Error removing member.', 'error');
    }
  };

  const assignedCount = teams.filter((t) => Boolean(t.teamLeadId)).length;
  const pendingCount = teams.length - assignedCount;

  const displayedTeams = useMemo(() => {
    if (selectedFilter === 'assigned') return teams.filter((t) => Boolean(t.teamLeadId));
    if (selectedFilter === 'pending') return teams.filter((t) => !t.teamLeadId);
    return teams;
  }, [teams, selectedFilter]);

  const getSectionTitle = () => {
    if (selectedFilter === 'assigned') return 'Teams With Assigned Leads';
    if (selectedFilter === 'pending') return 'Teams Awaiting Lead Assignment';
    return 'Overview of C4GT HUB Teams (1 – 9)';
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border transition-all text-xs font-medium animate-in fade-in slide-in-from-bottom-5 ${toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-[#1C1B1A] text-white border-black/20'
            }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Heading & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">{getSectionTitle()}</h2>
          <p className="text-xs text-[#66645E] mt-1">
            Manage all 9 C4GT HUB teams. Every team has a strict capacity limit of <strong>9 members</strong>. Assign Team Leads so they can search users and build their roster.
          </p>
        </div>

        <button
          onClick={handleRefreshTeams}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Teams</span>
        </button>
      </div>

      {/* 3 Metric Cards for Filtering */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setSelectedFilter('all')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${selectedFilter === 'all'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'all' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              TOTAL TEAMS
            </span>
            <div className="text-3xl font-bold mt-1">
              {loading ? <Skeleton className="w-12 h-8" /> : (teams.length || 9)}
            </div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'all' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Teams 1 through 9 (Limit: 9/team)</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'all' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('assigned')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${selectedFilter === 'assigned'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'assigned' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              ASSIGNED LEADS
            </span>
            <div className="text-3xl font-bold mt-1">
              {loading ? <Skeleton className="w-12 h-8" /> : assignedCount}
            </div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'assigned' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Active Team Leads</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'assigned' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('pending')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${selectedFilter === 'pending'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'pending' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              PENDING LEADS
            </span>
            <div className="text-3xl font-bold mt-1">
              {loading ? <Skeleton className="w-12 h-8" /> : pendingCount}
            </div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'pending' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Requires Assignment</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'pending' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Teams Grid (9 Teams) or Empty State */}
      {displayedTeams.length === 0 && !loading ? (
        <div className="bg-[#FDFCF9] rounded-2xl p-10 border border-[#E0DDD0] text-center shadow-2xs space-y-4 max-w-xl mx-auto my-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mx-auto flex items-center justify-center">
            {selectedFilter === 'pending' ? (
              <UserCheck className="w-8 h-8 text-emerald-600" />
            ) : (
              <Award className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#1C1B1A]">
              {selectedFilter === 'pending'
                ? 'All Teams Have Active Leads!'
                : 'No Teams Found'}
            </h3>
            <p className="text-xs text-[#66645E] mt-1.5 max-w-md mx-auto leading-relaxed">
              {selectedFilter === 'pending'
                ? 'Every C4GT HUB team currently has a designated Team Lead assigned. There are 0 pending lead assignments.'
                : 'No teams match the selected filter criteria.'}
            </p>
          </div>
          <div>
            <button
              onClick={() => setSelectedFilter('all')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <span>View All 9 Teams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, idx) => (
              <SkeletonCohortCard key={idx} />
            ))
          ) : (
            displayedTeams.map((t) => {
              const membersCount = Array.isArray(t.members) ? t.members.length : 0;
              const totalCount = membersCount + (t.teamLeadId ? 1 : 0);
              const maxLimit = t.maxMembers || 9;
              const pct = Math.min(100, Math.round((totalCount / maxLimit) * 100));

              const isEditing = editingTeamId === t._id;

              return (
                <div
                  key={t._id}
                  className={`bg-[#FDFCF9] rounded-2xl p-6 border shadow-2xs space-y-4 flex flex-col justify-between transition-all ${isEditing
                      ? 'border-[#1C1B1A] ring-2 ring-[#1C1B1A]/10 shadow-md bg-white'
                      : 'border-[#E0DDD0] hover:shadow-md'
                    }`}
                >
                  <div>
                    {/* Header: Name, Edit Toggle & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#1C1B1A] text-white flex items-center justify-center text-xs font-bold font-mono">
                          {t.teamNumber}
                        </span>
                        <span className="text-xs font-mono font-bold uppercase text-[#1C1B1A]">{t.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProjects((prev) => ({
                                  ...prev,
                                  [t._id]: t.project || '',
                                }));
                                setEditingTeamId(null);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer shadow-2xs border bg-white text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Cancel editing (back to normal)"
                            >
                              <X className="w-2.5 h-2.5 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeamId(null)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer shadow-2xs border bg-[#1C1B1A] text-white border-[#1C1B1A] hover:bg-black"
                              title="Done editing team"
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Done</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjects((prev) => ({
                                ...prev,
                                [t._id]: t.project || '',
                              }));
                              setEditingTeamId(t._id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer shadow-2xs border bg-white text-[#66645E] hover:text-[#1C1B1A] hover:bg-[#F2EFE6] border-[#E0DDD0]"
                            title="Edit team project and lead"
                          >
                            <Edit2 className="w-2.5 h-2.5 text-[#66645E]" />
                            <span>Edit</span>
                          </button>
                        )}

                        {t.teamLeadId ? (
                          <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Lead Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Need Lead
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project / Responsibility Field */}
                    {isEditing ? (
                      <div className="mt-2.5 space-y-1.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 animate-in fade-in duration-150">
                        <label className="text-[10px] font-mono font-bold uppercase text-amber-900 flex items-center gap-1 tracking-wider">
                          <Edit2 className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                          <span>Assigned Project / Responsibility:</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={
                              editingProjects[t._id] !== undefined
                                ? editingProjects[t._id]
                                : (t.project || '')
                            }
                            onChange={(e) =>
                              setEditingProjects((prev) => ({
                                ...prev,
                                [t._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveProject(t._id, t.teamNumber);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingProjects((prev) => ({
                                  ...prev,
                                  [t._id]: t.project || '',
                                }));
                                setEditingTeamId(null);
                              }
                            }}
                            placeholder="e.g. C4GT HUB Learning & Performance Management System"
                            className="flex-1 w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#1C1B1A] bg-white text-[#1C1B1A] focus:outline-none focus:ring-2 focus:ring-[#1C1B1A]/20"
                          />
                          <button
                            type="button"
                            disabled={savingProjectId === t._id}
                            onClick={() => handleSaveProject(t._id, t.teamNumber)}
                            className="px-3 py-1.5 rounded-lg bg-[#1C1B1A] hover:bg-black text-white text-[11px] font-bold font-mono transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                            title="Save to MongoDB Atlas"
                          >
                            {savingProjectId === t._id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProjects((prev) => ({
                                ...prev,
                                [t._id]: t.project || '',
                              }));
                              setEditingTeamId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-[#D0CDBE] bg-white hover:bg-[#F2EFE6] text-[#66645E] hover:text-[#1C1B1A] text-[11px] font-bold font-mono transition-colors shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                            title="Cancel (Back to normal)"
                          >
                            <X className="w-3.5 h-3.5 text-[#66645E]" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs leading-snug">
                        <span className="text-[11px] font-mono font-bold text-[#8C8A84] uppercase tracking-wider mr-1.5">
                          Project:
                        </span>
                        <span className={`text-xs ${t.project ? 'font-semibold text-[#1C1B1A]' : 'italic text-[#8C8A84]'}`}>
                          {t.project || 'Project Not Assigned'}
                        </span>
                      </div>
                    )}

                    {/* Team Capacity Progress */}
                    <div className="mt-4 p-3 bg-white rounded-xl border border-[#E0DDD0]/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] font-mono text-[#66645E]">Team Capacity</span>
                        <span className="font-mono font-bold text-[#1C1B1A]">
                          {totalCount} / {maxLimit} Members
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#EFECE3] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${totalCount >= maxLimit ? 'bg-rose-500' : 'bg-[#1C1B1A]'
                            }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#88867E] mt-1">
                        <span>{t.teamLeadId ? '1 Lead' : '0 Lead'}</span>
                        <span>{membersCount} Members</span>
                      </div>
                    </div>

                    {/* Team Task & Sprint Progress (Live whole progress in admin side) */}
                    <div className="mt-3 p-3 bg-white rounded-xl border border-[#E0DDD0]/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono font-semibold text-[#66645E]">Team Sprint Progress</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {t.progressPercentage || 0}% Completed
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#EFECE3] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${t.progressPercentage || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#88867E] font-mono">
                        <span>{t.completedAssignments || 0} / {t.totalExpectedAssignments || 0} Assignments Done</span>
                        {t.submittedAssignments > 0 && (
                          <span className="text-blue-700 font-semibold">{t.submittedAssignments} Awaiting Review</span>
                        )}
                      </div>
                    </div>

                    {/* Team Lead Card */}
                    <div className="mt-3 p-3 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-[#66645E]">Designated Lead</span>
                        {t.teamLeadId && (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                            PROMOTED
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-[#1C1B1A] mt-1 truncate">
                        {t.teamLeadId?.name || 'No Lead Assigned Yet'}
                      </p>
                      {t.teamLeadId?.email ? (
                        <div className="space-y-0.5 mt-1">
                          <p className="text-[11px] text-[#66645E] font-mono truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                            <span className="truncate">{t.teamLeadId.email}</span>
                          </p>
                          {(t.teamLeadId.phone || t.teamLeadId.phoneNumber) && (
                            <p className="text-[11px] text-emerald-800 font-mono truncate flex items-center gap-1 font-medium">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{t.teamLeadId.phone || t.teamLeadId.phoneNumber}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 italic mt-0.5">Select a user below to assign as Lead</p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Assign Lead & View Roster */}
                  <div className="pt-3 border-t border-[#E0DDD0] space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono uppercase text-[#66645E] flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span className="font-bold text-[#1C1B1A]">Assign / Change Lead</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-[#88867E]" />
                              <span>Assign / Change Lead (Locked)</span>
                            </>
                          )}
                        </label>

                        {!isEditing && (
                          <span className="text-[9px] font-mono text-[#88867E]">
                            Click Edit to change
                          </span>
                        )}
                      </div>

                      <select
                        onChange={(e) => handleAssignLead(t._id, t.teamNumber, e.target.value)}
                        value={t.teamLeadId?._id || ''}
                        disabled={!isEditing || assigningId === t._id}
                        className={`w-full py-2 px-3 text-xs rounded-xl border transition-all ${isEditing
                            ? 'border-[#1C1B1A] bg-white text-[#1C1B1A] font-semibold ring-2 ring-[#1C1B1A]/10 cursor-pointer shadow-xs'
                            : 'border-[#EAE7DF] bg-[#F7F6F2] text-[#88867E] cursor-not-allowed opacity-80'
                          }`}
                      >
                        <option value="">-- No Lead (Unassigned) --</option>
                        {eligibleUsers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.email}) {u.role === 'admin' ? '[Admin]' : u.role === 'teamlead' ? '[Lead]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setViewingTeam(t)}
                      className="w-full py-2 px-3 text-xs rounded-xl bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#66645E]" />
                      <span>View Team Roster ({membersCount})</span>
                    </button>
                  </div>
                </div>
              );
            }))}
        </div>
      )}

      {/* Team Roster Details Modal */}
      {viewingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FDFCF9] border border-[#E0DDD0] rounded-2xl max-w-xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden min-w-0">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#E0DDD0] flex items-start sm:items-center justify-between gap-3 bg-white min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#1C1B1A] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    {viewingTeam.teamNumber}
                  </span>
                  <h3 className="tracking-tight text-lg sm:text-2xl font-bold text-[#1C1B1A] truncate">
                    {viewingTeam.name} Roster
                  </h3>
                </div>
                <p className="text-xs text-[#66645E] mt-1 break-words">
                  <span className="font-semibold text-[#1C1B1A]">Project:</span>{' '}
                  <span className={viewingTeam.project ? 'font-semibold text-[#1C1B1A]' : 'italic text-[#8C8A84]'}>
                    {viewingTeam.project || 'Project Not Assigned'}
                  </span>{' '}
                  • Limit: 9 Members Max
                </p>
              </div>
              <button
                onClick={() => setViewingTeam(null)}
                className="w-8 h-8 rounded-full bg-[#F2EFE6] hover:bg-[#E5E2D8] flex items-center justify-center text-[#1C1B1A] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scroll min-w-0">
              {/* Team Lead Card */}
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#66645E]">
                  Team Lead (1)
                </span>
                {viewingTeam.teamLeadId ? (
                  <div className="mt-2 p-3 sm:p-3.5 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0] flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <UserAvatar
                        user={viewingTeam.teamLeadId}
                        size="w-9 h-9 sm:w-10 sm:h-10"
                        rounded="rounded-full"
                        animate="always"
                        className="shadow-2xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1C1B1A] flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                          <span className="truncate max-w-full">{viewingTeam.teamLeadId.name}</span>
                          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                            LEAD
                          </span>
                        </div>
                        <div className="text-[11px] text-[#66645E] font-mono flex items-center gap-1.5 mt-0.5 min-w-0">
                          <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                          <a
                            href={`mailto:${viewingTeam.teamLeadId.email}`}
                            className="hover:underline truncate block min-w-0 max-w-full text-[11px]"
                            title={viewingTeam.teamLeadId.email}
                          >
                            {viewingTeam.teamLeadId.email}
                          </a>
                        </div>
                        {(viewingTeam.teamLeadId.phone || viewingTeam.teamLeadId.phoneNumber) && (
                          <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1.5 mt-0.5 min-w-0">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a
                              href={`tel:${viewingTeam.teamLeadId.phone || viewingTeam.teamLeadId.phoneNumber}`}
                              className="hover:underline font-semibold truncate block min-w-0 max-w-full text-[11px]"
                            >
                              {viewingTeam.teamLeadId.phone || viewingTeam.teamLeadId.phoneNumber}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3.5 sm:p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>No Team Lead assigned yet. Select a lead from the dropdown to assign.</span>
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#66645E]">
                    Team Members ({Array.isArray(viewingTeam.members) ? viewingTeam.members.length : 0} / 8 slots)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1C1B1A]">
                      Total: {(viewingTeam.members?.length || 0) + (viewingTeam.teamLeadId ? 1 : 0)} / 9
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(true)}
                      disabled={(viewingTeam.members?.length || 0) >= 8 || ((viewingTeam.members?.length || 0) + (viewingTeam.teamLeadId ? 1 : 0)) >= 9}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1C1B1A] text-white hover:bg-black transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={(viewingTeam.members?.length || 0) >= 8 ? 'Team Members full (8/8)' : 'Add Student Member'}
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Add Student</span>
                    </button>
                  </div>
                </div>

                {!viewingTeam.members || viewingTeam.members.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-[#D0CDBE] text-center bg-white">
                    <Users className="w-6 h-6 text-[#9E9C94] mx-auto mb-2" />
                    <p className="text-xs font-medium text-[#1C1B1A]">No team members joined yet</p>
                    <p className="text-[11px] text-[#66645E] mt-1">
                      Once the Team Lead is assigned, they can search across users in their portal and invite members to join!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 min-w-0">
                    {viewingTeam.members.map((m, idx) => (
                      <div
                        key={m._id || idx}
                        className="p-3 bg-white rounded-xl border border-[#E0DDD0] flex items-center justify-between hover:border-[#1C1B1A]/30 transition-colors gap-2 min-w-0"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFECE3] text-[#1C1B1A] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            {idx + 1}
                          </div>
                          <UserAvatar
                            user={m}
                            size="w-8 h-8"
                            rounded="rounded-full"
                            animate="always"
                            className="shadow-2xs shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#1C1B1A] truncate" title={m.name || 'Student Member'}>
                              {m.name || 'Student Member'}
                            </div>
                            <div className="text-[11px] text-[#66645E] font-mono flex items-center gap-1.5 mt-0.5 min-w-0">
                              <Mail className="w-3 h-3 text-[#88867E] shrink-0" />
                              <a
                                href={`mailto:${m.email}`}
                                className="hover:underline truncate block min-w-0 max-w-full text-[11px]"
                                title={m.email}
                              >
                                {m.email}
                              </a>
                            </div>
                            {(m.phone || m.phoneNumber) && (
                              <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1.5 mt-0.5 min-w-0">
                                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                <a
                                  href={`tel:${m.phone || m.phoneNumber}`}
                                  className="hover:underline font-semibold truncate block min-w-0 max-w-full text-[11px]"
                                >
                                  {m.phone || m.phoneNumber}
                                </a>
                              </div>
                            )}
                            {(m.branch || m.year || m.rollNumber) && (
                              <div className="text-[10px] text-[#88867E] mt-0.5 font-mono truncate">
                                {m.branch} • Year {m.year} {m.rollNumber ? `• ${m.rollNumber}` : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(viewingTeam._id, m._id, m.name)}
                          title="Remove member from team"
                          className="p-1.5 sm:p-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-[#F2EFE6] border-t border-[#E0DDD0] flex justify-end">
              <button
                onClick={() => setViewingTeam(null)}
                className="px-4 py-2 rounded-xl bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && viewingTeam && (
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          team={viewingTeam}
          endpoint={`${API_BASE_URL}/admin/teams/${viewingTeam._id}/members`}
          token={token}
          onStudentAdded={(updatedTeam, newMember) => {
            if (updatedTeam) {
              setTeams((prev) => prev.map((t) => (t._id === updatedTeam._id ? updatedTeam : t)));
              setViewingTeam(updatedTeam);
            }
            showToast(`${newMember?.name || 'Student'} successfully added to ${viewingTeam.name}!`, 'success');
          }}
        />
      )}
    </div>
  );
}

