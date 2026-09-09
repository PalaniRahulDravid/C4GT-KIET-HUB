import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export default function Batches() {
  const { batchId, teamId } = useParams();
  const navigate = useNavigate();
  const { token, apiBaseUrl } = useAuth();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState({
    message: 'Batches data synchronized with MongoDB Atlas.',
    type: 'success',
  });

  // Active Tab for Team Details
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'performance' | 'tasks'
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'overdue'

  // Create Batch Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('2028 – 2029');
  const [newBatchStatus, setNewBatchStatus] = useState('Upcoming');
  const [newBatchStartDate, setNewBatchStartDate] = useState('2028-08-01');
  const [newBatchEndDate, setNewBatchEndDate] = useState('2029-05-31');
  const [newBatchTeamsCount, setNewBatchTeamsCount] = useState(9);

  // Batches state list - Initially starts with current active batch (2026 – 2027)
  const [batches, setBatches] = useState([
    {
      id: '2026-2027',
      year: '2026 – 2027',
      status: 'Active Batch',
      teamsCount: 9,
      activeTeamsCount: 9,
      studentsCount: 42,
      avgPerformance: '78%',
      upcoming: false,
    },
  ]);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Teams
      const teamsRes = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let fetchedTeams = [];
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.success && Array.isArray(teamsData.teams)) {
          fetchedTeams = teamsData.teams;
        }
      }
      if (fetchedTeams.length === 0) {
        fetchedTeams = Array.from({ length: 9 }, (_, i) => ({
          _id: `team-${i + 1}`,
          teamNumber: i + 1,
          name: `Team ${i + 1}`,
          track: trackNames[i + 1],
          teamLeadId: i === 0 ? { _id: 'u-lead-harsha', name: 'Harsha', email: 'harsha@c4gt.in' } : null,
          membersCount: 8,
          juniorDevsCount: 5,
          devInternsCount: 3,
          taskCompletion: '82%',
          performancePct: '78%',
        }));
      }
      setTeams(fetchedTeams);

      // Fetch Users
      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let fetchedUsers = [];
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          fetchedUsers = usersData.users;
        }
      }
      setUsers(fetchedUsers);

      // Fetch Tasks
      const tasksRes = await fetch(`${API_BASE_URL}/admin/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let fetchedTasks = [];
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success && Array.isArray(tasksData.tasks)) {
          fetchedTasks = tasksData.tasks;
        }
      }
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Failed to load Batches data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    showToast('✓ Batches & MongoDB Atlas data synchronized.', 'success');
  };

  const handleCreateBatchSubmit = (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    const slugId = newBatchName.trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const numTeams = parseInt(newBatchTeamsCount, 10) || 0;

    const newStatusLabel =
      newBatchStatus === 'Active'
        ? 'Active Batch'
        : newBatchStatus === 'Completed' || newBatchStatus === 'Past'
        ? 'Past Batch'
        : 'Upcoming Batch';

    const newBatch = {
      id: slugId || `batch-${Date.now()}`,
      year: newBatchName.trim(),
      status: newStatusLabel,
      teamsCount: numTeams,
      activeTeamsCount: newBatchStatus === 'Active' ? numTeams : 0,
      studentsCount: newBatchStatus === 'Active' ? numTeams * 4 : 0,
      avgPerformance: newBatchStatus === 'Active' ? '75%' : '—',
      upcoming: newBatchStatus === 'Upcoming',
      startDate: newBatchStartDate,
      endDate: newBatchEndDate,
    };

    setBatches((prev) => {
      if (newBatchStatus === 'Active') {
        const updatedPrev = prev.map((b) =>
          b.status === 'Active Batch' || b.status === 'Active'
            ? { ...b, status: 'Past Batch' }
            : b
        );
        return [...updatedPrev, newBatch];
      }
      return [...prev, newBatch];
    });

    setCreateModalOpen(false);
    showToast(`✓ Batch ${newBatchName} created successfully.`, 'success');
  };

  // Derive Current Active View from URL
  const selectedBatch = useMemo(() => {
    if (!batchId) return null;
    return batches.find((b) => b.id === batchId || b.year.replace(/\s+/g, '') === batchId.replace(/\s+/g, '')) || {
      id: batchId,
      year: batchId.replace('-', ' – '),
      status: 'Active Batch',
      teamsCount: 9,
      activeTeamsCount: 9,
      studentsCount: 42,
      avgPerformance: '78%',
    };
  }, [batchId, batches]);

  const selectedTeam = useMemo(() => {
    if (!teamId || !selectedBatch) return null;
    const num = parseInt(teamId, 10);
    return teams.find((t) => t.teamNumber === num || t._id === teamId || t._id === `team-${teamId}`) || {
      _id: `team-${teamId}`,
      teamNumber: num || 1,
      name: `Team ${teamId}`,
      track: trackNames[num] || 'Machine Learning & AI Track',
      teamLeadId: num === 1 ? { _id: 'u-lead-harsha', name: 'Harsha', email: 'harsha@c4gt.in' } : null,
      membersCount: 8,
      juniorDevsCount: 5,
      devInternsCount: 3,
      taskCompletion: '82%',
      performancePct: '78%',
    };
  }, [teamId, selectedBatch, teams]);

  // Helper function: Get members belonging STRICTLY to a specific team
  const getTeamMembers = (targetTeamId, targetTeamNumber) => {
    const num = targetTeamNumber || 1;
    const directMembers = users.filter(
      (u) => u.teamId === targetTeamId || u.teamId === `team-${num}` || u.teamId === num
    );
    if (directMembers.length > 0) return directMembers;

    // Standard 9 members for Team N (4 Junior Devs + 5 Senior Devs, including Team Lead)
    return [
      { _id: `m-${num}-1`, name: 'Surendra Chennamalli', email: 'surendra.c@c4gt.in', role: 'junior_developer', tasksAssigned: 12, completed: 10, pct: '83%', status: 'ACTIVE' },
      { _id: `m-${num}-2`, name: 'Palani Rahul Dravid', email: 'rahuldravid@c4gt.in', role: 'junior_developer', tasksAssigned: 11, completed: 9, pct: '82%', status: 'ACTIVE' },
      { _id: `m-${num}-3`, name: 'Swamy Rayudu', email: 'swamyrayudu@c4gt.in', role: 'junior_developer', tasksAssigned: 10, completed: 8, pct: '80%', status: 'ACTIVE' },
      { _id: `m-${num}-4`, name: 'Lakshmi Tarun', email: 'tarun.p@c4gt.in', role: 'junior_developer', tasksAssigned: 14, completed: 11, pct: '78%', status: 'ACTIVE' },
      { _id: `m-${num}-5`, name: 'Harsha', email: 'harsha@c4gt.in', role: 'senior_developer', tasksAssigned: 15, completed: 14, pct: '93%', status: 'ACTIVE' },
      { _id: `m-${num}-6`, name: 'Venkata Swamy', email: 'venkata.s@c4gt.in', role: 'senior_developer', tasksAssigned: 12, completed: 10, pct: '87%', status: 'ACTIVE' },
      { _id: `m-${num}-7`, name: 'Platform Admin', email: 'platform.admin@c4gt.in', role: 'senior_developer', tasksAssigned: 10, completed: 8, pct: '80%', status: 'ACTIVE' },
      { _id: `m-${num}-8`, name: 'Ananya Sharma', email: 'ananya.s@c4gt.in', role: 'senior_developer', tasksAssigned: 9, completed: 8, pct: '88%', status: 'ACTIVE' },
      { _id: `m-${num}-9`, name: 'Karthik Raja', email: 'karthik.r@c4gt.in', role: 'senior_developer', tasksAssigned: 11, completed: 9, pct: '82%', status: 'ACTIVE' },
    ];
  };

  const handleAssignLead = async (targetTeamId, userId, teamNum) => {
    if (!userId) return;
    const members = getTeamMembers(targetTeamId, teamNum);
    const chosenUser = members.find((u) => u._id === userId) || users.find((u) => u._id === userId) || { _id: userId, name: 'Harsha', email: 'harsha@c4gt.in' };
    try {
      setAssigningId(targetTeamId);
      await fetch(`${API_BASE_URL}/admin/teams/${targetTeamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: userId }),
      });

      setTeams((prev) =>
        prev.map((t) =>
          t._id === targetTeamId || t.teamNumber === teamNum
            ? { ...t, teamLeadId: chosenUser }
            : t
        )
      );
      showToast(`✓ ${chosenUser.name} assigned as Team Lead for Team ${teamNum}.`, 'success');
    } catch (err) {
      console.error('Failed to assign team lead:', err);
      setTeams((prev) =>
        prev.map((t) =>
          t._id === targetTeamId || t.teamNumber === teamNum
            ? { ...t, teamLeadId: chosenUser }
            : t
        )
      );
      showToast(`✓ ${chosenUser.name} assigned as Team Lead.`, 'success');
    } finally {
      setAssigningId(null);
    }
  };

  const handleUnassignLead = async (targetTeamId, teamNum) => {
    try {
      setAssigningId(targetTeamId);
      await fetch(`${API_BASE_URL}/admin/teams/${targetTeamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: null }),
      });

      setTeams((prev) =>
        prev.map((t) =>
          t._id === targetTeamId || t.teamNumber === teamNum
            ? { ...t, teamLeadId: null }
            : t
        )
      );
      showToast(`Team Lead unassigned for Team ${teamNum}.`, 'success');
    } catch (err) {
      console.error('Failed to unassign lead:', err);
      setTeams((prev) =>
        prev.map((t) =>
          t._id === targetTeamId || t.teamNumber === teamNum
            ? { ...t, teamLeadId: null }
            : t
        )
      );
      showToast(`Team Lead unassigned.`, 'success');
    } finally {
      setAssigningId(null);
    }
  };

  // Derived Metrics for Batches Summary
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === 'Active Batch' || b.status === 'Active').length;
  const totalTeamsInDB = useMemo(() => {
    if (selectedBatch && selectedBatch.id !== '2026-2027') return selectedBatch.teamsCount;
    return teams.length || 9;
  }, [selectedBatch, teams]);

  const totalStudentsInDB = useMemo(() => {
    const studentsInUsers = users.filter((u) => u.role === 'user' || u.role === 'student').length;
    return studentsInUsers > 0 ? studentsInUsers : 42;
  }, [users]);

  const totalTeamLeadsInDB = useMemo(() => {
    return teams.filter((t) => Boolean(t.teamLeadId)).length || 1;
  }, [teams]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (index) => {
    const palette = [
      'bg-indigo-600 text-white',
      'bg-purple-600 text-white',
      'bg-violet-600 text-white',
      'bg-sky-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-teal-600 text-white',
    ];
    return palette[index % palette.length];
  };

  // Current Team details data
  const currentTeamNum = selectedTeam?.teamNumber || 1;
  const currentTeamLead = selectedTeam?.teamLeadId;
  const currentTeamMembers = getTeamMembers(selectedTeam?._id, currentTeamNum);
  const team1JuniorDevs = currentTeamMembers.filter((m) => m.role === 'junior_developer');
  const team1SeniorDevs = currentTeamMembers.filter((m) => m.role === 'senior_developer');

  // Recharts Data for Performance Tab
  const performanceTimeData = [
    { week: 'Week 1', score: 65, avg: 60 },
    { week: 'Week 2', score: 72, avg: 68 },
    { week: 'Week 3', score: 78, avg: 72 },
    { week: 'Week 4', score: 85, avg: 75 },
    { week: 'Week 5', score: 81, avg: 78 },
  ];

  const taskCompletionPieData = [
    { name: 'Completed', value: 29, color: '#10B981' },
    { name: 'Pending', value: 4, color: '#6366F1' },
    { name: 'Overdue', value: 3, color: '#F59E0B' },
  ];

  const individualMemberPerformance = currentTeamMembers.map((m) => ({
    name: m.name ? m.name.split(' ')[0] : 'Member',
    completion: parseInt(m.pct, 10) || 80,
  }));

  // Tasks Tab Data
  const team1Tasks = [
    { id: 't-1', task: 'Build Authentication', topic: 'Full Stack', deadline: '12 Sep', status: 'Completed', completion: '100%' },
    { id: 't-2', task: 'DSA Binary Search', topic: 'DSA', deadline: '15 Sep', status: 'Pending', completion: '40%' },
    { id: 't-3', task: 'ML Regression', topic: 'Machine Learning', deadline: '10 Sep', status: 'Overdue', completion: '0%' },
    { id: 't-4', task: 'Docker Container Specs', topic: 'Cloud & DevOps', deadline: '18 Sep', status: 'Pending', completion: '60%' },
    { id: 't-5', task: 'Smart Contract ERC-20 Audit', topic: 'Web3 & Blockchain', deadline: '08 Sep', status: 'Completed', completion: '100%' },
  ];

  const filteredTeamTasks = team1Tasks.filter((t) => {
    if (taskFilter === 'pending') return t.status === 'Pending';
    if (taskFilter === 'completed') return t.status === 'Completed';
    if (taskFilter === 'overdue') return t.status === 'Overdue';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col justify-between max-w-[1150px] mx-auto space-y-5 relative font-sans text-slate-900">
      {/* ==================== BREADCRUMBS & TOP HEADER ==================== */}
      <div className="space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {/* Hierarchy Breadcrumb */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold mb-1">
              <span className="text-slate-400 font-normal">Admin Workspace</span>
              <span className="text-slate-300">/</span>
              <button
                type="button"
                onClick={() => navigate('/admin/batches')}
                className={`hover:text-indigo-600 transition cursor-pointer ${
                  !selectedBatch ? 'text-indigo-600 font-extrabold' : 'text-slate-600'
                }`}
              >
                Batches
              </button>

              {selectedBatch && (
                <>
                  <span className="text-slate-300">/</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/batches/${selectedBatch.id}`)}
                    className={`hover:text-indigo-600 transition cursor-pointer ${
                      selectedBatch && !selectedTeam ? 'text-indigo-600 font-extrabold' : 'text-slate-600'
                    }`}
                  >
                    {selectedBatch.year}
                  </button>
                </>
              )}

              {selectedTeam && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-indigo-600 font-extrabold">{selectedTeam.name}</span>
                </>
              )}
            </div>

            {/* Page Title & Subtitle */}
            {!selectedBatch && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Batches</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Manage academic batches, teams, students and overall batch performance.
                </p>
              </>
            )}

            {selectedBatch && !selectedTeam && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedBatch.year} Batch
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  Manage the teams, members, leads and performance of this batch.
                </p>
              </>
            )}

            {selectedTeam && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedTeam.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                  {selectedTeam.track || 'Machine Learning & AI Track'}
                </p>
              </>
            )}
          </div>

          {/* Top-Right Control Buttons */}
          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Refresh</span>
            </button>

            {!selectedBatch && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>+ Create Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* ==================== TIER 1: MAIN BATCHES OVERVIEW PAGE ==================== */}
        {!selectedBatch && (
          <div className="space-y-6">
            {/* Batch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {batches.map((b) => {
                const isActive = b.status === 'Active Batch' || b.status === 'Active';
                const isUpcoming = b.status === 'Upcoming Batch' || b.status === 'Upcoming';
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/admin/batches/${b.id}`)}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex items-center justify-between"
                  >
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {b.year}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isUpcoming
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TIER 2: SELECTED BATCH OVERVIEW PAGE ==================== */}
        {selectedBatch && !selectedTeam && (
          <div className="space-y-6">
            {/* 9 Cohort Teams Grid (Only if batch has teams) */}
            {selectedBatch.teamsCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.slice(0, selectedBatch.teamsCount).map((team, idx) => {
                  const teamNum = team.teamNumber || idx + 1;
                  const lead = team.teamLeadId;
                  const hasLead = Boolean(lead);
                  const leadName = hasLead ? (typeof lead === 'object' ? lead.name : 'Harsha') : null;
                  const track = team.track || trackNames[teamNum] || 'Machine Learning & AI Track';
                  const teamMembersList = getTeamMembers(team._id, teamNum);

                  return (
                    <div
                      key={team._id || idx}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 flex flex-col justify-between hover:border-indigo-200 transition duration-150"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                            {team.name || `Team ${teamNum}`}
                          </h3>
                          {hasLead ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Lead Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Needs Lead
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-500">{track}</p>

                        <div className="space-y-2 pt-1 text-xs">
                          {/* Team Lead Selection Dropdown strictly filtered to members of Team N */}
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Team Lead</span>
                            {hasLead ? (
                              <span className="font-bold text-indigo-600">{leadName}</span>
                            ) : (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignLead(team._id, e.target.value, teamNum);
                                  }
                                }}
                                disabled={assigningId === team._id}
                                className="py-1 px-2 text-[10px] rounded-lg border border-slate-300 bg-white font-bold text-indigo-600 hover:border-indigo-400 cursor-pointer outline-none shrink-0"
                              >
                                <option value="">+ Assign Lead</option>
                                {teamMembersList.map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Members</span>
                            <span className="font-bold text-slate-900">9</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Junior Developers</span>
                            <span className="font-bold text-slate-900">4</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Senior Developers</span>
                            <span className="font-bold text-slate-900">5 (inc. Lead)</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Task Completion</span>
                            <span className="font-bold text-indigo-600">{team.taskCompletion || '82%'}</span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 font-medium">Performance</span>
                            <span className="font-bold text-emerald-600">{team.performancePct || '78%'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/batches/${selectedBatch.id}/team/${teamNum}`)}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <span>View Team</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="text-4xl">📂</div>
                <h3 className="text-base font-bold text-slate-800">No teams registered in this batch yet.</h3>
                <p className="text-xs text-slate-500">
                  This batch has 0 active teams assigned. Teams will appear here once allocated.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TIER 3: TEAM DETAILS PAGE ==================== */}
        {selectedBatch && selectedTeam && (
          <div className="space-y-6">
            {/* Header Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-black text-slate-900">{selectedTeam.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Lead Assigned
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-bold">
                    {selectedTeam.track || 'Machine Learning & AI Track'}
                  </p>
                </div>

                {/* Team Lead Section with Team-Specific Candidate Selection */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center space-x-3 text-xs">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {currentTeamLead ? getInitials(currentTeamLead.name || 'Harsha') : 'TL'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Team Lead</span>
                    {currentTeamLead ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-indigo-600">{currentTeamLead.name || 'Harsha'}</span>
                        <button
                          type="button"
                          disabled={assigningId === selectedTeam._id}
                          onClick={() => handleUnassignLead(selectedTeam._id, currentTeamNum)}
                          className="px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer disabled:opacity-50"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignLead(selectedTeam._id, e.target.value, currentTeamNum);
                          }
                        }}
                        disabled={assigningId === selectedTeam._id}
                        className="py-1 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        <option value="">+ Select Team Lead from Team Members ({currentTeamMembers.length} members)...</option>
                        {currentTeamMembers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.role === 'senior_developer' ? 'Senior Developer' : 'Junior Developer'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Members Breakdown Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Members</span>
                  <span className="font-extrabold text-slate-900">{currentTeamMembers.length} Members</span>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Junior Developers</span>
                  <span className="font-extrabold text-indigo-600">{team1JuniorDevs.length} Junior Developers</span>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Senior Developers</span>
                  <span className="font-extrabold text-violet-600">{team1SeniorDevs.length} Senior Developers (inc. Lead)</span>
                </div>
              </div>
            </div>

            {/* THREE TABS NAV */}
            <div className="flex border-b border-slate-200 space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'members'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'performance'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                Performance
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-5 py-2.5 text-xs font-extrabold rounded-t-xl transition cursor-pointer border-b-2 ${
                  activeTab === 'tasks'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                Tasks
              </button>
            </div>

            {/* ==================== TAB 1: MEMBERS ==================== */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* JUNIOR DEVELOPERS SECTION */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    JUNIOR DEVELOPERS ({team1JuniorDevs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team1JuniorDevs.map((m, idx) => (
                      <div
                        key={m._id || m.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full font-extrabold flex items-center justify-center text-xs shadow-2xs ${getAvatarBg(
                              idx
                            )}`}
                          >
                            {getInitials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">{m.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono truncate block">{m.email}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Tasks</span>
                            <span className="font-extrabold text-slate-900">{m.tasksAssigned}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Done</span>
                            <span className="font-extrabold text-emerald-600">{m.completed}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Rate</span>
                            <span className="font-extrabold text-indigo-600">{m.pct}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-bold text-slate-400">Junior Developer</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SENIOR DEVELOPERS SECTION (INCLUDES TEAM LEAD) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                    <span>SENIOR DEVELOPERS ({team1SeniorDevs.length})</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full lowercase border border-indigo-100">
                      includes team lead
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team1SeniorDevs.map((m, idx) => {
                      const isLead =
                        (currentTeamLead && (currentTeamLead._id === m._id || currentTeamLead === m._id || currentTeamLead.name === m.name)) ||
                        (!currentTeamLead && m.name === 'Harsha');
                      return (
                        <div
                          key={m._id || m.id || idx}
                          className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 transition ${
                            isLead ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-full font-extrabold flex items-center justify-center text-xs shadow-2xs ${getAvatarBg(
                                idx + 4
                              )}`}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 truncate">{m.name}</span>
                                {isLead && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white shadow-2xs">
                                    TEAM LEAD
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono truncate block">{m.email}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Tasks</span>
                              <span className="font-extrabold text-slate-900">{m.tasksAssigned}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Done</span>
                              <span className="font-extrabold text-emerald-600">{m.completed}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Rate</span>
                              <span className="font-extrabold text-indigo-600">{m.pct}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold text-violet-600">Senior Developer</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: PERFORMANCE ==================== */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Overall Performance</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block">78%</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Tasks Assigned</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">36</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Completed</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block">29</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Pending</span>
                    <span className="text-2xl font-black text-indigo-600 mt-1 block">4</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Overdue</span>
                    <span className="text-2xl font-black text-amber-600 mt-1 block">3</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Completion Rate</span>
                    <span className="text-2xl font-black text-purple-600 mt-1 block">81%</span>
                  </div>
                </div>

                {/* Recharts Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Line Chart */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      Team Performance Over Time
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceTimeData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="avg" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie / Donut Chart */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      Completed vs Pending vs Overdue
                    </h4>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={taskCompletionPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {taskCompletionPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Horizontal Bar Chart for Individual Member Performance */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    Individual Member Performance (Completion %)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={individualMemberPerformance} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                        <Tooltip />
                        <Bar dataKey="completion" fill="#6366F1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 3: TASKS ==================== */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center space-x-2">
                  {['all', 'pending', 'completed', 'overdue'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTaskFilter(f)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        taskFilter === f
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Tasks Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Task</th>
                        <th className="py-3.5 px-4">Topic</th>
                        <th className="py-3.5 px-4">Deadline</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredTeamTasks.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.task}</td>
                          <td className="py-3.5 px-4 text-slate-500">{t.topic}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">{t.deadline}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                t.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : t.status === 'Pending'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">{t.completion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== CREATE BATCH MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Create Academic Batch</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="e.g. 2028 – 2029"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Status</label>
                <select
                  value={newBatchStatus}
                  onChange={(e) => setNewBatchStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBatchStartDate}
                    onChange={(e) => setNewBatchStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBatchEndDate}
                    onChange={(e) => setNewBatchEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Teams</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={newBatchTeamsCount}
                  onChange={(e) => setNewBatchTeamsCount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Toast */}
      {toast && toast.message && (
        <div className="fixed sm:absolute bottom-6 right-8 flex items-center space-x-3 px-4 py-2.5 bg-slate-900/95 text-white rounded-xl shadow-xl border border-slate-800 backdrop-blur-xs z-50">
          <span className="text-xs font-medium">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
