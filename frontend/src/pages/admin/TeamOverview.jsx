import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';

export default function TeamOverview() {
  const { token, apiBaseUrl } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [assigningTeamId, setAssigningTeamId] = useState(null);
  const [selectedLeadByTeam, setSelectedLeadByTeam] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch teams
      const teamsRes = await fetch(`${apiBaseUrl}/admin/teams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const teamsData = await teamsRes.json();
      if (teamsData.success) {
        setTeams(teamsData.teams || []);
      }

      // Fetch users to populate team leads dropdown
      const usersRes = await fetch(`${apiBaseUrl}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const usersData = await usersRes.json();
      if (usersData.success && usersData.users) {
        // Users eligible to be leads (team leads or regular users)
        setTeamLeads(usersData.users);
      }
    } catch (err) {
      console.error('Failed to load teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignLead = async (teamId, leadId) => {
    try {
      setAssigningTeamId(teamId);
      setActionMessage(null);

      const res = await fetch(`${apiBaseUrl}/admin/teams/${teamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: leadId || null }),
      });

      const data = await res.json();

      if (data.success) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId ? data.team : t))
        );
        setActionMessage({
          type: 'success',
          text: data.message || 'Team Lead assigned successfully.',
        });
      } else {
        setActionMessage({
          type: 'error',
          text: data.message || 'Failed to assign team lead.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error occurred while assigning team lead.',
      });
    } finally {
      setAssigningTeamId(null);
    }
  };

  const assignedCount = teams.filter((t) => t.teamLeadId).length;
  const unassignedCount = teams.length - assignedCount;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Overview of Cohort Teams</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track and configure the 9 cohort teams, assign designated Team Leads, and manage cohort readiness.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="cursor-pointer self-start sm:self-auto shrink-0"
        >
          <svg className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Teams'}
        </Button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Cohorts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{teams.length || 9}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Team 1 to Team 9</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            9
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Leads Assigned</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{assignedCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Ready for task distribution</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Leads</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{unassignedCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Awaiting lead designation</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            !
          </div>
        </div>
      </div>

      {/* Notification banner */}
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

      {/* Teams Grid */}
      {loading && teams.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
          <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Syncing teams from MongoDB Atlas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const hasLead = Boolean(team.teamLeadId);
            const isAssigning = assigningTeamId === team._id;
            const lead = team.teamLeadId;

            return (
              <Card key={team._id} className="shadow-xs border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Cohort #{team.teamNumber}
                      </span>
                      <CardTitle className="text-lg mt-1 text-gray-900">{team.name}</CardTitle>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        hasLead
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {hasLead ? 'Active' : 'Needs Lead'}
                    </span>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Assigned Team Lead Info */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Assigned Team Lead
                      </p>
                      {hasLead ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                          {lead.avatar ? (
                            <img
                              src={lead.avatar}
                              alt={lead.name}
                              className="w-10 h-10 rounded-full object-cover border border-emerald-300"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                              {lead.name ? lead.name.charAt(0).toUpperCase() : 'TL'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {lead.name || 'Team Lead'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>No Team Lead assigned yet. Select one below.</span>
                        </div>
                      )}
                    </div>

                    {/* Members Count */}
                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <span>Team Members:</span>
                      <span className="font-semibold text-gray-900">
                        {team.members ? team.members.length : 0} enrolled
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Team Lead Assignment Selector */}
                <div className="p-4 bg-gray-50/70 border-t border-gray-100 rounded-b-xl">
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    {hasLead ? 'Reassign / Change Lead:' : 'Assign Team Lead:'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedLeadByTeam[team._id] ?? (hasLead ? lead._id : '')}
                      onChange={(e) =>
                        setSelectedLeadByTeam({
                          ...selectedLeadByTeam,
                          [team._id]: e.target.value,
                        })
                      }
                      disabled={isAssigning}
                      className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Select a User to Lead --</option>
                      {teamLeads.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email}) [{u.role}]
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      onClick={() =>
                        handleAssignLead(team._id, selectedLeadByTeam[team._id])
                      }
                      disabled={
                        isAssigning ||
                        selectedLeadByTeam[team._id] === undefined ||
                        selectedLeadByTeam[team._id] === (hasLead ? lead._id : '')
                      }
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0"
                    >
                      {isAssigning ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
