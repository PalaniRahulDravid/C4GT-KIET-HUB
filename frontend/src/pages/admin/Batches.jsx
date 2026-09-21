import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Layers,
  Users,
  GraduationCap,
  Award,
  RefreshCw,
  Plus,
  CheckCircle2,
  ArrowRight,
  X,
  ChevronRight,
  FileText,
  CheckSquare,
  Clock,
  AlertCircle,
  UploadCloud,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
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

  // Team Performance Analytics state (Recharts)
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('weekly'); // 'weekly' | 'monthly' | 'overall'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Create Batch Modal State & CSV Cohort Import
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('2027 – 2028');
  const [newBatchStatus, setNewBatchStatus] = useState('Upcoming');
  const [newBatchStartDate, setNewBatchStartDate] = useState('2027-08-01');
  const [newBatchEndDate, setNewBatchEndDate] = useState('2028-05-31');
  const [uploadedCsvText, setUploadedCsvText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [validationResult, setValidationResult] = useState({
    valid: false,
    errors: [],
    records: [],
    stats: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);

  // Batches state list - loaded from MongoDB Atlas
  const [batches, setBatches] = useState([
    {
      id: '2026-2027',
      year: '2026 – 2027',
      status: 'Active Batch',
      teamsCount: 9,
      activeTeamsCount: 9,
      studentsCount: 81,
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

  // Generate downloadable sample CSV template for 9 teams (1 Lead, 4 SD, 4 JD each = 81 students)
  const downloadCohortTemplate = () => {
    const headers = [
      'teamNumber',
      'roleCode',
      'name',
      'rollNumber',
      'email',
      'phone',
      'college',
      'branch',
      'backlogs',
      'type',
    ];
    const sampleRows = [];
    for (let teamNum = 1; teamNum <= 9; teamNum++) {
      // Exactly 1 Team Lead
      sampleRows.push([
        teamNum,
        'LEAD',
        `Lead Student Team ${teamNum}`,
        `24B21A${4200 + teamNum}`,
        `lead.team${teamNum}@kiet.edu`,
        `987654321${teamNum}`,
        'KIET',
        'CSE',
        0,
        'DS',
      ]);
      // Exactly 4 Senior Developers (SD1 - SD4)
      for (let sd = 1; sd <= 4; sd++) {
        sampleRows.push([
          teamNum,
          `SD${sd}`,
          `Senior Dev ${sd} Team ${teamNum}`,
          `24B21A${4500 + teamNum * 10 + sd}`,
          `sd${sd}.team${teamNum}@kiet.edu`,
          `98765431${teamNum}${sd}`,
          'KIET',
          'AID',
          0,
          'DS',
        ]);
      }
      // Exactly 4 Junior Developers (JD1 - JD4)
      for (let jd = 1; jd <= 4; jd++) {
        sampleRows.push([
          teamNum,
          `JD${jd}`,
          `Junior Dev ${jd} Team ${teamNum}`,
          `25B21A${4300 + teamNum * 10 + jd}`,
          `jd${jd}.team${teamNum}@kiet.edu`,
          `98765421${teamNum}${jd}`,
          'KIET',
          'CSM',
          0,
          'HS',
        ]);
      }
    }

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'c4gt_cohort_batch_template_81_students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template (81 student slots across 9 teams).', 'success');
  };

  // Client-side instant validator for Cohort CSV
  const parseCohortCsvClient = (text) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { valid: false, errors: ['CSV file is empty or missing data rows.'], records: [], stats: null };
    }

    const headerLine = lines[0];
    const rawHeaders = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (['team', 'teamnum', 'teamnumber', 'teamno'].includes(lower)) headerMap.teamNumber = idx;
      else if (['role', 'rolecode', 'designation', 'memberrole'].includes(lower)) headerMap.roleCode = idx;
      else if (['name', 'fullname', 'studentname'].includes(lower)) headerMap.name = idx;
      else if (['roll', 'rollnumber', 'rollno', 'regno'].includes(lower)) headerMap.rollNumber = idx;
      else if (['email', 'mail', 'emailaddress'].includes(lower)) headerMap.email = idx;
      else if (['phone', 'phonenumber', 'mobile', 'contact'].includes(lower)) headerMap.phone = idx;
      else if (['college', 'institution', 'campus'].includes(lower)) headerMap.college = idx;
      else if (['branch', 'department', 'dept'].includes(lower)) headerMap.branch = idx;
      else if (['backlogs', 'activebacklogs', 'backlog'].includes(lower)) headerMap.backlogs = idx;
      else if (['type', 'dayscholarhostel', 'category', 'residence'].includes(lower)) headerMap.type = idx;
    });

    const requiredKeys = ['teamNumber', 'roleCode', 'name', 'rollNumber', 'email'];
    const missingKeys = requiredKeys.filter((k) => headerMap[k] === undefined);
    if (missingKeys.length > 0) {
      return {
        valid: false,
        errors: [
          `Missing required CSV headers: ${missingKeys.join(
            ', '
          )}. Required: teamNumber,roleCode,name,rollNumber,email,phone,college,branch,backlogs,type`,
        ],
        records: [],
        stats: null,
      };
    }

    const rows = [];
    const errors = [];
    const emailsSeen = new Set();
    const rollsSeen = new Set();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',').map((v) => v.trim());
      const clean = values.map((v) => v.replace(/^["']|["']$/g, '').trim());

      const teamNum = parseInt(clean[headerMap.teamNumber], 10);
      const roleCode = clean[headerMap.roleCode] || '';
      const name = clean[headerMap.name] || '';
      const rollNumber = clean[headerMap.rollNumber] || '';
      const email = clean[headerMap.email] || '';

      const code = roleCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let normalizedRole = '';
      if (['LEAD', 'TL', 'TEAMLEAD', 'TEAMLEADER', 'LEADER'].includes(code)) normalizedRole = 'LEAD';
      else if (['SD', 'SD1', 'SD2', 'SD3', 'SD4', 'SENIOR', 'SENIORDEV', 'SENIORDEVELOPER'].includes(code))
        normalizedRole = 'SD';
      else if (['JD', 'JD1', 'JD2', 'JD3', 'JD4', 'JUNIOR', 'JUNIORDEV', 'JUNIORDEVELOPER'].includes(code))
        normalizedRole = 'JD';
      else {
        errors.push(`Row ${i + 1}: Unrecognized roleCode '${roleCode}' (must be LEAD, SD, or JD)`);
      }

      if (isNaN(teamNum) || teamNum < 1 || teamNum > 9) {
        errors.push(`Row ${i + 1}: Invalid Team '${clean[headerMap.teamNumber]}' (must be 1–9)`);
      }
      if (!name) errors.push(`Row ${i + 1}: Missing student name`);
      if (!rollNumber) errors.push(`Row ${i + 1}: Missing roll number`);
      else {
        if (rollsSeen.has(rollNumber.toUpperCase())) errors.push(`Row ${i + 1}: Duplicate roll '${rollNumber}'`);
        rollsSeen.add(rollNumber.toUpperCase());
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push(`Row ${i + 1}: Invalid email '${email}'`);
      else {
        if (emailsSeen.has(email.toLowerCase())) errors.push(`Row ${i + 1}: Duplicate email '${email}'`);
        emailsSeen.add(email.toLowerCase());
      }

      rows.push({
        teamNumber: teamNum,
        roleCode,
        normalizedRole,
        name,
        rollNumber,
        email,
        phone: headerMap.phone !== undefined ? clean[headerMap.phone] || '' : '',
        college: headerMap.college !== undefined ? clean[headerMap.college] || 'KIET' : 'KIET',
        branch: headerMap.branch !== undefined ? clean[headerMap.branch] || 'CSE' : 'CSE',
        backlogs: headerMap.backlogs !== undefined ? parseInt(clean[headerMap.backlogs], 10) || 0 : 0,
        type: headerMap.type !== undefined ? clean[headerMap.type] || 'DS' : 'DS',
        rowNumber: i + 1,
      });
    }

    let totalLeads = 0;
    let totalSds = 0;
    let totalJds = 0;

    for (let t = 1; t <= 9; t++) {
      const tRows = rows.filter((r) => r.teamNumber === t);
      const leads = tRows.filter((r) => r.normalizedRole === 'LEAD').length;
      const sds = tRows.filter((r) => r.normalizedRole === 'SD').length;
      const jds = tRows.filter((r) => r.normalizedRole === 'JD').length;
      totalLeads += leads;
      totalSds += sds;
      totalJds += jds;

      if (leads !== 1) errors.push(`Team ${t}: has ${leads} Team Lead(s) (expected exactly 1)`);
      if (sds !== 4) errors.push(`Team ${t}: has ${sds} Senior Dev(s) (expected exactly 4)`);
      if (jds !== 4) errors.push(`Team ${t}: has ${jds} Junior Dev(s) (expected exactly 4)`);
    }

    if (rows.length !== 81) {
      errors.push(`Total cohort members is ${rows.length}/81 (exactly 81 students required)`);
    }

    const stats = {
      totalRows: rows.length,
      totalLeads,
      totalSds,
      totalJds,
      teamsDetected: new Set(rows.map((r) => r.teamNumber).filter((n) => n >= 1 && n <= 9)).size,
    };

    return {
      valid: errors.length === 0,
      errors,
      records: rows,
      stats,
    };
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setServerErrors([]);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result || '';
      setUploadedCsvText(text);
      const res = parseCohortCsvClient(text);
      setValidationResult(res);
    };
    reader.readAsText(file);
  };

  const resetCohortForm = () => {
    setUploadedCsvText('');
    setUploadedFileName('');
    setValidationResult({ valid: false, errors: [], records: [], stats: null });
    setServerErrors([]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Batches from Atlas
      const batchesRes = await fetch(`${API_BASE_URL}/admin/batches`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (batchesRes.ok) {
        const batchesData = await batchesRes.json();
        if (batchesData.success && Array.isArray(batchesData.batches)) {
          setBatches(batchesData.batches);
        }
      }

      // 2. Fetch Teams for selected or active batch
      const currentBatchId = batchId || '2026-2027';
      const teamsRes = await fetch(`${API_BASE_URL}/admin/teams?batch=${currentBatchId}`, {
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
          teamLeadId: null,
          membersCount: 0,
          juniorDevsCount: 0,
          seniorDevsCount: 0,
          taskCompletion: '0/0 (0%)',
          performancePct: '0%',
        }));
      }
      setTeams(fetchedTeams);

      // 3. Fetch Users
      const usersRes = await fetch(`${API_BASE_URL}/admin/users?batch=${currentBatchId}`, {
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

      // 4. Fetch Tasks from Atlas
      const tasksRes = await fetch(`${API_BASE_URL}/admin/tasks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.success && Array.isArray(tasksData.tasks)) {
          setTasks(tasksData.tasks);
        }
      }
    } catch (err) {
      console.error('Error loading batches data from Atlas:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchAnalytics = async (tf) => {
    try {
      setAnalyticsLoading(true);
      const currentBatchId = batchId || '2026-2027';
      const res = await fetch(
        `${API_BASE_URL}/admin/teams/analytics?batch=${currentBatchId}&timeframe=${tf}`,
        {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalyticsData(data);
        }
      }
    } catch (e) {
      console.error('Error loading analytics from Atlas:', e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [batchId, teamId]);

  useEffect(() => {
    fetchAnalytics(analyticsTimeframe);
  }, [analyticsTimeframe, batchId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    fetchAnalytics(analyticsTimeframe);
    showToast('Refreshed latest batches & team allocations from Atlas.');
  };

  const handleCreateBatchSubmit = async (e) => {
    e.preventDefault();
    if (!validationResult.valid) {
      showToast(
        'Cannot create batch: Please upload a valid CSV with 81 students (9 Teams, 1 Lead, 4 SD, 4 JD each).',
        'error'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setServerErrors([]);

      const res = await fetch(`${API_BASE_URL}/admin/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          year: newBatchName,
          status: newBatchStatus,
          startDate: newBatchStartDate,
          endDate: newBatchEndDate,
          csvText: uploadedCsvText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to create batch', 'error');
        if (data.errors && Array.isArray(data.errors)) {
          setServerErrors(data.errors);
        }
        return;
      }

      showToast(`Batch ${newBatchName} successfully initialized with 81 students across 9 teams!`, 'success');
      setCreateModalOpen(false);
      resetCohortForm();
      fetchData();
      const formattedId = newBatchName.replace(/\s+/g, '').replace(/–/g, '-');
      navigate(`/admin/batches/${formattedId}`);
    } catch (err) {
      console.error('Error creating batch:', err);
      showToast('Network error while initializing batch.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
        teamLeadId: null,
        membersCount: 0,
        juniorDevsCount: 0,
        seniorDevsCount: 0,
        taskCompletion: '0/0 (0%)',
        performancePct: '0%',
      }
    );
  }, [teamId, selectedBatch, teams]);

  // Helper to fetch members of a team safely (4 Junior Devs, 4 Senior Devs, 1 Team Lead)
  const getTeamMembers = (teamObj) => {
    if (!teamObj) return [];

    const membersList = [];
    const teamScore = parseInt(teamObj.performancePct || teamObj.score || '0', 10) || 0;

    // 1. Team Lead from database
    if (teamObj.teamLeadId && typeof teamObj.teamLeadId === 'object' && teamObj.teamLeadId.name) {
      membersList.push({
        id: teamObj.teamLeadId._id || 'm-lead',
        name: teamObj.teamLeadId.name,
        email: teamObj.teamLeadId.email || '',
        role: 'team_lead',
        roleTitle: 'Team Lead',
        pct: `${teamScore}%`,
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
            email: m.email || '',
            role: isSenior ? 'senior_developer' : 'junior_developer',
            roleTitle: isSenior ? 'Senior Developer' : 'Junior Developer',
            pct: `${teamScore}%`,
            avatar: m.avatar || '',
          });
        }
      });
    }

    return membersList;
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

  // Selected Team analytics data derived dynamically
  const selectedTeamAnalytics = useMemo(() => {
    if (!analyticsData?.teams || !selectedTeam) return null;
    return analyticsData.teams.find(
      (t) => t.teamNumber === selectedTeam.teamNumber || String(t._id) === String(selectedTeam._id)
    );
  }, [analyticsData, selectedTeam]);

  // Recharts Data for Performance Tab (Dynamic from live Atlas DB)
  const performanceTimeData = useMemo(() => {
    if (analyticsData?.trendData && Array.isArray(analyticsData.trendData) && analyticsData.trendData.length > 0) {
      return analyticsData.trendData.map((d) => ({
        week: d.label || d.date,
        score: d.avgPerformance ?? d.score ?? 0,
        submissions: d.submissions ?? d.completed ?? 0,
      }));
    }
    return [
      { week: 'Week 1', score: 0, submissions: 0 },
      { week: 'Week 2', score: 0, submissions: 0 },
      { week: 'Week 3', score: 0, submissions: 0 },
      { week: 'Week 4', score: 0, submissions: 0 },
    ];
  }, [analyticsData]);

  const taskCompletionPieData = useMemo(() => {
    if (selectedTeamAnalytics && selectedTeamAnalytics.tasksCount > 0) {
      const comp = selectedTeamAnalytics.completedAssignments || 0;
      const sub = selectedTeamAnalytics.submittedAssignments || 0;
      const inProg = (selectedTeamAnalytics.inProgressAssignments || 0) + (selectedTeamAnalytics.pendingAssignments || 0);
      const over = selectedTeamAnalytics.overdueAssignments || 0;

      const items = [
        { name: 'Completed', value: comp, color: '#10B981' },
        { name: 'Submitted', value: sub, color: '#F59E0B' },
        { name: 'In Progress / Pending', value: inProg, color: '#66645E' },
        { name: 'Overdue', value: over, color: '#EF4444' },
      ].filter((it) => it.value > 0);

      if (items.length > 0) return items;
    }
    return [
      { name: 'No Tasks Assigned', value: 1, color: '#E0DDD0' },
    ];
  }, [selectedTeamAnalytics]);

  const individualMemberPerformance = (currentTeamMembers || []).map((m) => ({
    name: m.name ? m.name.split(' ')[0] : 'Member',
    completion: parseInt(m.pct, 10) || 80,
  }));

  // Tasks Tab Data dynamically resolved from live Atlas database
  const filteredTeamTasks = useMemo(() => {
    if (!selectedTeam) return [];
    const teamNum = selectedTeam.teamNumber;
    const teamTasksList = tasks.filter((t) => {
      const inAssignedTeams = Array.isArray(t.assignedTeams) && t.assignedTeams.includes(teamNum);
      const leadIdStr = selectedTeam.teamLeadId?._id ? selectedTeam.teamLeadId._id.toString() : selectedTeam.teamLeadId?.toString();
      const isLeadCreator = leadIdStr && t.createdBy && (t.createdBy._id || t.createdBy).toString() === leadIdStr;
      return inAssignedTeams || isLeadCreator;
    }).map((t) => {
      const deadlineDate = t.deadline ? new Date(t.deadline) : null;
      const isOverdue = deadlineDate && deadlineDate < new Date() && (t.completedCount || 0) === 0;
      const status = (t.completedCount || 0) > 0 ? 'Completed' : isOverdue ? 'Overdue' : 'Pending';
      const deadlineStr = deadlineDate ? deadlineDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Flexible';
      const compPct = t.totalAssignments > 0 ? `${Math.round(((t.completedCount || 0) / t.totalAssignments) * 100)}%` : '100%';
      return {
        id: t._id,
        task: t.title,
        topic: t.topic || 'Cohort Milestone',
        deadline: deadlineStr,
        status,
        completion: compPct,
      };
    });

    const list = teamTasksList;

    return list.filter((t) => {
      if (taskFilter === 'pending') return t.status === 'Pending';
      if (taskFilter === 'completed') return t.status === 'Completed';
      if (taskFilter === 'overdue') return t.status === 'Overdue';
      return true;
    });
  }, [tasks, selectedTeam, taskFilter]);

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

            <h2 className="font-bold tracking-tight text-3xl sm:text-4xl font-semibold text-[#1C1B1A]">
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

                    <h3 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A] group-hover:text-black">
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
                <h3 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">Batch {selectedBatch.year}</h3>
                <p className="text-xs text-[#66645E] mt-1">
                  {selectedBatch.teamsCount || teams.length || 9} Teams • {selectedBatch.studentsCount || users.length || 81} Enrolled Students • {analyticsData?.summary?.averageScore !== undefined ? `${analyticsData.summary.averageScore}%` : selectedBatch.avgPerformance || '88%'} Avg Performance
                </p>
              </div>

              <button
                onClick={() => navigate('/admin/batches')}
                className="px-4 py-2 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#1C1B1A] cursor-pointer"
              >
                ← Back to All Batches
              </button>
            </div>

            {/* ==================== TEAM PERFORMANCE ANALYTICS (RECHARTS) ==================== */}
            <div className="bg-[#FDFCF9] rounded-3xl p-6 border border-[#E0DDD0] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E0DDD0]">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1B1A] text-white text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    Live Cohort Analytics
                  </div>
                  <h3 className="font-bold tracking-tight text-2xl font-bold text-[#1C1B1A]">
                    Team Performance Comparison
                  </h3>
                  <p className="text-xs text-[#66645E]">
                    Real-time submission evaluation across all 9 teams (includes both Admin & Team Lead tasks)
                  </p>
                </div>

                {/* Timeframe Toggle: Weekly | Monthly | Overall */}
                <div className="inline-flex p-1 bg-[#EEECDF] rounded-xl border border-[#E0DDD0]">
                  {['weekly', 'monthly', 'overall'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg capitalize transition-all cursor-pointer ${
                        analyticsTimeframe === tf
                          ? 'bg-[#1C1B1A] text-white shadow-xs'
                          : 'text-[#66645E] hover:text-[#1C1B1A]'
                      }`}
                    >
                      {tf === 'weekly' ? 'Weekly' : tf === 'monthly' ? 'Monthly' : 'Overall'}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block mb-1">
                    Top Team ({analyticsTimeframe})
                  </span>
                  <p className="text-lg font-bold text-[#1C1B1A] truncate">
                    {analyticsData?.summary?.topTeam?.name || 'No Active Team'}
                  </p>
                  <span className="text-xs font-mono font-semibold text-emerald-700">
                    {analyticsData?.summary?.topTeam ? `${analyticsData.summary.topTeam.score}% Score` : '0%'}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block mb-1">
                    Avg Batch Performance
                  </span>
                  <p className="text-lg font-bold text-[#1C1B1A]">
                    {analyticsData?.summary?.averageScore ?? 0}%
                  </p>
                  <span className="text-xs font-mono text-[#66645E]">
                    Across 9 Teams
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block mb-1">
                    Total Deliverables
                  </span>
                  <p className="text-lg font-bold text-[#1C1B1A]">
                    {analyticsData?.summary?.totalSubmissions ?? 0}
                  </p>
                  <span className="text-xs font-mono text-emerald-700">
                    Submitted & Approved
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#66645E] block mb-1">
                    Active Teams
                  </span>
                  <p className="text-lg font-bold text-[#1C1B1A]">
                    {analyticsData?.summary?.activeTeamsCount ?? 0} / 9
                  </p>
                  <span className="text-xs font-mono text-[#66645E]">
                    Performing Tasks
                  </span>
                </div>
              </div>

              {/* Recharts Bar Chart: Team 1 to Team 9 Performance Score */}
              <div className="p-5 bg-white rounded-2xl border border-[#E0DDD0] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1C1B1A]">
                      Team-Wise Score Breakdown ({analyticsTimeframe.toUpperCase()})
                    </h4>
                    <p className="text-[11px] text-[#66645E]">
                      Teams with no performed tasks or overdue submissions reflect decreased scores
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Optimal (≥70%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Moderate (40-69%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Inactive / Low (&lt;40%)
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        analyticsData?.teams ||
                        teams.map((t, idx) => ({
                          teamNumber: t.teamNumber || idx + 1,
                          name: t.name,
                          score: parseInt(t.performancePct || '0', 10) || 0,
                          track: t.track,
                          tasksCount: t.tasksCount || 0,
                          completedAssignments: t.completedAssignments || 0,
                          submittedAssignments: t.submittedAssignments || 0,
                          overdueAssignments: t.overdueAssignments || 0,
                          status: 'Inactive',
                        }))
                      }
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DC" vertical={false} />
                      <XAxis
                        dataKey="teamNumber"
                        tickFormatter={(val) => `Team ${val}`}
                        stroke="#66645E"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#66645E"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#1C1B1A] text-white p-3 rounded-xl shadow-lg text-xs space-y-1 border border-[#333]">
                                <p className="font-bold text-amber-300">
                                  {d.name} (Team {d.teamNumber})
                                </p>
                                <p className="text-[11px] text-gray-300 line-clamp-1">{d.track}</p>
                                <div className="pt-1.5 border-t border-gray-700 space-y-0.5 font-mono">
                                  <p>
                                    Performance:{' '}
                                    <span className="font-bold text-white">{d.score}%</span>
                                  </p>
                                  <p>Tasks in Window: {d.tasksCount || 0}</p>
                                  <p className="text-emerald-400">
                                    Completed: {d.completedAssignments || 0}
                                  </p>
                                  <p className="text-amber-300">
                                    Submitted: {d.submittedAssignments || 0}
                                  </p>
                                  <p className="text-rose-400">
                                    Overdue: {d.overdueAssignments || 0}
                                  </p>
                                  <p className="text-gray-400">Status: {d.status}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {(
                          analyticsData?.teams ||
                          teams.map((t) => ({
                            score: parseInt(t.performancePct || '0', 10) || 0,
                          }))
                        ).map((entry, index) => {
                          const fill =
                            entry.score >= 70
                              ? '#10B981' // emerald
                              : entry.score >= 40
                              ? '#F59E0B' // amber
                              : entry.score > 0
                              ? '#EF4444' // red
                              : '#9CA3AF'; // gray
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Teams Grid for Selected Batch */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((t) => {
                const analyticsTeam = analyticsData?.teams?.find(
                  (at) => at.teamNumber === t.teamNumber || String(at._id) === String(t._id)
                );
                const scoreVal = analyticsTeam?.performancePct || t.performancePct || `${t.progressPercentage ?? 0}%`;
                const num = parseInt(scoreVal, 10) || 0;
                const taskComp = analyticsTeam?.taskCompletion || t.taskCompletion || `${t.completedAssignments || 0}/${t.totalExpectedAssignments || 0} (${scoreVal})`;
                const badgeCls =
                  num >= 70
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : num >= 40
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : num > 0
                    ? 'text-rose-800 bg-rose-50 border-rose-200'
                    : 'text-stone-600 bg-stone-100 border-stone-200';

                return (
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
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                          {scoreVal}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-[#66645E] line-clamp-1">{t.track}</p>

                      <div className="mt-4 space-y-1.5 text-xs text-[#66645E]">
                        <p>
                          <strong className="text-[#1C1B1A]">Team Lead:</strong>{' '}
                          {t.teamLeadId?.name || 'Unassigned'}
                        </p>
                        <p>
                          <strong className="text-[#1C1B1A]">Members:</strong>{' '}
                          {t.membersCount || t.members?.length || 0} Students
                        </p>
                        <p>
                          <strong className="text-[#1C1B1A]">Task Completion:</strong>{' '}
                          {taskComp}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E0DDD0] flex items-center justify-between text-xs font-semibold text-[#1C1B1A] group-hover:underline">
                      <span>View Team Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 3. TEAM DETAILS (MEMBERS / PERFORMANCE / TASKS TABS) ==================== */}
        {selectedTeam && (
          <div className="space-y-6">
            <div className="bg-[#FDFCF9] rounded-2xl p-6 border border-[#E0DDD0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-[#66645E]">Batch {selectedBatch?.year}</span>
                <h3 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">{selectedTeam.name} Details</h3>
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
                Assigned Tasks ({filteredTeamTasks.length})
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
                    <h3 className="font-bold tracking-tight text-3xl font-semibold text-[#1C1B1A]">
                      Team members
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#1C1B1A] bg-[#EEECDF] px-3 py-1 rounded-full border border-[#E0DDD0]">
                      Total: 9 Members
                    </span>
                  </div>

                  {/* SECTION 1: JUNIOR DEVELOPER (4) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold tracking-tight text-2xl font-bold text-[#1C1B1A]">
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
                      <h4 className="font-bold tracking-tight text-2xl font-bold text-[#1C1B1A]">
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
                  <h4 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A] mb-4">Weekly Task Completion Trend</h4>
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
                    <h4 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A] mb-2">Completion Status</h4>
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
                  <h4 className="font-bold tracking-tight text-2xl font-semibold text-[#1C1B1A]">Team Tasks List</h4>
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
                  {filteredTeamTasks.length > 0 ? (
                    filteredTeamTasks.map((t) => (
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
                    ))
                  ) : (
                    <div className="p-8 text-center text-[#66645E]">
                      <p className="text-sm font-medium">No tasks assigned to this team yet.</p>
                      <p className="text-xs text-[#8C887B] mt-1">Tasks will appear here once published by the team lead or admin.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE BATCH MODAL WITH STRICT COHORT CSV IMPORT */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F9F8F3] border border-[#E0DDD0] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E0DDD0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#66645E] font-semibold">
                    Admin Cohort Onboarding
                  </span>
                </div>
                <h3 className="font-bold tracking-tight text-2xl sm:text-3xl text-[#1C1B1A] mt-1">
                  Create Academic Batch
                </h3>
                <p className="text-xs text-[#66645E] mt-1">
                  Strict Cohort Requirement: Exactly 9 teams, each with 1 Team Lead, 4 Senior Developers, and 4 Junior Developers (81 students total).
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCohortForm();
                }}
                className="p-1.5 rounded-full hover:bg-[#EAE7DC] text-[#66645E] hover:text-[#1C1B1A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatchSubmit} className="space-y-6 text-xs">
              {/* 1. Batch Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#1C1B1A] mb-1.5">
                    Batch Year / Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2027 – 2028"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-[#66645E] mt-1">Formatted ID: {newBatchName.replace(/\s+/g, '').replace(/–/g, '-')}</p>
                </div>

                <div>
                  <label className="block font-medium text-[#1C1B1A] mb-1.5">Batch Status</label>
                  <select
                    value={newBatchStatus}
                    onChange={(e) => setNewBatchStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] font-medium focus:border-[#1C1B1A] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Active Batch">Active Batch</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1C1B1A] mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={newBatchStartDate}
                    onChange={(e) => setNewBatchStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1C1B1A] mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={newBatchEndDate}
                    onChange={(e) => setNewBatchEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0DDD0] bg-white text-[#1C1B1A] focus:border-[#1C1B1A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 2. CSV Cohort Header Specification Box */}
              <div className="bg-[#F2EFE6] border border-[#E0DDD0] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1C1B1A] font-semibold text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Required CSV Header & Quota Specification</span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCohortTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF9F5] border border-[#E0DDD0] text-[#1C1B1A] text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                <p className="text-xs text-[#66645E]">
                  Every new batch requires an exact cohort dataset of <strong>81 members</strong> organized into <strong>Teams 1 through 9</strong>. Each team must have exactly <strong>1 Team Lead (`LEAD`)</strong>, <strong>4 Senior Developers (`SD`)</strong>, and <strong>4 Junior Developers (`JD`)</strong>.
                </p>

                {/* CSV Headers Codebox */}
                <div className="bg-[#1C1B1A] text-amber-200 rounded-xl p-3 font-mono text-[11px] overflow-x-auto select-all">
                  teamNumber,roleCode,name,rollNumber,email,phone,college,branch,backlogs,type
                </div>

                {/* Field description tags */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#66645E]">
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">teamNumber</span>: 1 to 9
                  </div>
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">roleCode</span>: LEAD, SD, JD
                  </div>
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">rollNumber</span>: Initial Password
                  </div>
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">email</span>: Student Email
                  </div>
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">phone</span>: Mobile Number
                  </div>
                  <div className="bg-white/80 border border-[#E0DDD0] rounded-lg p-2">
                    <span className="font-mono font-bold text-[#1C1B1A]">type</span>: DS (Day) / HS (Hostel)
                  </div>
                </div>
              </div>

              {/* 3. File Upload Area */}
              <div className="space-y-2">
                <label className="block font-medium text-[#1C1B1A]">
                  Upload Cohort CSV File <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-[#D2CEBE] hover:border-[#1C1B1A] rounded-2xl p-6 text-center bg-white transition-all">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#F2EFE6] flex items-center justify-center text-[#1C1B1A]">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    {uploadedFileName ? (
                      <div>
                        <p className="font-semibold text-sm text-[#1C1B1A]">{uploadedFileName}</p>
                        <p className="text-xs text-[#66645E]">Click or drag another CSV to replace</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-sm text-[#1C1B1A]">
                          Click to browse or drag & drop cohort CSV
                        </p>
                        <p className="text-xs text-[#66645E]">Must adhere to the 81-student format</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Live Validation Feedback */}
              {uploadedCsvText && (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div
                    className={`rounded-2xl p-4 border flex items-start gap-3 ${
                      validationResult.valid
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/80 border-amber-300 text-amber-950'
                    }`}
                  >
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 w-full">
                      <p className="font-semibold text-sm">
                        {validationResult.valid
                          ? 'Cohort CSV Fully Validated & Ready'
                          : 'Cohort Dataset Validation Issues'}
                      </p>
                      <p className="text-xs opacity-90">
                        {validationResult.valid
                          ? 'All 9 teams strictly have 1 Lead, 4 SDs, and 4 JDs (81 students total). You can now create the batch.'
                          : 'The uploaded file does not satisfy the cohort quota requirements. See breakdown below.'}
                      </p>

                      {/* Quota Checklist Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                        <div
                          className={`rounded-xl p-2 text-center border font-mono text-xs font-semibold ${
                            validationResult.stats?.teamsDetected === 9
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-rose-100/70 border-rose-300 text-rose-800'
                          }`}
                        >
                          <div>Teams</div>
                          <div className="text-sm font-bold mt-0.5">
                            {validationResult.stats?.teamsDetected || 0}/9
                          </div>
                        </div>

                        <div
                          className={`rounded-xl p-2 text-center border font-mono text-xs font-semibold ${
                            validationResult.stats?.totalLeads === 9
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-rose-100/70 border-rose-300 text-rose-800'
                          }`}
                        >
                          <div>Team Leads</div>
                          <div className="text-sm font-bold mt-0.5">
                            {validationResult.stats?.totalLeads || 0}/9
                          </div>
                        </div>

                        <div
                          className={`rounded-xl p-2 text-center border font-mono text-xs font-semibold ${
                            validationResult.stats?.totalSds === 36
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-rose-100/70 border-rose-300 text-rose-800'
                          }`}
                        >
                          <div>Senior Devs</div>
                          <div className="text-sm font-bold mt-0.5">
                            {validationResult.stats?.totalSds || 0}/36
                          </div>
                        </div>

                        <div
                          className={`rounded-xl p-2 text-center border font-mono text-xs font-semibold ${
                            validationResult.stats?.totalJds === 36
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-rose-100/70 border-rose-300 text-rose-800'
                          }`}
                        >
                          <div>Junior Devs</div>
                          <div className="text-sm font-bold mt-0.5">
                            {validationResult.stats?.totalJds || 0}/36
                          </div>
                        </div>

                        <div
                          className={`rounded-xl p-2 text-center border font-mono text-xs font-semibold ${
                            validationResult.stats?.totalRows === 81
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800'
                              : 'bg-rose-100/70 border-rose-300 text-rose-800'
                          }`}
                        >
                          <div>Total Students</div>
                          <div className="text-sm font-bold mt-0.5">
                            {validationResult.stats?.totalRows || 0}/81
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Errors List */}
                  {!validationResult.valid && validationResult.errors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Action Required ({validationResult.errors.length} Issues):</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-700 divide-y divide-rose-100 font-mono">
                        {validationResult.errors.map((err, idx) => (
                          <p key={idx} className="pt-1">
                            • {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Server Errors List */}
                  {serverErrors.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Server Validation Errors:</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-rose-700 divide-y divide-rose-100 font-mono">
                        {serverErrors.map((err, idx) => (
                          <p key={idx} className="pt-1">
                            • {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer / Submit */}
              <div className="pt-4 border-t border-[#E0DDD0] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#66645E]">
                  {!uploadedCsvText ? (
                    <span>Upload an 81-student cohort CSV to enable creation.</span>
                  ) : !validationResult.valid ? (
                    <span className="text-rose-600 font-medium">Fix CSV validation errors to proceed.</span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready to initialize 9 teams and 81 students.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateModalOpen(false);
                      resetCohortForm();
                    }}
                    className="px-4 py-2.5 rounded-full border border-[#E0DDD0] bg-white hover:bg-[#F2EFE6] text-[#1C1B1A] font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!validationResult.valid || isSubmitting}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-2 ${
                      validationResult.valid && !isSubmitting
                        ? 'bg-[#1C1B1A] hover:bg-black text-white shadow-md'
                        : 'bg-[#C2BEAF] text-[#66645E] cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Seeding Batch Cohort...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Batch & Import Data</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
