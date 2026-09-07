import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth, getRoleName } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { token, user: currentUser, apiBaseUrl } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      setActionMessage(null);

      const res = await fetch(`${apiBaseUrl}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
          text: `Role updated to '${getRoleName(newRole)}' successfully in database.`,
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

  const studentCount = users.filter((u) => u.role === 'user' || u.role === 'student').length;
  const teamLeadCount = users.filter((u) => u.role === 'teamlead' || u.role === 'team_lead').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          System administration, role-based access control, user oversight, and global resource management.
        </p>
      </div>

      {/* Role Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Students (user)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{studentCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Default for all Google sign-ins</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            S
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Leads (teamlead)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{teamLeadCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Cohort coordination access</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            TL
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrators (admin)</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{adminCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Full system control</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            A
          </div>
        </div>
      </div>

      {/* Live RBAC User Management Section */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">User Management & Role Assignment</CardTitle>
            <CardDescription>
              Every new Google user is automatically assigned role <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">user</code>. Change roles below to promote users to Team Lead or Admin.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? 'Refreshing...' : 'Refresh Users'}
          </Button>
        </CardHeader>

        <CardContent>
          {actionMessage && (
            <div
              className={`p-3 mb-4 rounded text-xs font-medium border ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Loading users from MongoDB...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No users registered in database yet.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">
                      Database Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">
                      Change Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u._id;
                    const isUpdating = updatingId === u._id;

                    return (
                      <tr key={u._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">
                                {u.name || 'Unnamed User'}
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                                    (You)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {u.googleId ? 'Google Verified' : 'Standard User'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {u.email}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                              u.status === 'active'
                                ? 'bg-green-50 text-green-700'
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
                          <select
                            value={u.role}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          >
                            <option value="user">Student (user)</option>
                            <option value="teamlead">Team Lead (teamlead)</option>
                            <option value="admin">Admin (admin)</option>
                          </select>
                          {isUpdating && (
                            <span className="ml-2 text-xs text-gray-400 animate-pulse">
                              Saving...
                            </span>
                          )}
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

      {/* Existing Modules / Placeholders preserved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Team structures and assigned leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Assign Team Leads to cohorts and manage student project teams.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Resources</CardTitle>
            <CardDescription>Central learning materials and repositories.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Configure curriculum modules and shared technical reference guides.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
