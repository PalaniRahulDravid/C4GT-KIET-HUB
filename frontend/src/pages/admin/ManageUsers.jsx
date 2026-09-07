import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth, getRoleName } from '../../context/AuthContext';

export default function ManageUsers() {
  const { token, user: currentUser, apiBaseUrl } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      setActionMessage(null);

      const res = await fetch(`${apiBaseUrl}/admin/users/${userId}/role`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setActionMessage({
          type: 'success',
          text: `Role successfully updated to '${getRoleName(newRole)}' in MongoDB Atlas.`,
        });
      } else {
        setActionMessage({
          type: 'error',
          text: data.message || 'Failed to update role',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'An error occurred while updating role',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'teamlead':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'user':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Filter users based on search & role filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'user' && (u.role === 'user' || u.role === 'student')) ||
      (roleFilter === 'teamlead' && (u.role === 'teamlead' || u.role === 'team_lead')) ||
      (roleFilter === 'admin' && u.role === 'admin');

    return matchesSearch && matchesRole;
  });

  const studentCount = users.filter((u) => u.role === 'user' || u.role === 'student').length;
  const teamLeadCount = users.filter((u) => u.role === 'teamlead' || u.role === 'team_lead').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage registered accounts, assign roles, and update RBAC permissions saved in MongoDB Atlas.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="cursor-pointer self-start sm:self-auto shrink-0"
        >
          <svg className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Users'}
        </Button>
      </div>

      {/* Role Counts Filter Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setRoleFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wider ${roleFilter === 'all' ? 'text-slate-300' : 'text-gray-500'}`}>
            All Users
          </p>
          <p className="text-2xl font-bold mt-1">{users.length}</p>
        </button>

        <button
          onClick={() => setRoleFilter('user')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            roleFilter === 'user'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wider ${roleFilter === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
            Students
          </p>
          <p className={`text-2xl font-bold mt-1 ${roleFilter === 'user' ? 'text-white' : 'text-blue-600'}`}>
            {studentCount}
          </p>
        </button>

        <button
          onClick={() => setRoleFilter('teamlead')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            roleFilter === 'teamlead'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wider ${roleFilter === 'teamlead' ? 'text-emerald-100' : 'text-gray-500'}`}>
            Team Leads
          </p>
          <p className={`text-2xl font-bold mt-1 ${roleFilter === 'teamlead' ? 'text-white' : 'text-emerald-600'}`}>
            {teamLeadCount}
          </p>
        </button>

        <button
          onClick={() => setRoleFilter('admin')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            roleFilter === 'admin'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className={`text-xs font-semibold uppercase tracking-wider ${roleFilter === 'admin' ? 'text-purple-100' : 'text-gray-500'}`}>
            Administrators
          </p>
          <p className={`text-2xl font-bold mt-1 ${roleFilter === 'admin' ? 'text-white' : 'text-purple-600'}`}>
            {adminCount}
          </p>
        </button>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">Registered Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Live user list. Update roles in the rightmost column to change user permissions in real time.
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Notification banner */}
          {actionMessage && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs font-medium border flex items-center justify-between ${
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

          {loading && users.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading users from MongoDB Atlas...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No users match the current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">
                      User Profile
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">
                      Current Role
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs">
                      Assign Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u._id;
                    const isUpdating = updatingId === u._id;

                    return (
                      <tr key={u._id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">
                                {u.name || 'Unnamed User'}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {u.googleId ? 'Google Account' : 'Direct Sign-in'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs font-mono">
                          {u.email}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              u.status === 'active'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded border ${getRoleBadgeStyle(
                              u.role
                            )}`}
                          >
                            {getRoleName(u.role)}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={isUpdating}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                            >
                              <option value="user">Student (user)</option>
                              <option value="teamlead">Team Lead (teamlead)</option>
                              <option value="admin">Admin (admin)</option>
                            </select>
                            {isUpdating && (
                              <span className="text-xs text-purple-600 animate-pulse font-medium">
                                Saving...
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
