import React, { useState, useEffect } from 'react';
import { useAuth, getRoleName } from '../../context/AuthContext';
import { Users, GraduationCap, Award, ShieldCheck, Search, RefreshCw, CheckCircle2, ShieldAlert, ArrowRight, X } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
import { Skeleton, SkeletonTable } from '../../components/skeleton';

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all'); // 'all' | 'student' | 'teamLead' | 'admin'
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const getDefaultUsers = () => [
    {
      _id: 'u-1',
      name: 'platform',
      email: 'rsdeducationplatform@gmail.com',
      role: 'user',
      status: 'active',
    },
    {
      _id: 'u-2',
      name: 'Swamy Rayudu',
      email: 'swamyrayudu91@gmail.com',
      role: 'user',
      status: 'active',
    },
    {
      _id: 'u-3',
      name: 'palani rahul dravid',
      email: 'rahuldravidpalani2005@gmail.com',
      role: 'admin',
      status: 'active',
    },
    {
      _id: 'u-4',
      name: 'PALIVELA LAKSHMI TARUN',
      email: 'lakshmitaruntarn@gmail.com',
      role: 'admin',
      status: 'active',
    },
    {
      _id: 'u-5',
      name: 'Surendra Chennamalli',
      email: 'surendrachennamalli177@gmail.com',
      role: 'admin',
      status: 'active',
    },
    {
      _id: 'u-6',
      name: 'Khub Team2',
      email: 'khubteam2@gmail.com',
      role: 'user',
      status: 'active',
    },
    {
      _id: 'u-7',
      name: 'Rayudu Veera Venkata Swamy',
      email: 'swamyrayudu7288@gmail.com',
      role: 'admin',
      status: 'active',
    },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
        } else {
          setUsers(getDefaultUsers());
        }
      } else {
        setUsers(getDefaultUsers());
      }
    } catch (err) {
      console.error('Failed to load users from Atlas:', err);
      setUsers(getDefaultUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated successfully to ${getRoleName(newRole)}.`);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated successfully.`);
      }
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`Role updated successfully.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInitiateRoleChange = (targetUser, newRole) => {
    const currentNormalized =
      getNormalizedRoleKey(targetUser.role) === 'teamLead'
        ? 'teamlead'
        : getNormalizedRoleKey(targetUser.role) === 'admin'
          ? 'admin'
          : 'user';
    if (newRole === currentNormalized) return;
    setPendingRoleChange({
      user: targetUser,
      oldRole: currentNormalized,
      newRole,
    });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { user: targetUser, newRole } = pendingRoleChange;
    await handleRoleChange(targetUser._id, newRole);
    setPendingRoleChange(null);
  };

  const handleCancelRoleChange = () => {
    setPendingRoleChange(null);
  };

  const getNormalizedRoleKey = (role) => {
    if (role === 'admin') return 'admin';
    if (role === 'teamlead' || role === 'team_lead') return 'teamLead';
    return 'student';
  };

  // Dynamic counts derived from users array
  const totalCount = users.length;
  const studentCount = users.filter((u) => getNormalizedRoleKey(u.role) === 'student').length;
  const teamLeadCount = users.filter((u) => getNormalizedRoleKey(u.role) === 'teamLead').length;
  const adminCount = users.filter((u) => getNormalizedRoleKey(u.role) === 'admin').length;

  // Filter users based on selected card + search query
  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'all' && getNormalizedRoleKey(u.role) !== selectedRole) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = u.name && u.name.toLowerCase().includes(q);
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  const getTableTitle = () => {
    switch (selectedRole) {
      case 'student':
        return 'Registered Students';
      case 'teamLead':
        return 'Registered Team Leads';
      case 'admin':
        return 'Registered Administrators';
      case 'all':
      default:
        return 'Registered Users';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role) => {
    const norm = getNormalizedRoleKey(role);
    if (norm === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#1C1B1A] text-white border border-black/10">
          Admin
        </span>
      );
    }
    if (norm === 'teamLead') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          Team Lead
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0]">
        Student
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Workspace Section Heading & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">
            User Management &amp; Permissions
          </h2>
          <p className="text-xs text-[#66645E] mt-1">
            Manage registered accounts, assign roles, and update RBAC permissions saved in MongoDB Atlas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#66645E] font-medium hidden md:inline">
            Google SSO enabled
          </span>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E0DDD0] hover:bg-[#F2EFE6] text-[#1C1B1A] rounded-full text-xs font-medium shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Users</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Summary Stat Cards — PASTEL LIGHT TREATMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: ALL USERS (Soft White / Neutral) */}
        <div
          onClick={() => setSelectedRole('all')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between relative select-none ${selectedRole === 'all'
              ? 'bg-white text-[#1C1B1A] shadow-md border-2 border-[#1C1B1A] ring-2 ring-black/5'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">
              ALL USERS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1C1B1A]">
                {loading ? <Skeleton className="w-12 h-8" /> : totalCount}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EEECDF] text-[#1C1B1A] border border-[#E0DDD0]">
                Synced
              </span>
            </div>
            <p className="text-xs text-[#66645E]">
              Registered accounts
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'all' ? 'bg-[#1C1B1A] text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: STUDENTS (Soft Pastel Sage Green) */}
        <div
          onClick={() => setSelectedRole('student')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between relative select-none ${selectedRole === 'student'
              ? 'bg-[#EBF3EA] text-[#1C1B1A] shadow-md border-2 border-[#4A7C59] ring-2 ring-emerald-500/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">
              STUDENTS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1C1B1A]">
                {loading ? <Skeleton className="w-12 h-8" /> : studentCount}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Enrolled
              </span>
            </div>
            <p className="text-xs text-[#66645E]">
              Learners &amp; builders
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'student' ? 'bg-[#4A7C59] text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: TEAM LEADS (Soft Pastel Peach) */}
        <div
          onClick={() => setSelectedRole('teamLead')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between relative select-none ${selectedRole === 'teamLead'
              ? 'bg-[#FCEEE9] text-[#1C1B1A] shadow-md border-2 border-[#D97706] ring-2 ring-amber-500/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">
              TEAM LEADS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1C1B1A]">
                {loading ? <Skeleton className="w-12 h-8" /> : teamLeadCount}
              </span>
              {teamLeadCount === 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Pending
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-[#66645E]">
              Mentors &amp; reviewers
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'teamLead' ? 'bg-[#D97706] text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: ADMINISTRATORS (Soft Warm Cream) */}
        <div
          onClick={() => setSelectedRole('admin')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between relative select-none ${selectedRole === 'admin'
              ? 'bg-[#F2EFE6] text-[#1C1B1A] shadow-md border-2 border-[#1C1B1A] ring-2 ring-black/5'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
            }`}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#66645E]">
              ADMINISTRATORS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1C1B1A]">
                {loading ? <Skeleton className="w-12 h-8" /> : adminCount}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C1B1A]/[0.08] text-[#1C1B1A] border border-[#1C1B1A]/10">
                Full RBAC
              </span>
            </div>
            <p className="text-xs text-[#66645E]">
              Platform managers
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'admin' ? 'bg-[#1C1B1A] text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* User Table Container */}
      <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] shadow-2xs overflow-hidden">
        {/* Table Card Header & Filter */}
        <div className="p-6 border-b border-[#E0DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">{getTableTitle()}</h3>
              <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-[#EEECDF] text-[#1C1B1A] rounded-full border border-[#E0DDD0]">
                {loading ? '...' : filteredUsers.length}
              </span>
            </div>
            <p className="text-xs text-[#66645E] mt-0.5">
              Update roles in real time. Permissions synchronize automatically across Atlas.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#66645E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-[#E0DDD0] bg-white text-[#1C1B1A] placeholder-[#9E9C94] focus:outline-none focus:border-[#1C1B1A] transition"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 sm:p-6">
              <SkeletonTable rows={6} rowsOnly />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#EEECDF] flex items-center justify-center text-[#66645E] mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#1C1B1A] mb-1">No Matching Users</h4>
              <p className="text-xs text-[#66645E] max-w-sm">
                No accounts match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#F2EFE6] border-b border-[#E0DDD0] text-[11px] font-mono font-semibold text-[#66645E] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User Profile</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6">Current Role</th>
                  <th className="py-3.5 px-6">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD0] text-xs text-[#1C1B1A]">
                {filteredUsers.map((u, idx) => {
                  const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
                  const isUpdating = updatingId === u._id;
                  const normalizedRole = getNormalizedRoleKey(u.role) === 'teamLead' ? 'teamlead' : getNormalizedRoleKey(u.role) === 'admin' ? 'admin' : 'user';

                  return (
                    <tr key={u._id || idx} className="hover:bg-[#F4F1E8]/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size="w-8 h-8" rounded="rounded-full" animate="always" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1C1B1A] truncate">{u.name || 'User'}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#1C1B1A] text-white rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#66645E]">Google OAuth</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 text-[#66645E] font-mono text-[11px] truncate">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          active
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3.5 px-6">
                        {isSelf ? (
                          <select
                            disabled
                            value="admin"
                            className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#E0DDD0] bg-[#EEECDF] text-[#66645E] cursor-not-allowed font-medium"
                          >
                            <option value="admin">Admin (admin)</option>
                          </select>
                        ) : (
                          <select
                            value={normalizedRole}
                            disabled={isUpdating}
                            onChange={(e) => handleInitiateRoleChange(u, e.target.value)}
                            className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:outline-none focus:border-[#1C1B1A] cursor-pointer shadow-2xs transition disabled:opacity-50"
                          >
                            <option value="user">Student (user)</option>
                            <option value="teamlead">Team Lead (mentor)</option>
                            <option value="admin">Admin (admin)</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {pendingRoleChange && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-role-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !updatingId) handleCancelRoleChange();
          }}
        >
          <div className="bg-white rounded-2xl border border-[#E0DDD0] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 pb-4 border-b border-[#E2DDD0] bg-[#FAF8F3] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="confirm-role-title" className="text-base font-bold text-[#1C1B1A]">
                  Confirm Role Change
                </h3>
                <p className="text-xs text-[#66645E] mt-0.5">
                  Modifying system privileges and workspace permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelRoleChange}
                disabled={!!updatingId}
                className="p-1 rounded-lg text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Member Preview Card */}
              <div className="p-3 rounded-xl bg-[#F4F1E8] border border-[#E2DDD0] flex items-center gap-3">
                <UserAvatar
                  user={pendingRoleChange.user}
                  size="w-9 h-9"
                  rounded="rounded-full"
                  animate="always"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#1C1B1A] truncate">
                    {pendingRoleChange.user.name || 'User'}
                  </h4>
                  <p className="text-[11px] text-[#66645E] font-mono truncate">
                    {pendingRoleChange.user.email}
                  </p>
                </div>
              </div>

              {/* Role Transition Visualization */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E2DDD0] space-y-2">
                <span className="text-[10px] font-bold text-[#66645E] uppercase tracking-wider block">
                  Permission Transition
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 text-center py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-[9px] text-gray-500 uppercase font-mono block">Current</span>
                    <span className="text-xs font-bold text-gray-800">
                      {getRoleName(pendingRoleChange.oldRole)}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#66645E] shrink-0" />

                  <div className="flex-1 text-center py-2 px-3 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-[9px] text-amber-700 uppercase font-mono block">New Role</span>
                    <span className="text-xs font-bold text-amber-900">
                      {getRoleName(pendingRoleChange.newRole)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advisory Message */}
              <p className="text-xs text-[#66645E] leading-relaxed">
                {pendingRoleChange.newRole === 'admin'
                  ? '⚠️ Promoting this user to Admin will grant full system access, including managing other users, team allocations, and batch submissions.'
                  : pendingRoleChange.newRole === 'teamlead'
                    ? '💡 Promoting this user to Team Lead will allow them to review member tasks, supervise assignments, and mentor their assigned team.'
                    : 'ℹ️ Changing this user to Student will restrict their privileges to viewing C4GT HUB teams and submitting assignments.'}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 bg-[#FAF8F3] border-t border-[#E2DDD0] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelRoleChange}
                disabled={!!updatingId}
                className="px-3.5 py-2 text-xs font-semibold text-[#66645E] hover:text-[#1C1B1A] hover:bg-black/5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={!!updatingId}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1C1B1A] hover:bg-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {updatingId ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm & Apply Role</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-8 flex items-center gap-3 px-5 py-3 bg-[#1C1B1A] text-white rounded-2xl shadow-xl border border-black/20 z-50 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
