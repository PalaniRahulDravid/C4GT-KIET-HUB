import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { useAuth, getRoleName } from '../../context/AuthContext';

export default function AdminOverview() {
  const { token, apiBaseUrl } = useAuth();
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

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsRes = await fetch(`${apiBaseUrl}/admin/stats`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      // Fetch users for recent list
      const usersRes = await fetch(`${apiBaseUrl}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const usersData = await usersRes.json();
      if (usersData.success && usersData.users) {
        setRecentUsers(usersData.users.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 border border-purple-800/40">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Administration Control Panel
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to C4GT Hub Administration
          </h1>
          <p className="mt-2 text-sm text-purple-100/80 leading-relaxed">
            Manage your cohort members, assign team leaders, monitor student project teams, and publish next tasks directly to MongoDB Atlas.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Users</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalUsers}</p>
          <p className="text-xs text-gray-400 mt-1">Registered in MongoDB Atlas</p>
        </div>

        {/* Students */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Students</p>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              S
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.students}</p>
          <p className="text-xs text-gray-400 mt-1">Role: <code className="text-blue-600 font-semibold">user</code></p>
        </div>

        {/* Team Leads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Team Leads</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              TL
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{loading ? '...' : stats.teamLeads}</p>
          <p className="text-xs text-gray-400 mt-1">Role: <code className="text-emerald-600 font-semibold">teamlead</code></p>
        </div>

        {/* Cohort Teams */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Teams</p>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-2">{loading ? '...' : (stats.teamsCount || 9)}</p>
          <p className="text-xs text-gray-400 mt-1">Cohort 1 to 9 Teams</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Tasks & Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Manage Users */}
          <Link
            to="/admin/users"
            className="group bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-lg hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Manage Users
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Inspect registered Google users, assign roles (Student, Team Lead, Admin), and configure access rights.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
              <span>Open User Management</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 2: Overview of Teams */}
          <Link
            to="/admin/teams"
            className="group bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Overview of Teams
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Review all 9 cohort teams, assign designated Team Leads, track member counts, and monitor team status.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>View Cohort Teams</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 3: Next Tasks for Teams */}
          <Link
            to="/admin/tasks"
            className="group bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Next Tasks for Teams
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Assign and schedule next tasks, set deadlines, specify target groups (interns, junior developers), and manage deliverables.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Manage Team Tasks</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Users Preview */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Recent Registered Users</CardTitle>
            <CardDescription>Latest users synced directly from MongoDB Atlas</CardDescription>
          </div>
          <Link
            to="/admin/users"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            View All Users →
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading recent users...</div>
          ) : recentUsers.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No registered users found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <div key={u._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{u.name || 'User'}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded border ${getRoleBadgeStyle(
                        u.role
                      )}`}
                    >
                      {getRoleName(u.role)}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
