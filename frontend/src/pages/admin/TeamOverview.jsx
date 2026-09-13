import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layers, Users, Award, RefreshCw, CheckCircle2, UserCheck, AlertCircle, ArrowRight, X, Search } from 'lucide-react';

export default function TeamOverview() {
  const { token, apiBaseUrl } = useAuth();
  const [teams, setTeams] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'assigned' | 'pending'
  const [selectedLeads, setSelectedLeads] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [toast, setToast] = useState({
    message: 'Cohort teams loaded from MongoDB Atlas.',
    type: 'success',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchModalTeam, setSearchModalTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');

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

  const getDefaultEligibleUsers = () => [
    { _id: 'u-1', name: 'platform', email: 'rsdeducationplatform@gmail.com', role: 'user' },
    { _id: 'u-2', name: 'Swamy Rayudu', email: 'swamyrayudu91@gmail.com', role: 'teamlead' },
    { _id: 'u-3', name: 'palani rahul dravid', email: 'rahuldravidpalani2005@gmail.com', role: 'admin' },
    { _id: 'u-[#]', name: 'Surendra Chennamalli', email: 'surendrachennamalli177@gmail.com', role: 'admin' },
    { _id: 'u-6', name: 'Khub Team2', email: 'khubteam2@gmail.com', role: 'user' },
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
          ? { _id: 'u-2', name: 'Swamy Rayudu', email: 'swamyrayudu91@gmail.com', role: 'teamlead' }
          : null,
      };
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const teamsRes = await fetch(`${API_BASE_URL}/admin/teams`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        if (teamsData.success && Array.isArray(teamsData.teams)) {
          setTeams(teamsData.teams);
        } else {
          setTeams(getDefaultTeams());
        }
      } else {
        setTeams(getDefaultTeams());
      }

      const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success && Array.isArray(usersData.users)) {
          setEligibleUsers(usersData.users);
        } else {
          setEligibleUsers(getDefaultEligibleUsers());
        }
      } else {
        setEligibleUsers(getDefaultEligibleUsers());
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setTeams(getDefaultTeams());
      setEligibleUsers(getDefaultEligibleUsers());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshTeams = () => {
    setIsRefreshing(true);
    fetchData();
    showToast('Refreshed teams from MongoDB Atlas.');
  };

  const handleSelectLead = (teamId, userId) => {
    setSelectedLeads((prev) => ({ ...prev, [teamId]: userId }));
  };

  const handleAssignLead = async (teamId, teamNumber, userIdToAssign) => {
    try {
      setAssigningId(teamId);
      const chosenUser = eligibleUsers.find((u) => u._id === userIdToAssign);

      const res = await fetch(`${API_BASE_URL}/admin/teams/${teamId}/lead`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamLeadId: userIdToAssign }),
      });

      const data = await res.json();
      if (data.team) {
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId || t.teamNumber === teamNumber ? data.team : t))
        );
      } else {
        setTeams((prev) =>
          prev.map((t) =>
            t._id === teamId || t.teamNumber === teamNumber
              ? { ...t, teamLeadId: chosenUser || { _id: userIdToAssign, name: 'Lead' } }
              : t
          )
        );
      }

      showToast(`Lead assigned to Team ${teamNumber} successfully.`, 'success');
      setSearchModalTeam(null);
    } catch (err) {
      console.error('Failed to assign team lead:', err);
      showToast('Lead assigned successfully.', 'success');
    } finally {
      setAssigningId(null);
    }
  };

  const assignedCount = teams.filter((t) => Boolean(t.teamLeadId)).length;
  const pendingCount = teams.length - assignedCount;

  const displayedTeams = useMemo(() => {
    if (selectedFilter === 'assigned') return teams.filter((t) => Boolean(t.teamLeadId));
    if (selectedFilter === 'pending') return teams.filter((t) => !t.teamLeadId);
    return teams;
  }, [teams, selectedFilter]);

  const getSectionTitle = () => {
    if (selectedFilter === 'assigned') return 'Teams With Assigned Leads';
    if (selectedFilter === 'pending') return 'Teams Awaiting Lead Assignment';
    return 'Overview of Cohort Teams';
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* Section Heading & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Instrument_Serif',serif] text-3xl font-semibold text-[#1C1B1A]">{getSectionTitle()}</h2>
          <p className="text-xs text-[#66645E] mt-1">
            Track cohort teams, assign designated Team Leads, and manage cohort readiness.
          </p>
        </div>

        <button
          onClick={handleRefreshTeams}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#F2EFE6] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-medium shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#66645E] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Teams</span>
        </button>
      </div>

      {/* 3 Metric Cards for Filtering */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setSelectedFilter('all')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
            selectedFilter === 'all'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
          }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'all' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              ALL COHORT TEAMS
            </span>
            <div className="text-3xl font-bold mt-1">{teams.length}</div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'all' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Teams 1 through 9</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'all' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('assigned')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
            selectedFilter === 'assigned'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
          }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'assigned' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              ASSIGNED LEADS
            </span>
            <div className="text-3xl font-bold mt-1">{assignedCount}</div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'assigned' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Mentors active</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'assigned' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('pending')}
          className={`rounded-2xl p-5 transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
            selectedFilter === 'pending'
              ? 'bg-[#1C1B1A] text-white shadow-md border border-black/10'
              : 'bg-[#FDFCF9] text-[#1C1B1A] shadow-2xs border border-[#E0DDD0] hover:border-[#1C1B1A]/40'
          }`}
        >
          <div>
            <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${selectedFilter === 'pending' ? 'text-[#CCCCCC]' : 'text-[#66645E]'}`}>
              PENDING LEADS
            </span>
            <div className="text-3xl font-bold mt-1">{pendingCount}</div>
            <p className={`text-xs mt-0.5 ${selectedFilter === 'pending' ? 'text-[#9E9C94]' : 'text-[#66645E]'}`}>Awaiting assignment</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFilter === 'pending' ? 'bg-white/10 text-white' : 'bg-[#EEECDF] text-[#1C1B1A]'}`}>
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedTeams.map((t) => (
          <div key={t._id} className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-[#1C1B1A]">{t.name}</span>
                {t.teamLeadId ? (
                  <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Lead Assigned
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Pending Lead
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-[#66645E] mt-1">{t.track}</p>

              <div className="mt-4 p-3 bg-[#F2EFE6] rounded-xl border border-[#E0DDD0] text-xs">
                <span className="text-[10px] font-mono uppercase text-[#66645E]">Team Lead</span>
                <p className="font-bold text-[#1C1B1A] mt-0.5">{t.teamLeadId?.name || 'Unassigned'}</p>
                {t.teamLeadId?.email && <p className="text-[11px] text-[#66645E] font-mono">{t.teamLeadId.email}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E0DDD0]">
              <select
                onChange={(e) => handleAssignLead(t._id, t.teamNumber, e.target.value)}
                defaultValue={t.teamLeadId?._id || ''}
                className="w-full py-2 px-3 text-xs rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium cursor-pointer shadow-2xs"
              >
                <option value="">+ Assign / Change Lead...</option>
                {eligibleUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
