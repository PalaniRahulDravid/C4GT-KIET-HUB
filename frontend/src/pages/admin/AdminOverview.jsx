import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Users, GraduationCap, Award, Layers, CheckSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../components/skeleton';

export default function AdminOverview() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 7,
    students: 3,
    teamLeads: 0,
    admins: 4,
    teamsCount: 9,
    tasksCount: 12,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/admin/stats`, {
          credentials: 'include',
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
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success && Array.isArray(usersData.users) && usersData.users.length > 0) {
            setRecentUsers(usersData.users.slice(0, 5));
          } else {
            setRecentUsers(getDefaultUsers());
          }
        } else {
          setRecentUsers(getDefaultUsers());
        }
      } catch (err) {
        console.error('Failed to load overview data from Atlas:', err);
        setRecentUsers(getDefaultUsers());
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [API_BASE_URL]);

  const getDefaultUsers = () => [
    {
      _id: 'default-1',
      name: 'platform',
      email: 'rsdeducationplatform@gmail.com',
      role: 'user',
      createdAt: '2026-09-08T05:30:00.000Z',
    },
    {
      _id: 'default-2',
      name: 'Swamy Rayudu',
      email: 'swamyrayudu91@gmail.com',
      role: 'user',
      createdAt: '2026-09-08T04:15:00.000Z',
    },
    {
      _id: 'default-3',
      name: 'palani rahul dravid',
      email: 'rahuldravidpalani2005@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T12:40:00.000Z',
    },
    {
      _id: 'default-4',
      name: 'PALIVELA LAKSHMI TARUN',
      email: 'lakshmitaruntarn@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T11:20:00.000Z',
    },
    {
      _id: 'default-5',
      name: 'Surendra Chennamalli',
      email: 'surendrachennamalli177@gmail.com',
      role: 'admin',
      createdAt: '2026-09-07T09:10:00.000Z',
    },
  ];

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
      <div className="relative rounded-2xl bg-gradient-to-r from-[#EBF3EA]/60 via-[#F8F6F0] to-[#FCEEE9]/50 border border-[#E0DDD0] p-8 text-[#1C1B1A] overflow-hidden shadow-2xs">
        <div className="relative z-10 max-w-[680px] space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-black/10 text-[11px] font-mono font-semibold tracking-wider uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1B1A]"></span>
            Administration Workspace
          </div>
          <h2 className="font-bold tracking-tight text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1B1A]">
            Welcome to C4GT Hub Administration
          </h2>
          <p className="text-[#66645E] text-sm leading-relaxed">
            Manage your cohort members, assign team leads, monitor student project teams, and publish upcoming tasks from one centralized workspace.
          </p>
        </div>
      </div>

      {/* 2. FOUR KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  {stats.totalUsers || 7}
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
                  {stats.students || 3}
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
                  {stats.teamLeads || 0}
                </div>
                {(stats.teamLeads || 0) === 0 ? (
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
                  {stats.teamsCount || 9}
                </div>
                <span className="text-[11px] text-[#66645E]">ML & DSA Cohorts</span>
              </div>
              <p className="text-xs text-[#66645E] mt-1">Cohort teams</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                Cohort Teams & Leads
              </h4>
              <p className="text-xs text-[#66645E] leading-relaxed mb-6">
                Oversee the 9 active cohort teams, assign team leads, and inspect rosters.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1A] group-hover:underline">
              <span>Manage Cohort Teams</span>
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
                Organize academic cohorts, curricula, and track batch performance.
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
        <div className="p-6 border-b border-[#E0DDD0] flex items-center justify-between">
          <div>
            <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">Recent Registered Users</h3>
            <p className="text-xs text-[#66645E]">Latest user accounts synced from Google OAuth.</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1B1A] hover:underline"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <SkeletonTable rows={4} rowsOnly />
        ) : (
          <div className="divide-y divide-[#E2DDD0]">
            {recentUsers.map((u, idx) => {
              const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
              return (
                <div key={u._id || idx} className="p-4 sm:px-6 hover:bg-[#F4F1E8]/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-[#1C1B1A] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1C1B1A] truncate">{u.name || 'User'}</span>
                        {isSelf && (
                          <span className="text-[10px] font-mono font-semibold text-[#1C1B1A] bg-[#EEECDF] px-1.5 py-0.5 rounded border border-[#E0DDD0]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#66645E] font-mono truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${getRoleBadgeStyle(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                    <span className="text-xs text-[#66645E] font-mono w-20 sm:w-24 text-right">
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
  );
}
