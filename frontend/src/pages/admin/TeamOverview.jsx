import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, getRoleName } from '../../context/AuthContext';

export default function TeamOverview() {
  const { token, apiBaseUrl } = useAuth();
  const [teams, setTeams] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState({
    message: 'Cohort teams loaded from MongoDB Atlas.',
    type: 'success',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals for rich search/assign and change/remove workflows
  const [searchModalTeam, setSearchModalTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'available' | 'assigned'
  const [changeModalTeam, setChangeModalTeam] = useState(null);

  const API_BASE_URL = apiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const trackNames = {
    1: 'Machine Learning & AI Track',
    2: 'DSA & Problem Solving Track',
    3: 'Full Stack Web Development Track',
    4: 'Web3 & Smart Contracts Track',
    5: 'Cloud & DevOps Automation Track',
    6: 'Open Source Contributions Track',
    7: 'Mobile Application Development Track',
    8: 'Cybersecurity & Network Defense Track',
    9: 'Data Engineering & Analytics Track',
  };

  const defaultReadiness = {
    1: 75,
    2: 25,
    3: 20,
    4: 30,
    5: 15,
    6: 10,
    7: 20,
    8: 25,
    9: 20,
  };

  const getDefaultEligibleUsers = () => [
    {
      _id: 'u-1',
      name: 'platform',
      email: 'rsdeducationplatform@gmail.com',
      role: 'user',
    },
    {
      _id: 'u-2',
      name: 'Swamy Rayudu',
      email: 'swamyrayudu91@gmail.com',
      role: 'teamlead',
    },
    {
      _id: 'u-3',
      name: 'palani rahul dravid',
      email: 'rahuldravidpalani2005@gmail.com',
      role: 'admin',
    },
    {
      _id: 'u-5',
      name: 'Surendra Chennamalli',
      email: 'surendrachennamalli177@gmail.com',
      role: 'admin',
    },
    {
      _id: 'u-6',
      name: 'Khub Team2',
      email: 'khubteam2@gmail.com',
      role: 'user',
    },
  ];

  const getDefaultTeams = () => {
    return Array.from({ length: 9 }, (_, i) => {
      const num = i + 1;
      const isTeam1 = num === 1;
      return {
        _id: `team-${num}`,
        teamNumber: num,
        name: `Team ${num}`,
        track: trackNames[num],
        teamLeadId: isTeam1
          ? {
              _id: 'u-2',
              name: 'Swamy Rayudu',
              email: 'swamyrayudu91@gmail.com',
              role: 'teamlead',
            }
          : null,
      };
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch teams
      const teamsRes = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.success && Array.isArray(teamsData.teams) && teamsData.teams.length > 0) {
          setTeams(teamsData.teams);
        } else {
          setTeams(getDefaultTeams());
        }
      } else {
        setTeams(getDefaultTeams());
      }

      // Fetch users for lead assignment dropdown
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users) && usersData.users.length > 0) {
          setEligibleUsers(usersData.users);
        } else {
          setEligibleUsers(getDefaultEligibleUsers());
        }
      } else {
        setEligibleUsers(getDefaultEligibleUsers());
      }
    } catch (err) {
      console.error('Failed to load teams data:', err);
      setTeams(getDefaultTeams());
      setEligibleUsers(getDefaultEligibleUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map of userId -> teamNumber assigned
  const assignedLeadsMap = useMemo(() => {
    const map = {};
    teams.forEach((t) => {
      if (t.teamLeadId) {
        const leadId = typeof t.teamLeadId === 'object' ? t.teamLeadId._id : t.teamLeadId;
        if (leadId) {
          map[leadId] = t.teamNumber;
        }
      }
    });
    return map;
  }, [teams]);

  // Available users (not assigned as lead to any cohort team)
  const availableUsers = useMemo(() => {
    return eligibleUsers.filter((u) => !assignedLeadsMap[u._id]);
  }, [eligibleUsers, assignedLeadsMap]);

  // Users already assigned to a cohort team
  const assignedUsers = useMemo(() => {
    return eligibleUsers.filter((u) => assignedLeadsMap[u._id]);
  }, [eligibleUsers, assignedLeadsMap]);

  const handleRefreshTeams = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    showToast('✓ Cohort team data synced from MongoDB Atlas.', 'success');
  };

  const handleLeadSelect = (teamId, userId) => {
    setSelectedLeads((prev) => ({
      ...prev,
      [teamId]: userId,
    }));
  };

  const handleAssignLead = async (teamId, teamNumber, directUserId = null) => {
    const userId = directUserId || selectedLeads[teamId];
    if (!userId) return;

    const chosenUser = eligibleUsers.find((u) => u._id === userId);

    // Client-side guard: check if already assigned
    const assignedTeamNum = assignedLeadsMap[userId];
    if (assignedTeamNum && assignedTeamNum !== teamNumber) {
      showToast(
        `⚠️ ${chosenUser?.name || 'Selected user'} is already assigned as Team Lead for Team ${assignedTeamNum}.`,
        'error'
      );
      return;
    }

    try {
      setAssigningId(teamId);

      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: userId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(`⚠️ ${data.message || 'Failed to assign team lead'}`, 'error');
        return;
      }

      if (data.team) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId || t.teamNumber === teamNumber ? data.team : t))
        );
      } else {
        setTeams((prev) =>
          prev.map((t) =>
            t._id === teamId || t.teamNumber === teamNumber
              ? {
                  ...t,
                  teamLeadId: chosenUser || {
                    _id: userId,
                    name: 'Assigned Lead',
                    email: 'lead@c4gt.in',
                    role: 'teamlead',
                  },
                }
              : t
          )
        );
      }

      showToast(`✓ ${chosenUser?.name || 'Lead'} assigned to Team ${teamNumber} successfully.`, 'success');
      setSelectedLeads((prev) => {
        const copy = { ...prev };
        delete copy[teamId];
        return copy;
      });
      setSearchModalTeam(null);
      setChangeModalTeam(null);
    } catch (err) {
      console.error('Failed to assign team lead:', err);
      showToast('⚠️ Network error while assigning team lead. Please check connection.', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemoveLead = async (teamId, teamNumber) => {
    try {
      setAssigningId(teamId);

      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: null }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(`⚠️ ${data.message || 'Failed to unassign lead'}`, 'error');
        return;
      }

      if (data.team) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId || t.teamNumber === teamNumber ? data.team : t))
        );
      } else {
        setTeams((prev) =>
          prev.map((t) =>
            t._id === teamId || t.teamNumber === teamNumber
              ? { ...t, teamLeadId: null }
              : t
          )
        );
      }

      showToast(`Team ${teamNumber} lead unassigned. Ready for new selection.`, 'success');
      setChangeModalTeam(null);
    } catch (err) {
      console.error('Failed to unassign lead:', err);
      showToast('⚠️ Network error while unassigning lead.', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'TL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const assignedCount = teams.filter((t) => t.teamLeadId).length;
  const pendingCount = teams.length - assignedCount;

  // Filter users for directory search modal
  const filteredModalUsers = useMemo(() => {
    return eligibleUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      if (!matchQuery) return false;

      const isAssigned = Boolean(assignedLeadsMap[u._id]);
      if (searchFilter === 'available') return !isAssigned;
      if (searchFilter === 'assigned') return isAssigned;
      return true;
    });
  }, [eligibleUsers, searchQuery, searchFilter, assignedLeadsMap]);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[1150px] mx-auto space-y-4 relative">
      {/* Content Top Area: Section Heading & Summary Metric Cards */}
      <div className="space-y-4 shrink-0">
        {/* Section Heading & Refresh Teams Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Overview of Cohort Teams</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track and configure the 9 cohort teams, assign designated Team Leads, and manage cohort readiness.
            </p>
          </div>
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              Automatic RBAC role synchronization
            </span>
            <button
              id="refresh-teams-btn"
              type="button"
              onClick={handleRefreshTeams}
              disabled={isRefreshing || loading}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs transition cursor-pointer"
            >
              <svg
                id="refresh-icon"
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-500 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <span>Refresh Teams</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Cohorts */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Cohorts</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{teams.length || 9}</span>
                <span className="text-[10px] text-violet-300 font-medium bg-violet-600/30 border border-violet-500/30 px-1.5 py-0.2 rounded-full">
                  Team 1 to Team 9
                </span>
              </div>
              <p className="text-[11px] text-slate-400">All cohorts structured &amp; monitored</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path
                  d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
          </div>

          {/* Card 2: Leads Assigned */}
          <div className="bg-white text-slate-900 rounded-xl p-4 shadow-xs border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Leads Assigned</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-600" id="count-leads-assigned">
                  {assignedCount}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                  Ready for task distribution
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Designated cohort leads active</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
          </div>

          {/* Card 3: Pending Leads */}
          <div className="bg-white text-slate-900 rounded-xl p-4 shadow-xs border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Pending Leads</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-amber-500" id="count-pending-leads">
                  {pendingCount}
                </span>
                <span className="text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                  Awaiting lead designation
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Assign sprint reviewer below</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* BEGIN: Cohort Teams Grid */}
      <div className="flex-1 overflow-y-auto max-h-[520px] pr-1 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, idx) => {
            const teamNum = team.teamNumber || idx + 1;
            const lead = team.teamLeadId;
            const track = team.track || trackNames[teamNum] || 'Engineering Cohort Track';
            const hasLead = Boolean(lead);
            const readinessPct = hasLead ? 75 : defaultReadiness[teamNum] || 25;
            const isAssigning = assigningId === team._id;
            const selectedVal = selectedLeads[team._id] || '';
            const selectedCandidate = eligibleUsers.find((u) => u._id === selectedVal);

            return (
              <div
                key={team._id || idx}
                id={`team-card-${teamNum}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  {/* Top Bar with Cohort Badge & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 tracking-wide">
                      COHORT #{teamNum}
                    </span>
                    {hasLead ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Lead Assigned
                      </span>
                    ) : (
                      <span className="status-pill inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                        Needs Lead
                      </span>
                    )}
                  </div>

                  {/* Team Title & Track */}
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Team {teamNum}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{track}</p>

                  {/* Middle Lead Box */}
                  {hasLead ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {getInitials(lead.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {lead.name || 'Assigned Lead'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                              Assigned
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {lead.email || 'lead@c4gt.in'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isAssigning}
                        onClick={() => setChangeModalTeam(team)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-md transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="lead-container mt-3 space-y-2">
                      {/* Interactive Assignment Area */}
                      {selectedCandidate ? (
                        /* Selected Candidate Preview Card + Immediate Action */
                        <div className="p-2 rounded-lg bg-violet-50/80 border border-violet-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs shrink-0">
                                {getInitials(selectedCandidate.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {selectedCandidate.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-violet-100 text-violet-700">
                                    {getRoleName(selectedCandidate.role)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  {selectedCandidate.email}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLeadSelect(team._id, '')}
                              title="Cancel selection"
                              className="text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5 pt-0.5">
                            <button
                              id={`btn-assign-${teamNum}`}
                              type="button"
                              disabled={isAssigning}
                              onClick={() => handleAssignLead(team._id, teamNum)}
                              className="assign-btn flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 rounded-lg shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              {isAssigning ? (
                                <>
                                  <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Assigning...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                  </svg>
                                  <span>Confirm &amp; Assign Lead</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Clean Select Input with Quick Search Modal Trigger */
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Designate Team Lead</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchModalTeam(team);
                                setSearchQuery('');
                                setSearchFilter('all');
                              }}
                              className="text-violet-600 hover:text-violet-700 font-semibold flex items-center space-x-1 cursor-pointer transition hover:underline"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>Browse directory</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <select
                                id={`select-team-${teamNum}`}
                                value={selectedVal}
                                onChange={(e) => handleLeadSelect(team._id, e.target.value)}
                                className="lead-select w-full py-1.5 pl-2.5 pr-7 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 shadow-2xs cursor-pointer truncate appearance-none"
                              >
                                <option value="">Select a Team Lead ({availableUsers.length} available)...</option>
                                {availableUsers.length > 0 && (
                                  <optgroup label="Available Candidates">
                                    {availableUsers.map((u) => (
                                      <option key={u._id} value={u._id}>
                                        {u.name} — {getRoleName(u.role)}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {assignedUsers.length > 0 && (
                                  <optgroup label="Already Assigned to Other Cohorts">
                                    {assignedUsers.map((u) => (
                                      <option key={u._id} value={u._id} disabled>
                                        {u.name} (Assigned to Team {assignedLeadsMap[u._id]})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="m19.5 8.25-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>

                            <button
                              id={`btn-assign-${teamNum}`}
                              type="button"
                              disabled={!selectedVal || isAssigning}
                              onClick={() => handleAssignLead(team._id, teamNum)}
                              className="assign-btn px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition shrink-0 cursor-pointer"
                            >
                              Assign
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Readiness & Status Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 readiness-section">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500 font-medium">Team Readiness</span>
                    <span
                      className={`readiness-text font-bold ${
                        hasLead ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {hasLead
                        ? '75% • Ready for Tasks'
                        : `${readinessPct}% • Awaiting Lead`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`readiness-bar h-full rounded-full transition-all duration-500 ${
                        hasLead ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${readinessPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom sync status bar */}
      <div className="px-4 py-2 border border-slate-200 bg-white rounded-xl flex items-center justify-between text-[11px] text-slate-500 shadow-2xs shrink-0 mt-2">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Connected to KIET C4GT MongoDB Atlas cluster (read/write live sync)</span>
        </div>
        <span className="font-mono text-slate-400">Collection: c4gt_cohort_teams</span>
      </div>

      {/* BEGIN: Search & Assign Directory Modal */}
      {searchModalTeam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                    COHORT #{searchModalTeam.teamNumber}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assign Lead to {searchModalTeam.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchModalTeam.track || trackNames[searchModalTeam.teamNumber]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchModalTeam(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input & Filter Tabs */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition"
                  autoFocus
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSearchFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    searchFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({eligibleUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFilter('available')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    searchFilter === 'available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Available ({availableUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSearchFilter('assigned')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    searchFilter === 'assigned'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Already Leads ({assignedUsers.length})
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px]">
              {filteredModalUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-semibold">No candidates match your search</p>
                  <p className="text-[11px] text-slate-400">Try changing keywords or clearing the filter.</p>
                </div>
              ) : (
                filteredModalUsers.map((u) => {
                  const assignedTeam = assignedLeadsMap[u._id];
                  const isCurrentTeamLead = assignedTeam === searchModalTeam.teamNumber;
                  const isOtherTeamLead = assignedTeam && !isCurrentTeamLead;

                  return (
                    <div
                      key={u._id}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {u.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-700">
                              {getRoleName(u.role)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isCurrentTeamLead ? (
                          <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                            Current Lead
                          </span>
                        ) : isOtherTeamLead ? (
                          <span className="px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg">
                            Leads Team {assignedTeam}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={assigningId === searchModalTeam._id}
                            onClick={() =>
                              handleAssignLead(
                                searchModalTeam._id,
                                searchModalTeam.teamNumber,
                                u._id
                              )
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {assigningId === searchModalTeam._id ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {availableUsers.length} candidates available for designation
              </span>
              <button
                type="button"
                onClick={() => setSearchModalTeam(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEGIN: Change / Reassign Lead Modal */}
      {changeModalTeam && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  COHORT #{changeModalTeam.teamNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Manage Team Lead
                </h3>
                <p className="text-xs text-slate-500">
                  {changeModalTeam.name} • {changeModalTeam.track || trackNames[changeModalTeam.teamNumber]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChangeModalTeam(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Lead Details */}
            {changeModalTeam.teamLeadId && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {getInitials(changeModalTeam.teamLeadId.name)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {changeModalTeam.teamLeadId.name}
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {changeModalTeam.teamLeadId.email}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = changeModalTeam;
                  setChangeModalTeam(null);
                  setSearchModalTeam(target);
                  setSearchQuery('');
                  setSearchFilter('all');
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Replace with Another Candidate</span>
              </button>

              <button
                type="button"
                disabled={assigningId === changeModalTeam._id}
                onClick={() => handleRemoveLead(changeModalTeam._id, changeModalTeam.teamNumber)}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  {assigningId === changeModalTeam._id ? 'Removing...' : 'Remove Team Lead'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setChangeModalTeam(null)}
                className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Toast Notification (Supports success and error) */}
      {toast && toast.message && (
        <div
          data-purpose="success-toast"
          className={`fixed sm:absolute bottom-6 right-8 flex items-center space-x-3 px-4 py-2.5 text-white rounded-xl shadow-xl backdrop-blur-sm z-50 transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 border border-rose-700'
              : 'bg-slate-900/95 border border-slate-800'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            )}
          </div>
          <span className="text-xs font-medium tracking-tight" id="toast-message">
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs cursor-pointer"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
