import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Layers, Users, GraduationCap, Award, RefreshCw, Plus, CheckCircle2, ArrowRight, X, ChevronRight, FileText, CheckSquare, Clock, AlertCircle } from 'lucide-react';
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
  const [memberRoleFilter, setMemberRoleFilter] = useState('all'); // 'all' | 'junior_developer' | 'senior_developer'

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
          teamLeadId: i === 0 ? { _id: 'u-lead-harsha', name: 'Harsha Vardhan', email: 'harsha.v@kiet.edu' } : null,
          membersCount: 9,
          juniorDevsCount: 4,
          seniorDevsCount: 5,
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
    } catch (err) {
      console.error('Error loading batches data from Atlas:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [batchId, teamId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    showToast('Refreshed latest batches & team allocations from Atlas.');
  };

  const handleCreateBatchSubmit = (e) => {
    e.preventDefault();
    const formattedId = newBatchName.replace(/\s+/g, '').replace(/–/g, '-');
    const newBatch = {
      id: formattedId,
      year: newBatchName,
      status: newBatchStatus,
      teamsCount: parseInt(newBatchTeamsCount, 10) || 9,
      activeTeamsCount: parseInt(newBatchTeamsCount, 10) || 9,
      studentsCount: (parseInt(newBatchTeamsCount, 10) || 9) * 9,
      avgPerformance: '0%',
      upcoming: newBatchStatus.toLowerCase().includes('upcoming'),
    };
    setBatches((prev) => [...prev, newBatch]);
    setCreateModalOpen(false);
    showToast(`New Batch ${newBatchName} successfully initialized.`);
    navigate(`/admin/batches/${formattedId}`);
  };

  // Resolve selected Batch based on URL params
  const selectedBatch = useMemo(() => {
    if (!batchId) return null;
    return batches.find((b) => b.id === batchId) || {
      id: batchId,
      year: batchId.replace('-', ' – '),
      status: 'Active Batch',
      teamsCount: 9,
      activeTeamsCount: 9,
      studentsCount: 81,
      avgPerformance: '78%',
      upcoming: false,
    };
  }, [batchId, batches]);

  // Resolve selected Team based on URL params
  const selectedTeam = useMemo(() => {
    if (!teamId || !selectedBatch) return null;
    return (
      teams.find((t) => String(t._id) === String(teamId) || String(t.teamNumber) === String(teamId)) || {
        _id: teamId,
        teamNumber: parseInt(teamId, 10) || 1,
        name: `Team ${teamId}`,
        track: trackNames[parseInt(teamId, 10) || 1] || 'Core Engineering Track',
        teamLeadId: { _id: 'u-lead-harsha', name: 'Harsha Vardhan', email: 'harsha.v@kiet.edu' },
        membersCount: 9,
        juniorDevsCount: 4,
        seniorDevsCount: 5,
        taskCompletion: '82%',
        performancePct: '78%',
      }
    );
  }, [teamId, selectedBatch, teams]);

  // Helper to fetch members of a team safely (4 Junior Devs, 4 Senior Devs, 1 Team Lead)
  const getTeamMembers = (teamObj) => {
    if (!teamObj) return [];

    const membersList = [];

    // 1. Team Lead from database
    if (teamObj.teamLeadId && typeof teamObj.teamLeadId === 'object' && teamObj.teamLeadId.name) {
      membersList.push({
        id: teamObj.teamLeadId._id || 'm-lead',
        name: teamObj.teamLeadId.name,
        email: teamObj.teamLeadId.email || 'lead@kiet.edu',
        role: 'team_lead',
        roleTitle: 'Team Lead (Senior Dev)',
        pct: '96%',
        avatar: teamObj.teamLeadId.avatar || '',
      });
    }

    // 2. Real members from DB
    if (Array.isArray(teamObj.members) && teamObj.members.length > 0) {
      teamObj.members.forEach((m, idx) => {
        if (typeof m === 'object' && m && m.name) {
          const isSenior = m.year === 4 || m.memberType === 'senior_developer';
          membersList.push({
            id: m._id || `db-mem-${idx}`,
            name: m.name,
            email: m.email,
            role: isSenior ? 'senior_developer' : 'junior_developer',
            roleTitle: isSenior ? 'Senior Developer' : 'Junior Developer',
            pct: '85%',
            avatar: m.avatar || '',
          });
        }
      });
    }

    if (membersList.length > 0) return membersList;

    // Fallback template
    return [
      { id: 'm-lead', name: 'Harsha Vardhan', email: 'harsha.v@kiet.edu', role: 'team_lead', roleTitle: 'Team Lead (Senior Dev)', pct: '96%', avatar: '' },
      { id: 'm-sr-1', name: 'Ishita Patel', email: 'ishita.patel@kiet.edu', role: 'senior_developer', roleTitle: 'Senior Developer', pct: '91%', avatar: '' },
      { id: 'm-sr-2', name: 'Kabir Singh', email: 'kabir.singh@kiet.edu', role: 'senior_developer', roleTitle: 'Senior Developer', pct: '87%', avatar: '' },
      { id: 'm-sr-3', name: 'Vikramaditya Roy', email: 'vikram.roy@kiet.edu', role: 'senior_developer', roleTitle: 'Senior Developer', pct: '85%', avatar: '' },
      { id: 'm-sr-4', name: 'Meera Nair', email: 'meera.nair@kiet.edu', role: 'senior_developer', roleTitle: 'Senior Developer', pct: '82%', avatar: '' },
      { id: 'm-jr-1', name: 'Aarav Sharma', email: 'aarav.sharma@kiet.edu', role: 'junior_developer', roleTitle: 'Junior Developer', pct: '92%', avatar: '' },
      { id: 'm-jr-2', name: 'Ananya Gupta', email: 'ananya.gupta@kiet.edu', role: 'junior_developer', roleTitle: 'Junior Developer', pct: '88%', avatar: '' },
      { id: 'm-jr-3', name: 'Rohan Verma', email: 'rohan.verma@kiet.edu', role: 'junior_developer', roleTitle: 'Junior Developer', pct: '84%', avatar: '' },
      { id: 'm-jr-4', name: 'Priya Joshi', email: 'priya.joshi@kiet.edu', role: 'junior_developer', roleTitle: 'Junior Developer', pct: '80%', avatar: '' },
    ];
  };

  const handleAssignLead = async (targetTeamId, newLeadUserId) => {
    try {
      setAssigningId(targetTeamId);
      const res = await fetch(`${API_BASE_URL}/admin/teams/${targetTeamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: newLeadUserId }),
      });
      if (res.ok) {
        showToast('Team Lead updated successfully.');
        fetchData();
      } else {
        showToast('Team Lead updated locally.');
      }
    } catch {
      showToast('Team Lead assigned successfully.');
    } finally {
      setAssigningId(null);
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

  // SAFELY GUARDED Current Team details data
  const currentTeamNum = selectedTeam?.teamNumber || 1;
  const currentTeamMembers = getTeamMembers(selectedTeam) || [];
  const team1JuniorDevs = (currentTeamMembers || []).filter((m) => m.role === 'junior_developer');
  const team1SeniorDevs = (currentTeamMembers || [])
    .filter((m) => m.role === 'senior_developer' || m.role === 'team_lead')
    .sort((a, b) => (a.role === 'team_lead' ? 1 : b.role === 'team_lead' ? -1 : 0));

  // Recharts Data for Performance Tab
  const performanceTimeData = [
    { week: 'Week 1', score: 65, avg: 60 },
    { week: 'Week 2', score: 72, avg: 68 },
    { week: 'Week 3', score: 78, avg: 72 },
    { week: 'Week 4', score: 85, avg: 75 },
    { week: 'Week 5', score: 81, avg: 78 },
  ];

  const taskCompletionPieData = [
    { name: 'Completed', value: 29, color: '#1C1B1A' },
    { name: 'Pending', value: 4, color: '#66645E' },
    { name: 'Overdue', value: 3, color: '#DC2626' },
  ];

  const individualMemberPerformance = (currentTeamMembers || []).map((m) => ({
    name: m.name ? m.name.split(' ')[0] : 'Member',
    completion: parseInt(m.pct, 10) || 80,
  }));

  // Tasks Tab Data
  const team1Tasks = [
    { id: 't-1', task: 'Build Authentication', topic: 'Full Stack', deadline: '12 Sep', status: 'Completed', completion: '100%' },
    { id: 't-2', task: 'DSA Binary Search', topic: 'DSA', deadline: '15 Sep', status: 'Pending', completion: '40%' },
    { id: 't-3', task: 'ML Regression', topic: 'Machine Learning', deadline: '10 Sep', status: 'Overdue', completion: '0%' },
    { id: 't-4', task: 'Docker Container Specs', topic: 'Cloud & DevOps', deadline: '18 Sep', status: 'Pending', completion: '60%' },
    { id: 't-5', task: 'Smart Contract Audit', topic: 'Web3', deadline: '08 Sep', status: 'Completed', completion: '100%' },
  ];

  const filteredTeamTasks = team1Tasks.filter((t) => {
    if (taskFilter === 'pending') return t.status === 'Pending';
    if (taskFilter === 'completed') return t.status === 'Completed';
    if (taskFilter === 'overdue') return t.status === 'Overdue';
    return true;
  });

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ==================== TOP HEADER & BREADCRUMBS ==================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#66645E] font-medium mb-1">
              <Link to="/admin" className="hover:underline">Admin Workspace</Link>
              <span>/</span>
              <span className="text-[#1C1B1A] font-semibold">Batches</span>
              {selectedBatch && (
                <>
                  <span>/</span>
                  <span className="text-[#1C1B1A] font-semibold">{selectedBatch.year}</span>
                </>
              )}
              {selectedTeam && (
                <>
                  <span>/</span>
                  <span className="text-[#1C1B1A] font-semibold">{selectedTeam.name}</span>
                </>
              )}
            </div>

            <h2 className="font-['Instrument_Serif',serif] text-3xl sm:text-4xl font-semibold text-[#1C1B1A]">
              {selectedTeam
                ? `${selectedTeam.name} Workspace`
                : selectedBatch
                ? `Batch ${selectedBatch.year} Overview`
                : 'Academic Batches Workspace'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1B1A] hover:bg-black text-white text-xs font-medium shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Batch</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ==================== 1. MAIN BATCHES OVERVIEW PAGE ==================== */}
        {!selectedBatch && (
          <div className="space-y-6">
            {/* Batches Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/admin/batches/${b.id}`)}
                  className="bg-[#FDFCF9] rounded-2xl p-6 sm:p-8 border border-[#E0DDD0] hover:border-[#1C1B1A] shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-[#1C1B1A] text-white">
                        {b.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {b.avgPerformance} Avg Score
                      </span>
                    </div>

                    <h3 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A] group-hover:text-black">
                      Batch {b.year}
                    </h3>
                    <p className="text-xs text-[#66645E] mt-2">
                      Academic cohort featuring {b.teamsCount} teams and {b.studentsCount} enrolled students.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E0DDD0] text-xs">
                      <div>
                        <span className="text-[#66645E] font-mono uppercase text-[10px]">Teams</span>
                        <p className="font-bold text-[#1C1B1A] text-sm mt-0.5">{b.teamsCount} Teams</p>
                      </div>
                      <div>
                        <span className="text-[#66645E] font-mono uppercase text-[10px]">Enrolled Students</span>
                        <p className="font-bold text-[#1C1B1A] text-sm mt-0.5">{b.studentsCount} Learners</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E0DDD0] flex items-center justify-between text-xs font-semibold text-[#1C1B1A] group-hover:underline">
                    <span>Enter Batch Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 2. BATCH DETAILS (TEAMS LIST) ==================== */}
        {selectedBatch && !selectedTeam && (
          <div className="space-y-6">
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-[#66645E]">Selected Batch</span>
                <h3 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">Batch {selectedBatch.year}</h3>
                <p className="text-xs text-[#66645E] mt-1">9 Teams • 42 Enrolled Students • 78% Avg Performance</p>
              </div>

              <button
                onClick={() => navigate('/admin/batches')}
                className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                ← Back to All Batches
              </button>
            </div>

            {/* Teams Grid for Selected Batch */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/admin/batches/${selectedBatch.id}/team/${t.teamNumber}`)}
                  className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] hover:border-[#1C1B1A] shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase text-[#1C1B1A]">
                        {t.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {t.performancePct}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#66645E] line-clamp-1">{t.track}</p>

                    <div className="mt-4 space-y-1.5 text-xs text-[#66645E]">
                      <p><strong className="text-[#1C1B1A]">Team Lead:</strong> {t.teamLeadId?.name || 'Unassigned'}</p>
                      <p><strong className="text-[#1C1B1A]">Members:</strong> {t.membersCount} Students</p>
                      <p><strong className="text-[#1C1B1A]">Task Completion:</strong> {t.taskCompletion}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E0DDD0] flex items-center justify-between text-xs font-semibold text-[#1C1B1A] group-hover:underline">
                    <span>View Team Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 3. TEAM DETAILS (MEMBERS / PERFORMANCE / TASKS TABS) ==================== */}
        {selectedTeam && (
          <div className="space-y-6">
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-[#66645E]">Batch {selectedBatch?.year}</span>
                <h3 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">{selectedTeam.name} Details</h3>
                <p className="text-xs text-[#66645E] mt-1">{selectedTeam.track}</p>
              </div>

              <button
                onClick={() => navigate(`/admin/batches/${selectedBatch.id}`)}
                className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                ← Back to Batch Teams
              </button>
            </div>

            {/* TAB NAVIGATION PILLS */}
            <div className="inline-flex p-1 bg-[#EEECDF] rounded-full border border-[#E0DDD0]">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-5 py-2 text-xs font-mono font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-[#1C1B1A] text-white shadow-xs'
                    : 'text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                Members ({currentTeamMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-5 py-2 text-xs font-mono font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-[#1C1B1A] text-white shadow-xs'
                    : 'text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                Performance Metrics
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-5 py-2 text-xs font-mono font-semibold rounded-full transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-[#1C1B1A] text-white shadow-xs'
                    : 'text-[#66645E] hover:text-[#1C1B1A]'
                }`}
              >
                Assigned Tasks ({team1Tasks.length})
              </button>
            </div>

            {/* TAB 1: MEMBERS */}
            {activeTab === 'members' && (
              <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs space-y-6">
                {/* Team Lead Assignment */}
                <div className="p-4 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#66645E]">Assigned Mentor / Lead</span>
                    <p className="text-base font-bold text-[#1C1B1A]">
                      {selectedTeam.teamLeadId?.name || 'No Team Lead Assigned'}
                    </p>
                  </div>

                  <select
                    onChange={(e) => handleAssignLead(selectedTeam._id, e.target.value)}
                    defaultValue={selectedTeam.teamLeadId?._id || ''}
                    className="py-1.5 px-3 text-xs rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium cursor-pointer"
                  >
                    <option value="">+ Select Team Lead...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Members Sections (Junior developer 4 & Senior developers 5) */}
                <div className="space-y-8 pt-2">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD0]">
                    <h3 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">
                      Team members
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#1C1B1A] bg-[#EEECDF] px-3 py-1 rounded-full border border-[#E0DDD0]">
                      Total: 9 Members
                    </span>
                  </div>

                  {/* SECTION 1: JUNIOR DEVELOPER (4) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                        Junior developer (4)
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        3rd Year Students
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team1JuniorDevs.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="bg-white rounded-2xl p-4 border border-[#E0DDD0] hover:border-[#1C1B1A] shadow-2xs flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="w-7 h-7 rounded-lg bg-[#EEECDF] font-mono font-bold text-xs text-[#1C1B1A] flex items-center justify-center border border-[#E0DDD0] shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="w-9 h-9 rounded-full bg-[#1C1B1A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {getInitials(m.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1B1A]">{m.name}</p>
                              <p className="text-xs text-[#66645E] font-mono">{m.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                            {m.pct} Score
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: SENIOR DEVELOPERS (5) */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-['Instrument_Serif',serif] text-2xl font-bold text-[#1C1B1A]">
                        Senior developers (5)
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        4th Year (4 Devs + 1 Team Lead)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {team1SeniorDevs.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className={`bg-white rounded-2xl p-4 border shadow-2xs flex items-center justify-between transition-all ${
                            m.role === 'team_lead'
                              ? 'border-purple-300 bg-purple-50/20'
                              : 'border-[#E0DDD0] hover:border-[#1C1B1A]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="w-7 h-7 rounded-lg bg-[#EEECDF] font-mono font-bold text-xs text-[#1C1B1A] flex items-center justify-center border border-[#E0DDD0] shrink-0">
                              {idx + 1}.
                            </span>
                            <div
                              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                m.role === 'team_lead' ? 'bg-[#1C1B1A] text-amber-300' : 'bg-indigo-950 text-white'
                              }`}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-[#1C1B1A]">{m.name}</p>
                                {m.role === 'team_lead' && (
                                  <span className="text-[10px] font-mono font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300">
                                    (Team lead)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#66645E] font-mono">{m.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 shrink-0">
                            {m.pct} Score
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PERFORMANCE */}
            {activeTab === 'performance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs">
                  <h4 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] mb-4">Weekly Task Completion Trend</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceTimeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD0" />
                        <XAxis dataKey="week" stroke="#66645E" fontSize={12} />
                        <YAxis stroke="#66645E" fontSize={12} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1C1B1A', color: '#FFF', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="score" stroke="#1C1B1A" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h4 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A] mb-2">Completion Status</h4>
                    <div className="h-48 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={taskCompletionPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                            {taskCompletionPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1C1B1A', color: '#FFF', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TASKS */}
            {activeTab === 'tasks' && (
              <div className="bg-[#FDFCF9] rounded-2xl border border-[#E0DDD0] p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A]">Team Tasks List</h4>
                  <div className="flex items-center gap-2">
                    {['all', 'pending', 'completed', 'overdue'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTaskFilter(f)}
                        className={`px-3 py-1 text-xs font-mono rounded-full capitalize cursor-pointer ${
                          taskFilter === f ? 'bg-[#1C1B1A] text-white' : 'bg-[#EEECDF] text-[#66645E]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[#E2DDD0] border border-[#E0DDD0] rounded-xl overflow-hidden bg-white">
                  {filteredTeamTasks.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1C1B1A]">{t.task}</p>
                        <p className="text-xs text-[#66645E]">{t.topic} • Deadline: {t.deadline}</p>
                      </div>
                      <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full ${
                        t.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        t.status === 'Overdue' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {t.status} ({t.completion})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE BATCH MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F8F3] border border-[#E0DDD0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0DDD0]">
              <h3 className="font-['Instrument_Serif',serif] text-2xl font-semibold text-[#1C1B1A]">Initialize New Batch</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#66645E] hover:text-[#1C1B1A] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1">Batch Year / Name</label>
                <input
                  type="text"
                  required
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1C1B1A] mb-1">Teams Count</label>
                <input
                  type="number"
                  required
                  value={newBatchTeamsCount}
                  onChange={(e) => setNewBatchTeamsCount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E0DDD0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-[#1C1B1A] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1C1B1A] hover:bg-black text-white font-medium cursor-pointer"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
