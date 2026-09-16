import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
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
  ShieldCheck,
  Mail,
  GraduationCap,
  X,
  UserCheck,
} from 'lucide-react';
import C4GTLogo from '../../components/C4GTLogo';

export default function TeamLeadDashboard() {
  const { user, token, apiBaseUrl } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'search' | 'invitations'

  // Search users state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'available' | 'assigned'
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Invite modal / state
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteModalUser, setInviteModalUser] = useState(null);

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

  // Search Users across total registered users
  const fetchUsers = async () => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (filterType !== 'all') params.append('filter', filterType);

      const res = await fetch(`${API_BASE_URL}/teamlead/users?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setSearchResults(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, [user]);

  // Refetch search when tab is search or search query / filter changes
  useEffect(() => {
    if (activeTab === 'search') {
      const delay = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [activeTab, searchQuery, filterType]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyTeam();
    if (activeTab === 'search') fetchUsers();
    showToast('Refreshed team data from Atlas.');
  };

  // Send Invitation Handler
  const handleSendInvite = async () => {
    if (!inviteModalUser) return;
    try {
      setInvitingUserId(inviteModalUser._id);
      const res = await fetch(`${API_BASE_URL}/teamlead/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: inviteModalUser._id,
          message: inviteMessage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Invitation sent to ${inviteModalUser.name}!`, 'success');
        setInviteModalUser(null);
        setInviteMessage('');
        fetchMyTeam();
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to send invitation.', 'error');
      }
    } catch (err) {
      console.error('Invite error:', err);
      showToast('Failed to send invitation.', 'error');
    } finally {
      setInvitingUserId(null);
    }
  };

  // Cancel Invitation Handler
  const handleCancelInvite = async (invitationId, recipientName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teamlead/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Invitation to ${recipientName || 'user'} cancelled.`, 'success');
        fetchMyTeam();
        fetchUsers();
      } else {
        showToast(data.message || 'Failed to cancel invitation.', 'error');
      }
    } catch (err) {
      console.error('Cancel invite error:', err);
      showToast('Error cancelling invitation.', 'error');
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
        <h2 className="font-['Instrument_Serif',serif] text-3xl font-bold text-[#1C1B1A]">
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
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0DDD0]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-[#1C1B1A] text-white text-[10px] font-mono font-bold tracking-wider">
              TEAM LEAD PORTAL
            </span>
            <span className="text-xs text-[#66645E]">Cohort 2026 – 2027</span>
          </div>
          <h1 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl font-bold text-[#1C1B1A] tracking-tight">
            {team.name}: {team.track || 'Engineering Track'}
          </h1>
          <p className="text-xs text-[#66645E] mt-1">
            Build and manage your 9-member team roster. Search across total users, send join requests, and coordinate your members.
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
                Your team has reached the 9-member limit. To invite new members, you must remove an existing member first.
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
            <span>Pending Requests:</span>
            <span className="font-bold text-[#1C1B1A] font-mono">{pendingInvitations.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E0DDD0] pb-2">
        <button
          onClick={() => setActiveTab('roster')}
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
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Users & Add to Team</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
            activeTab === 'invitations'
              ? 'bg-[#1C1B1A] text-white shadow-xs'
              : 'bg-white hover:bg-[#F2EFE6] text-[#66645E] border border-[#E0DDD0]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Pending Invitations ({pendingInvitations.length})</span>
          {pendingInvitations.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: TEAM ROSTER ================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
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
                <div className="w-11 h-11 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs">
                  {team.teamLeadId?.name ? team.teamLeadId.name.slice(0, 2).toUpperCase() : 'TL'}
                </div>
                <div className="truncate">
                  <div className="font-bold text-sm text-[#1C1B1A] truncate">{team.teamLeadId?.name}</div>
                  <div className="text-xs text-[#66645E] font-mono truncate">{team.teamLeadId?.email}</div>
                  <div className="text-[10px] text-[#88867E] mt-0.5">
                    Lead Mentor / Senior Developer
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
                      <div className="w-10 h-10 rounded-full bg-[#EFECE3] text-[#1C1B1A] flex items-center justify-center font-bold text-xs font-mono">
                        {member.name ? member.name.slice(0, 2).toUpperCase() : 'M'}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-[#1C1B1A] truncate">{member.name}</div>
                        <div className="text-[11px] text-[#66645E] font-mono truncate">{member.email}</div>
                        {(member.branch || member.year) && (
                          <div className="text-[10px] text-[#88867E]">
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
                  Search across all registered students in the cohort and invite them to fill your {availableSlots} available slot{availableSlots === 1 ? '' : 's'}.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C1B1A] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Start Searching Users</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SEARCH USERS & ADD TO TEAM ================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                Search Users & Add to Your Team
              </h3>
              <p className="text-xs text-[#66645E] mt-0.5">
                Search total registered users by name, email, branch, or roll number. Invite members up to your 9-member limit.
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-[#1C1B1A] bg-[#F2EFE6] px-3.5 py-1.5 rounded-xl border border-[#E0DDD0]">
              Capacity: {totalCount} / {maxMembers} ({availableSlots} slot{availableSlots === 1 ? '' : 's'} remaining)
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, roll number, or branch..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#66645E] hover:text-[#1C1B1A]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl border border-[#E0DDD0] bg-white text-xs font-medium text-[#1C1B1A] shadow-2xs cursor-pointer"
              >
                <option value="all">All Users</option>
                <option value="available">Available (No Team)</option>
                <option value="assigned">Already in a Team</option>
              </select>

              <button
                onClick={fetchUsers}
                disabled={searching}
                className="px-4 py-2.5 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] border border-[#E0DDD0] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${searching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results List */}
          {searching ? (
            <div className="p-12 text-center text-xs text-[#66645E] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Searching total user database...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#D0CDBE] bg-[#FDFCF9]">
              <Users className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1C1B1A]">No users found matching your search</p>
              <p className="text-[11px] text-[#66645E] mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs space-y-3 flex flex-col justify-between hover:border-[#1C1B1A]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-full bg-[#EFECE3] text-[#1C1B1A] flex items-center justify-center font-bold text-xs font-mono">
                        {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>

                      {u.isPendingInvite ? (
                        <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Invite Pending
                        </span>
                      ) : u.inTeam ? (
                        <span className="text-[10px] font-mono font-semibold text-[#66645E] bg-[#F2EFE6] px-2 py-0.5 rounded-full">
                          In {u.teamName || 'Team'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <div className="text-xs font-bold text-[#1C1B1A] truncate">{u.name}</div>
                      <div className="text-[11px] text-[#66645E] font-mono truncate">{u.email}</div>
                      {(u.branch || u.year || u.rollNumber) && (
                        <div className="text-[10px] text-[#88867E] mt-1">
                          {u.branch || 'Eng'} {u.year ? `• Year ${u.year}` : ''} {u.rollNumber ? `• ${u.rollNumber}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0DDD0]">
                    {u.isPendingInvite ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-amber-700 font-medium">Invitation sent</span>
                        <button
                          onClick={() => handleCancelInvite(u.pendingInviteId, u.name)}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isFull ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed text-center"
                      >
                        Team Full (9/9 Limit)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setInviteModalUser(u);
                          setInviteMessage(`Hi ${u.name}, I would love for you to join ${team.name}!`);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Invite to Team</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SENT INVITATIONS ================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
              Sent Team Invitations
            </h3>
            <p className="text-xs text-[#66645E] mt-0.5">
              Users must accept your invitation in their Student Portal to officially join your team.
            </p>
          </div>

          {pendingInvitations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#D0CDBE] bg-[#FDFCF9]">
              <Send className="w-8 h-8 text-[#9E9C94] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1C1B1A]">No pending invitations</p>
              <p className="text-[11px] text-[#66645E] mt-1">
                Go to the "Search Users" tab to find and invite students to your team.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E0DDD0] overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2EFE6] border-b border-[#E0DDD0] text-[10px] font-mono uppercase text-[#66645E]">
                    <tr>
                      <th className="py-3 px-4">Invited User</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Date Sent</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DDD0]">
                    {pendingInvitations.map((inv) => {
                      const target = inv.invitedUserId;
                      return (
                        <tr key={inv._id} className="hover:bg-[#FDFCF9]">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1C1B1A]">{target?.name || 'Student'}</div>
                            <div className="text-[11px] text-[#66645E] font-mono">{target?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#66645E]">
                            {target?.branch || 'N/A'} {target?.year ? `• Year ${target.year}` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#66645E] font-mono">
                            {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pending Acceptance
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleCancelInvite(inv._id, target?.name)}
                              className="px-3 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer"
                            >
                              Cancel Invite
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Confirmation Modal */}
      {inviteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FDFCF9] border border-[#E0DDD0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DDD0]">
              <h4 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                Invite to {team.name}
              </h4>
              <button
                onClick={() => setInviteModalUser(null)}
                className="w-7 h-7 rounded-full bg-[#F2EFE6] flex items-center justify-center text-[#1C1B1A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#E0DDD0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C1B1A] text-white flex items-center justify-center font-bold text-xs">
                {inviteModalUser.name ? inviteModalUser.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#1C1B1A] truncate">{inviteModalUser.name}</div>
                <div className="text-[11px] text-[#66645E] font-mono truncate">{inviteModalUser.email}</div>
                {inviteModalUser.branch && (
                  <div className="text-[10px] text-[#88867E]">
                    {inviteModalUser.branch} {inviteModalUser.year ? `• Year ${inviteModalUser.year}` : ''}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-[#66645E] block mb-1">
                Personal Invitation Note (Optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                placeholder="Include a short welcome message..."
                className="w-full p-3 rounded-xl border border-[#E0DDD0] bg-white text-xs text-[#1C1B1A] focus:outline-hidden focus:border-[#1C1B1A]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInviteModalUser(null)}
                className="px-4 py-2 rounded-xl bg-[#F2EFE6] hover:bg-[#E5E2D8] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={invitingUserId === inviteModalUser._id}
                className="px-5 py-2 rounded-xl bg-[#1C1B1A] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {invitingUserId === inviteModalUser._id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
