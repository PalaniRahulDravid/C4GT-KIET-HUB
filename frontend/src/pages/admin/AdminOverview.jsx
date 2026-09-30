import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Users, GraduationCap, Award, Layers, CheckSquare, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../components/skeleton';
import UserAvatar from '../../components/UserAvatar';

export default function AdminOverview() {
  const { user: currentUser, token, apiBaseUrl } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teamLeads: 0,
    admins: 0,
    teamsCount: 0,
    tasksCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchOverviewData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('c4gt_token') : null);
      const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats);
        }
      }

      // Fetch users
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          setRecentUsers(usersData.users.slice(0, 5));
        } else {
          setRecentUsers([]);
        }
      } else {
        setRecentUsers([]);
      }
    } catch (err) {
      console.error('Failed to load overview data from Atlas:', err);
      setRecentUsers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '09/08/2026';
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return '09/08/2026';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'teamlead':
      case 'team_lead':
        return 'Team Lead';
      case 'user':
      case 'student':
      default:
        return 'Student';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[#1C1B1A] text-white border border-black/10';
      case 'teamlead':
      case 'team_lead':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'user':
      case 'student':
      default:
        return 'bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0]';
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. WELCOME HERO CARD */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#EBF3EA]/60 via-[#F8F6F0] to-[#FCEEE9]/50 border border-[#E0DDD0] p-5 sm:p-8 text-[#1C1B1A] overflow-hidden shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-[680px] space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-black/10 text-[11px] font-mono font-semibold tracking-wider uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]"></span>
            Administration Workspace
          </div>
          <h2 className="font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1C1B1A]">
            Welcome to C4GT Hub Administration
          </h2>
          <p className="text-[#66645E] text-sm leading-relaxed">
            Manage your C4GT HUB members, assign team leads, monitor student project teams, and publish upcoming tasks from one centralized workspace.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => fetchOverviewData(true)}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E0DDD0] hover:bg-[#F2EFE6] text-[#1C1B1A] rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Stats'}</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: TOTAL USERS */}
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Total Users</span>
                <div className="w-8 h-8 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">
                  {stats.totalUsers ?? 0}
                </div>
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Synced
                </span>
              </div>
              <p className="text-xs text-[#66645E] mt-1">Registered users</p>
            </div>

            {/* Card 2: STUDENTS */}
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Students</span>
                <div className="w-8 h-8 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center border border-[#E0DDD0]">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">
                  {stats.students ?? 0}
                </div>
                <span className="text-[11px] text-[#66645E]">Active Learners</span>
              </div>
              <p className="text-xs text-[#66645E] mt-1">Active student accounts</p>
            </div>

            {/* Card 3: TEAM LEADS */}
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Team Leads</span>
                <div className="w-8 h-8 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center border border-[#E0DDD0]">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">
                  {stats.teamLeads ?? 0}
                </div>
                {(stats.teamLeads ?? 0) === 0 ? (
                  <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Leads
                  </span>
                )}
              </div>
              <p className="text-xs text-[#66645E] mt-1">Assigned team leads</p>
            </div>

            {/* Card 4: ACTIVE TEAMS */}
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs hover:border-[#1C1B1A]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">Active Teams</span>
                <div className="w-8 h-8 rounded-xl bg-[#EEECDF] text-[#1C1B1A] flex items-center justify-center border border-[#E0DDD0]">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-[#1C1B1A] tracking-tight">
                  {stats.teamsCount ?? 0}
                </div>
                <span className="text-[11px] text-[#66645E]">Project Teams</span>
              </div>
              <p className="text-xs text-[#66645E] mt-1">C4GT HUB teams</p>
            </div>
          </>
        )}
      </div>

      {/* 3. ADMIN TASKS & QUICK ACTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">Admin Operations</h3>
            <p className="text-xs text-[#66645E]">Quick access to primary management modules.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Manage Users */}
          <Link
            to="/admin/users"
            className="group bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-base text-[#1C1B1A] mb-1 group-hover:text-black">
                Manage Users & RBAC
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed mb-6">
                Assign roles, manage student access, and update user permissions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] group-hover:underline">
              <span>Open User Management</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Cohort Teams */}
          <Link
            to="/admin/teams"
            className="group bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <Award className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-base text-[#1C1B1A] mb-1 group-hover:text-black">
                C4GT HUB Teams & Leads
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed mb-6">
                Oversee the 9 active C4GT HUB teams, assign team leads, and inspect rosters.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] group-hover:underline">
              <span>Manage C4GT HUB Teams</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Batches */}
          <Link
            to="/admin/batches"
            className="group bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-base text-[#1C1B1A] mb-1 group-hover:text-black">
                Batches Workspace
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed mb-6">
                Organize academic batches, curricula, and track batch performance.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] group-hover:underline">
              <span>View Batches & Teams</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Team Tasks */}
          <Link
            to="/admin/tasks"
            className="group bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#1C1B1A] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                <CheckSquare className="w-4.5 h-4.5" />
              </div>
              <h4 className="font-bold text-base text-[#1C1B1A] mb-1 group-hover:text-black">
                Next Tasks for Teams
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed mb-6">
                Publish next tasks, set deadlines, and monitor student submissions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] group-hover:underline">
              <span>Manage Team Tasks</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4. RECENT REGISTERED USERS TABLE */}
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold tracking-tight text-xl sm:text-2xl font-semibold text-[#1C1B1A]">Recent Registered Users</h3>
            <p className="text-xs text-[#66645E]">Latest registered user accounts.</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1B1A] hover:underline"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto custom-scroll w-full">
          <div className="min-w-[520px]">
            {/* Table Header for strictly aligned columns */}
            <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 sm:px-6 py-2.5 bg-[#F2EFE6]/60 border-b border-[#E2DDD0] text-[10px] sm:text-[11px] font-mono font-semibold text-[#66645E] uppercase tracking-wider">
              <div>User Profile</div>
              <div className="text-center">Role</div>
              <div className="text-right">Registered</div>
            </div>

            {loading ? (
              <SkeletonTable rows={4} rowsOnly />
            ) : recentUsers.length === 0 ? (
              <div className="py-12 text-center text-[#66645E] text-xs">
                No registered users found.
              </div>
            ) : (
              <div className="divide-y divide-[#E2DDD0]">
                {recentUsers.map((u, idx) => {
                  const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
                  return (
                    <div
                      key={u._id || idx}
                      className="grid grid-cols-[1fr_120px_100px] gap-4 items-center px-4 sm:px-6 py-3.5 hover:bg-[#F4F1E8]/50 transition-colors"
                    >
                      {/* Col 1: Profile */}
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <UserAvatar
                          user={u}
                          size="w-9 h-9"
                          rounded="rounded-full"
                          animate="always"
                          className="shadow-2xs shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#1C1B1A] truncate" title={u.name || 'User'}>
                              {u.name || 'User'}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-mono font-semibold text-[#1C1B1A] bg-[#EEECDF] px-1.5 py-0.5 rounded border border-[#E0DDD0] shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#66645E] font-mono truncate" title={u.email}>
                            {u.email}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Role Badge */}
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${getRoleBadgeStyle(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </div>

                      {/* Col 3: Registration Date */}
                      <div className="text-right">
                        <span className="text-xs text-[#66645E] font-mono whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
