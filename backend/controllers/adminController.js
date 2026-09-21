const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Batch = require('../models/Batch');
const Resource = require('../models/Resource');

/**
 * @desc    Get all registered users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.batch) {
      filter.batch = req.query.batch;
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
};


/**
 * @desc    Update a user's role (Admin only)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['user', 'teamlead', 'admin'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    console.log(`Admin ${req.user.email} updated user ${user.email} role in Atlas to: '${user.role}'`);

    res.status(200).json({
      success: true,
      message: `User role updated successfully to '${user.role}'`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user role',
    });
  }
};

/**
 * @desc    Get high-level statistics for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: { $in: ['user', 'student'] } });
    const teamLeads = await User.countDocuments({ role: { $in: ['teamlead', 'team_lead'] } });
    const admins = await User.countDocuments({ role: 'admin' });
    const teamsCount = await Team.countDocuments();
    const tasksCount = await Task.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        students,
        teamLeads,
        admins,
        teamsCount,
        tasksCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin stats',
    });
  }
};

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

/**
 * Helper to compute standardized performance metrics for a team across a given timeframe.
 * Used uniformly by both getTeams (/api/admin/teams) and getTeamPerformanceAnalytics (/api/admin/teams/analytics).
 */
const computeTeamMetrics = (teamDoc, allTasks, allAssignments, timeframe = 'overall', now = new Date()) => {
  const team = teamDoc.toObject ? teamDoc.toObject() : teamDoc;
  const teamNumber = team.teamNumber;
  const teamLeadId = team.teamLeadId?._id ? team.teamLeadId._id.toString() : team.teamLeadId ? team.teamLeadId.toString() : null;
  const memberIds = (team.members || []).map((m) => (m?._id ? m._id.toString() : m.toString()));
  const allTeamUserIds = teamLeadId ? [teamLeadId, ...memberIds] : [...memberIds];

  let windowStart = new Date(0);
  if (timeframe === 'weekly') {
    windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'monthly') {
    windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Tasks associated with this team:
  // 1. Explicitly assigned to teamNumber in assignedTeams
  // 2. Created by this team's lead
  // 3. Assigned directly to any of this team's members in assignedTo
  const teamTasks = allTasks.filter((t) => {
    const hasTeamNum = Array.isArray(t.assignedTeams) && t.assignedTeams.includes(teamNumber);
    const isCreatedByLead = teamLeadId && t.createdBy && (t.createdBy._id || t.createdBy).toString() === teamLeadId;
    const hasAssignedMember =
      Array.isArray(t.assignedTo) && t.assignedTo.some((uid) => allTeamUserIds.includes((uid._id || uid).toString()));
    return hasTeamNum || isCreatedByLead || hasAssignedMember;
  });

  // Filter tasks for requested timeframe
  const relevantTasks = teamTasks.filter((t) => {
    if (timeframe === 'overall') return true;
    const createdAt = t.createdAt ? new Date(t.createdAt) : new Date(0);
    const deadline = t.deadline ? new Date(t.deadline) : new Date(0);
    return createdAt >= windowStart || deadline >= windowStart;
  });

  const relevantTaskIds = relevantTasks.map((t) => t._id.toString());

  // Task assignments belonging to this team's members on these tasks
  const relevantAssignments = allAssignments.filter((a) => {
    const sId = (a.studentId?._id || a.studentId || '').toString();
    const tId = (a.taskId?._id || a.taskId || '').toString();
    if (!allTeamUserIds.includes(sId) || !relevantTaskIds.includes(tId)) return false;

    if (timeframe === 'overall') return true;

    const subTime = a.submittedAt
      ? new Date(a.submittedAt)
      : a.updatedAt
      ? new Date(a.updatedAt)
      : new Date(0);
    return subTime >= windowStart || a.status === 'completed' || a.status === 'submitted';
  });

  const completedCount = relevantAssignments.filter((a) => a.status === 'completed').length;
  const submittedCount = relevantAssignments.filter((a) => a.status === 'submitted').length;
  const inProgressCount = relevantAssignments.filter((a) => a.status === 'in_progress').length;
  const pendingCount = relevantAssignments.filter((a) => a.status === 'pending').length;

  const overdueCount = relevantAssignments.filter((a) => {
    const task = teamTasks.find((t) => t._id.toString() === (a.taskId?._id || a.taskId).toString());
    if (!task || !task.deadline) return false;
    return new Date(task.deadline) < now && a.status !== 'completed' && a.status !== 'submitted';
  }).length;

  // Calculate actual total expected assignments across relevant tasks
  let totalExpectedAssignments = 0;
  relevantTasks.forEach((t) => {
    if (Array.isArray(t.assignedTo) && t.assignedTo.length > 0) {
      const assignedInTeam = t.assignedTo.filter((uid) =>
        allTeamUserIds.includes((uid._id || uid).toString())
      ).length;
      totalExpectedAssignments += Math.max(assignedInTeam, 1);
    } else if (t.taskScope === 'team_lead') {
      totalExpectedAssignments += 1;
    } else if (t.targetGroup === 'junior_developers') {
      const jdsCount = (team.members || []).filter((m) => m?.memberType === 'junior_developer').length || 4;
      totalExpectedAssignments += jdsCount;
    } else if (t.targetGroup === 'developer_interns') {
      const sdsCount = (team.members || []).filter((m) => m?.memberType === 'senior_developer').length || 4;
      totalExpectedAssignments += sdsCount;
    } else {
      // General team task: all team students (members + lead)
      totalExpectedAssignments += Math.max(allTeamUserIds.length, 9);
    }
  });

  // Completion percentage of approved deliverables
  const completionPct =
    totalExpectedAssignments > 0
      ? Math.min(100, Math.round((completedCount / totalExpectedAssignments) * 100))
      : 0;

  // Calculate Performance Score (0 - 100)
  let score = 0;
  if (totalExpectedAssignments > 0) {
    // Earned points: completed gives 100%, submitted (under review) gives 70%, in_progress gives 20%
    const earned = completedCount * 1.0 + submittedCount * 0.7 + inProgressCount * 0.2;
    const basePct = (earned / totalExpectedAssignments) * 100;

    // Overdue penalty: capped at 15% maximum deduction so it never erases completed work
    const overdueRatio = overdueCount / totalExpectedAssignments;
    const penalty = Math.min(15, Math.round(overdueRatio * 15));

    score = Math.max(0, Math.min(100, Math.round(basePct - penalty)));
  }

  // Count how many tasks have at least some progress or are completed by team
  const tasksCompletedCount = relevantTasks.filter((t) => {
    const tAssigns = relevantAssignments.filter((a) => (a.taskId?._id || a.taskId).toString() === t._id.toString());
    return tAssigns.some((a) => a.status === 'completed');
  }).length;

  return {
    ...team,
    teamLeadName: team.teamLeadId?.name || 'Unassigned',
    membersCount: (team.members || []).length + (teamLeadId ? 1 : 0),
    score,
    performancePct: `${score}%`,
    progressPercentage: score,
    tasksCount: relevantTasks.length,
    tasksCompletedCount,
    completedAssignments: completedCount,
    submittedAssignments: submittedCount,
    inProgressAssignments: inProgressCount,
    pendingAssignments: pendingCount,
    overdueAssignments: overdueCount,
    totalExpectedAssignments,
    completionPct,
    taskCompletion:
      relevantTasks.length === 0
        ? '0/0 (0%)'
        : `${completedCount}/${totalExpectedAssignments} (${completionPct}%)`,
    status:
      relevantTasks.length === 0
        ? 'No Tasks'
        : score >= 70
        ? 'Optimal'
        : score >= 40
        ? 'Moderate'
        : score > 0
        ? 'Needs Attention'
        : 'Inactive',
  };
};

/**
 * @desc    Get all 9 cohort teams (auto-seeds 9 teams with track names & maxMembers: 9)
 * @route   GET /api/admin/teams
 * @access  Private/Admin
 */
const getTeams = async (req, res) => {
  try {
    const batchId = req.query.batch || '2026-2027';

    // Ensure all 9 teams (1 through 9) exist with designated tracks and max capacity of 9
    for (let i = 1; i <= 9; i++) {
      let team = await Team.findOne({ teamNumber: i, batch: batchId });
      if (!team) {
        await Team.create({
          name: `Team ${i}`,
          teamNumber: i,
          track: trackNames[i] || `Track ${i}`,
          batch: batchId,
          maxMembers: 9,
          teamLeadId: null,
          members: [],
        });
      } else {
        let changed = false;
        if (!team.track) {
          team.track = trackNames[i] || `Track ${i}`;
          changed = true;
        }
        if (!team.maxMembers) {
          team.maxMembers = 9;
          changed = true;
        }
        if (!team.batch) {
          team.batch = batchId;
          changed = true;
        }
        if (changed) {
          await team.save();
        }
      }
    }

    const teams = await Team.find({ batch: batchId })
      .sort({ teamNumber: 1 })
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    // Fetch all published tasks and assignments to compute team progress
    const allTasks = await Task.find().populate('createdBy', 'name role email');
    const allAssignments = await TaskAssignment.find();

    const enrichedTeams = teams.map((teamDoc) => computeTeamMetrics(teamDoc, allTasks, allAssignments, 'overall'));

    res.status(200).json({
      success: true,
      count: enrichedTeams.length,
      teams: enrichedTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teams',
    });
  }
};

/**
 * @desc    Assign or unassign Team Lead for a team
 * @route   PATCH /api/admin/teams/:id/lead
 * @access  Private/Admin
 */
const assignTeamLead = async (req, res) => {
  try {
    const { teamLeadId } = req.body;
    let team = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      team = await Team.findById(req.params.id);
    }
    if (!team) {
      const match = String(req.params.id).match(/\d+/);
      if (match) {
        team = await Team.findOne({ teamNumber: parseInt(match[0], 10) });
      }
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (teamLeadId) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(teamLeadId)) {
        user = await User.findById(teamLeadId);
      }
      if (!user) {
        user = await User.findOne({ email: teamLeadId });
      }
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Selected user for Team Lead not found',
        });
      }

      // Check if user is already leading another team
      const existingLead = await Team.findOne({
        teamLeadId: user._id,
        _id: { $ne: team._id },
      });
      if (existingLead) {
        return res.status(400).json({
          success: false,
          message: `${user.name} is already assigned as Team Lead for ${existingLead.name}`,
        });
      }

      team.teamLeadId = user._id;
      // Also update user's teamId and promote role to teamlead if regular user
      if (user.role === 'user' || user.role === 'student') {
        user.role = 'teamlead';
      }
      user.teamId = team._id;
      await user.save();
    } else {
      if (team.teamLeadId) {
        try {
          const prevLead = await User.findById(team.teamLeadId);
          if (prevLead && prevLead.teamId && prevLead.teamId.toString() === team._id.toString()) {
            prevLead.teamId = null;
            await prevLead.save();
          }
        } catch (e) {
          // ignore cleanup error
        }
      }
      team.teamLeadId = null;
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    res.status(200).json({
      success: true,
      message: `Team Lead ${teamLeadId ? 'assigned' : 'unassigned'} successfully for ${team.name}`,
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign team lead',
    });
  }
};

/**
 * @desc    Remove a member from a team (Admin)
 * @route   DELETE /api/admin/teams/:id/members/:memberId
 * @access  Private/Admin
 */
const removeTeamMember = async (req, res) => {
  try {
    const { id: teamId, memberId } = req.params;
    let team = null;

    if (mongoose.Types.ObjectId.isValid(teamId)) {
      team = await Team.findById(teamId);
    }
    if (!team) {
      const match = String(teamId).match(/\d+/);
      if (match) {
        team = await Team.findOne({ teamNumber: parseInt(match[0], 10) });
      }
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.members = team.members.filter((m) => m && m.toString() !== memberId);
    await team.save();

    const user = await User.findById(memberId);
    if (user && user.teamId && user.teamId.toString() === team._id.toString()) {
      user.teamId = null;
      await user.save();
    }

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    res.status(200).json({
      success: true,
      message: 'Member removed from team successfully',
      team: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove member from team',
    });
  }
};

/**
 * @desc    Get all resources (auto-seeds default resources if none exist)
 * @route   GET /api/admin/resources
 * @access  Private/Admin
 */
const getResources = async (req, res) => {
  try {
    let resources = await Resource.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar');

    // Auto-seed default learning resources if database is empty
    if (resources.length === 0) {
      const adminUser = (await User.findOne({ role: 'admin' })) || (await User.findOne());
      if (adminUser) {
        const seedResources = [
          {
            title: 'React Authentication & Google SSO Integration Guide',
            type: 'link',
            description: 'Official developer documentation for Google Identity Services (GIS) and React OAuth 2.0 flow.',
            url: 'https://developers.google.com/identity/gsi/web/guides/overview',
            topic: 'Full-Stack Web Dev / Security',
            createdBy: adminUser._id,
          },
          {
            title: 'MongoDB Atlas Schema & Role-Based Access Control Spec',
            type: 'note',
            description: 'Architectural specifications for user role gating, indexing, and connection security.',
            url: 'https://www.mongodb.com/docs/atlas/',
            topic: 'Database / MongoDB Atlas',
            createdBy: adminUser._id,
          },
          {
            title: 'RESTful API Security & Middleware Guidelines',
            type: 'pdf',
            description: 'Comprehensive checklist for JWT authentication middleware, CORS protection, and input sanitization.',
            url: 'https://expressjs.com/en/advanced/best-practice-security.html',
            topic: 'Full-Stack Web Dev / Backend',
            createdBy: adminUser._id,
          },
          {
            title: 'Data Structures & Algorithms Problem-Solving Patterns',
            type: 'link',
            description: 'Curated problem patterns for array manipulation, graph traversal, and dynamic programming.',
            url: 'https://leetcode.com',
            topic: 'Data Structures & Algorithms',
            createdBy: adminUser._id,
          },
        ];

        await Resource.insertMany(seedResources);
        resources = await Resource.find()
          .sort({ createdAt: -1 })
          .populate('createdBy', 'name email avatar');
      }
    }

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch resources',
    });
  }
};

/**
 * @desc    Create a new resource
 * @route   POST /api/admin/resources
 * @access  Private/Admin
 */
const createResource = async (req, res) => {
  try {
    const { title, type, description, url, topic } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({
        success: false,
        message: 'Resource title, type, and URL are required',
      });
    }

    const resource = await Resource.create({
      title: title.trim(),
      type: type.toLowerCase().trim(),
      description: description ? description.trim() : '',
      url: url.trim(),
      topic: topic ? topic.trim() : 'General',
      createdBy: req.user._id,
    });

    const populatedResource = await Resource.findById(resource._id).populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource: populatedResource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create resource',
    });
  }
};

/**
 * @desc    Get all tasks
 * @route   GET /api/admin/tasks
 * @access  Private/Admin
 */
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar')
      .populate('relatedResources', 'title type description url topic');

    const taskIds = tasks.map((t) => t._id);
    const taskAssignments = await TaskAssignment.find({ taskId: { $in: taskIds } })
      .populate('studentId', 'name rollNumber email avatar')
      .populate('reviewedBy', 'name email avatar');

    const tasksWithStats = tasks.map((t) => {
      const tObj = t.toObject ? t.toObject() : t;
      const relatedAssignments = taskAssignments.filter((a) => a.taskId.toString() === t._id.toString());
      tObj.totalAssignments = relatedAssignments.length;
      tObj.completedCount = relatedAssignments.filter((a) => a.status === 'completed').length;
      tObj.submittedCount = relatedAssignments.filter((a) => a.status === 'submitted').length;
      tObj.assignments = relatedAssignments;
      return tObj;
    });

    res.status(200).json({
      success: true,
      count: tasksWithStats.length,
      tasks: tasksWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tasks',
    });
  }
};

/**
 * @desc    Create a new task for teams
 * @route   POST /api/admin/tasks
 * @access  Private/Admin
 */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      topic,
      targetGroup,
      deadline,
      priority,
      assignedTeams,
      deliverables,
      relatedResources,
    } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and deadline are required',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      topic: topic ? topic.trim() : '',
      targetGroup: targetGroup || 'both',
      deadline: new Date(deadline),
      priority: priority || 'Normal',
      assignedTeams:
        Array.isArray(assignedTeams) && assignedTeams.length > 0
          ? assignedTeams
          : [1, 2, 3, 4, 5, 6, 7, 8, 9],
      deliverables:
        Array.isArray(deliverables) && deliverables.length > 0
          ? deliverables
          : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'],
      relatedResources: Array.isArray(relatedResources) ? relatedResources : [],
      status: 'Published',
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar');

    // Create initial TaskAssignment records for students in assigned teams so they appear in student/team lead dashboards
    try {
      const assignedTeamDocs = await Team.find({ teamNumber: { $in: task.assignedTeams } });
      const studentIdsToAssign = [];
      for (const tDoc of assignedTeamDocs) {
        if (task.taskScope === 'team_lead') {
          if (tDoc.teamLeadId) studentIdsToAssign.push(tDoc.teamLeadId);
        } else {
          if (Array.isArray(tDoc.members)) {
            tDoc.members.forEach((m) => studentIdsToAssign.push(m));
          }
          if (tDoc.teamLeadId) studentIdsToAssign.push(tDoc.teamLeadId);
        }
      }
      for (const sId of studentIdsToAssign) {
        await TaskAssignment.findOneAndUpdate(
          { taskId: task._id, studentId: sId },
          { $setOnInsert: { status: 'pending' } },
          { upsert: true }
        );
      }
    } catch (assignErr) {
      console.warn('Non-blocking assignment creation note:', assignErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Task published successfully',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task',
    });
  }
};

/**
 * @desc    Update a task
 * @route   PATCH /api/admin/tasks/:id
 * @access  Private/Admin
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const {
      title,
      description,
      topic,
      targetGroup,
      deadline,
      priority,
      assignedTeams,
      deliverables,
      relatedResources,
      status,
    } = req.body;

    if (title) task.title = title.trim();
    if (description) task.description = description.trim();
    if (topic !== undefined) task.topic = topic.trim();
    if (targetGroup) task.targetGroup = targetGroup;
    if (deadline) task.deadline = new Date(deadline);
    if (priority) task.priority = priority;
    if (assignedTeams) task.assignedTeams = assignedTeams;
    if (deliverables) task.deliverables = deliverables;
    if (relatedResources !== undefined) task.relatedResources = relatedResources;
    if (status) task.status = status;

    await task.save();

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task',
    });
  }
};

/**
 * @desc    Delete a task permanently from MongoDB Atlas
 * @route   DELETE /api/admin/tasks/:id
 * @access  Private/Admin
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Clean up all associated TaskAssignment records to prevent orphaned documents in MongoDB Atlas
    await TaskAssignment.deleteMany({ taskId: task._id });

    // Permanently delete task document from MongoDB Atlas
    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};

/**
 * Helper to strictly validate Cohort CSV data
 * Requirements:
 * - Exactly 9 teams (1 through 9)
 * - For EACH team: exactly 1 LEAD, 4 SDs, and 4 JDs
 * - Total students = 81
 * - Required headers: teamNumber, roleCode, name, rollNumber, email, phone, college, branch, backlogs, type
 */
const parseAndValidateCohort = (input) => {
  let rows = [];
  const errors = [];

  if (typeof input === 'string') {
    const lines = input.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { valid: false, errors: ['CSV file is empty or missing data lines.'], records: [] };
    }

    const headerLine = lines[0];
    const rawHeaders = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (['team', 'teamnum', 'teamnumber', 'teamno'].includes(lower)) headerMap.teamNumber = idx;
      else if (['role', 'rolecode', 'designation', 'memberrole'].includes(lower)) headerMap.roleCode = idx;
      else if (['name', 'fullname', 'studentname'].includes(lower)) headerMap.name = idx;
      else if (['roll', 'rollnumber', 'rollno', 'regno', 'registrationnumber'].includes(lower)) headerMap.rollNumber = idx;
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
          `Missing required CSV header columns: ${missingKeys.join(', ')}. Required headers: teamNumber,roleCode,name,rollNumber,email,phone,college,branch,backlogs,type`,
        ],
        records: [],
      };
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',').map((v) => v.trim());
      const cleanValues = values.map((v) => v.replace(/^["']|["']$/g, '').trim());

      rows.push({
        teamNumber: parseInt(cleanValues[headerMap.teamNumber], 10),
        roleCode: cleanValues[headerMap.roleCode] || '',
        name: cleanValues[headerMap.name] || '',
        rollNumber: cleanValues[headerMap.rollNumber] || '',
        email: cleanValues[headerMap.email] || '',
        phone: headerMap.phone !== undefined ? cleanValues[headerMap.phone] || '' : '',
        college: headerMap.college !== undefined ? cleanValues[headerMap.college] || 'KIET' : 'KIET',
        branch: headerMap.branch !== undefined ? cleanValues[headerMap.branch] || 'CSE' : 'CSE',
        backlogs: headerMap.backlogs !== undefined ? parseInt(cleanValues[headerMap.backlogs], 10) || 0 : 0,
        type: headerMap.type !== undefined ? cleanValues[headerMap.type] || 'DS' : 'DS',
        rowNumber: i + 1,
      });
    }
  } else if (Array.isArray(input)) {
    rows = input.map((r, idx) => ({
      teamNumber: parseInt(r.teamNumber || r.teamNum || r.team, 10),
      roleCode: String(r.roleCode || r.role || '').trim(),
      name: String(r.name || r.fullName || '').trim(),
      rollNumber: String(r.rollNumber || r.roll || '').trim(),
      email: String(r.email || '').trim(),
      phone: String(r.phone || r.phoneNumber || '').trim(),
      college: String(r.college || 'KIET').trim(),
      branch: String(r.branch || 'CSE').trim(),
      backlogs: Number(r.backlogs || r.activeBacklogs) || 0,
      type: String(r.type || r.dayScholarHostel || 'DS').trim(),
      rowNumber: idx + 1,
    }));
  } else {
    return { valid: false, errors: ['Invalid cohort data input provided.'], records: [] };
  }

  // Row validations
  const emailRegex = /^\S+@\S+\.\S+$/;
  const emailsSeen = new Set();
  const rollNumbersSeen = new Set();

  rows.forEach((r) => {
    if (!r.teamNumber || isNaN(r.teamNumber) || r.teamNumber < 1 || r.teamNumber > 9) {
      errors.push(`Row ${r.rowNumber}: Team number '${r.teamNumber}' must be an integer between 1 and 9.`);
    }
    if (!r.name) {
      errors.push(`Row ${r.rowNumber}: Student name is required.`);
    }
    if (!r.rollNumber) {
      errors.push(`Row ${r.rowNumber}: Roll number is required.`);
    } else {
      const upperRoll = r.rollNumber.toUpperCase();
      if (rollNumbersSeen.has(upperRoll)) {
        errors.push(`Row ${r.rowNumber}: Duplicate roll number '${r.rollNumber}' detected.`);
      }
      rollNumbersSeen.add(upperRoll);
    }
    if (!r.email || !emailRegex.test(r.email)) {
      errors.push(`Row ${r.rowNumber}: Invalid email address '${r.email}'.`);
    } else {
      const lowerEmail = r.email.toLowerCase();
      if (emailsSeen.has(lowerEmail)) {
        errors.push(`Row ${r.rowNumber}: Duplicate email address '${r.email}' detected.`);
      }
      emailsSeen.add(lowerEmail);
    }

    const code = String(r.roleCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (['LEAD', 'TL', 'TEAMLEAD', 'TEAMLEADER', 'LEADER'].includes(code)) {
      r.normalizedRole = 'LEAD';
    } else if (['SD', 'SD1', 'SD2', 'SD3', 'SD4', 'SENIOR', 'SENIORDEV', 'SENIORDEVELOPER'].includes(code)) {
      r.normalizedRole = 'SD';
    } else if (['JD', 'JD1', 'JD2', 'JD3', 'JD4', 'JUNIOR', 'JUNIORDEV', 'JUNIORDEVELOPER'].includes(code)) {
      r.normalizedRole = 'JD';
    } else {
      errors.push(`Row ${r.rowNumber}: Unrecognized roleCode '${r.roleCode}'. Must be LEAD, SD (SD1–SD4), or JD (JD1–JD4).`);
    }
  });

  // Check 9 teams structure
  for (let teamNum = 1; teamNum <= 9; teamNum++) {
    const teamRows = rows.filter((r) => r.teamNumber === teamNum);
    if (teamRows.length === 0) {
      errors.push(`Team ${teamNum} has no student rows in cohort data.`);
      continue;
    }
    const leads = teamRows.filter((r) => r.normalizedRole === 'LEAD');
    const sds = teamRows.filter((r) => r.normalizedRole === 'SD');
    const jds = teamRows.filter((r) => r.normalizedRole === 'JD');

    if (leads.length !== 1) {
      errors.push(`Team ${teamNum} has ${leads.length} Team Lead(s). Exactly 1 LEAD is required.`);
    }
    if (sds.length !== 4) {
      errors.push(`Team ${teamNum} has ${sds.length} Senior Developer(s). Exactly 4 SDs are required.`);
    }
    if (jds.length !== 4) {
      errors.push(`Team ${teamNum} has ${jds.length} Junior Developer(s). Exactly 4 JDs are required.`);
    }
    if (teamRows.length !== 9) {
      errors.push(`Team ${teamNum} has ${teamRows.length} total members. Exactly 9 members required.`);
    }
  }

  if (rows.length !== 81) {
    errors.push(`Cohort has ${rows.length} total members. Exactly 81 students required (9 teams × 9 members).`);
  }

  return {
    valid: errors.length === 0,
    errors,
    records: rows,
  };
};

/**
 * @desc    Get all batches
 * @route   GET /api/admin/batches
 * @access  Private/Admin
 */
const getBatches = async (req, res) => {
  try {
    let batches = await Batch.find().sort({ createdAt: -1 });

    // Seed default 2026-2027 batch if no batches exist in DB
    if (batches.length === 0) {
      const defaultBatch = await Batch.create({
        id: '2026-2027',
        year: '2026 – 2027',
        status: 'Active Batch',
        teamsCount: 9,
        activeTeamsCount: 9,
        studentsCount: 81,
        avgPerformance: '78%',
        upcoming: false,
      });
      batches = [defaultBatch];
    }

    // Enrich batches with live learner count and team count
    const enrichedBatches = await Promise.all(
      batches.map(async (batchDoc) => {
        const batchObj = batchDoc.toObject();
        const liveCount = await User.countDocuments({
          batch: batchObj.id,
          role: { $ne: 'admin' },
        });
        const teamCount = await Team.countDocuments({ batch: batchObj.id });
        batchObj.studentsCount = liveCount || batchObj.studentsCount || 81;
        batchObj.teamsCount = teamCount || batchObj.teamsCount || 9;
        batchObj.activeTeamsCount = teamCount || batchObj.activeTeamsCount || 9;
        return batchObj;
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedBatches.length,
      batches: enrichedBatches,
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch batches',
    });
  }
};

/**
 * @desc    Create new batch with strictly validated 81-member cohort data
 * @route   POST /api/admin/batches
 * @access  Private/Admin
 */
const createBatchWithCohort = async (req, res) => {
  try {
    const { name, year, status, startDate, endDate, cohortData, csvText } = req.body;

    const rawName = year || name;
    if (!rawName || !rawName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Batch name/year is required (e.g. 2027-2028 or 2027 – 2028).',
      });
    }

    const formattedId = rawName.trim().replace(/\s+/g, '').replace(/–/g, '-');

    const existingBatch = await Batch.findOne({ id: formattedId });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: `Batch '${formattedId}' already exists in database.`,
      });
    }

    const inputData = cohortData || csvText;
    if (!inputData) {
      return res.status(400).json({
        success: false,
        message:
          'Cohort data is strictly required to create a new batch. Upload 81 students (9 Team Leads, 36 SDs, 36 JDs across Teams 1 through 9).',
      });
    }

    const { valid, errors, records } = parseAndValidateCohort(inputData);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message:
          'Cohort data validation failed. You must provide exact data: 9 teams, each with 1 Team Lead, 4 SDs, and 4 JDs.',
        errors,
      });
    }

    // 1. Create or upsert 9 Teams for this new batch
    const teamDocMap = {};
    for (let i = 1; i <= 9; i++) {
      let team = await Team.findOne({ batch: formattedId, teamNumber: i });
      if (!team) {
        team = await Team.create({
          name: `Team ${i}`,
          teamNumber: i,
          track: trackNames[i] || `Track ${i}`,
          batch: formattedId,
          maxMembers: 9,
          teamLeadId: null,
          members: [],
        });
      }
      teamDocMap[i] = team;
    }

    // 2. Create/Update 81 Students in database
    const teamLeadsMap = {};
    const teamMembersMap = {};
    for (let i = 1; i <= 9; i++) {
      teamMembersMap[i] = [];
    }

    for (const record of records) {
      const cleanEmail = record.email.toLowerCase().trim();
      const cleanRoll = record.rollNumber.toUpperCase().trim();
      const isLead = record.normalizedRole === 'LEAD';
      const isSenior = record.normalizedRole === 'SD';
      const yearVal = isSenior ? 3 : 2;

      let user = await User.findOne({
        $or: [{ email: cleanEmail }, { rollNumber: cleanRoll }],
      });

      if (!user) {
        user = new User({
          name: record.name.trim(),
          email: cleanEmail,
          rollNumber: cleanRoll,
          phone: record.phone || null,
          phoneNumber: record.phone || null,
          password: cleanRoll, // password = roll number, will be hashed in pre-save
          college: record.college || 'KIET',
          dayScholarHostel: record.type || 'DS',
          activeBacklogs: Number(record.backlogs) || 0,
          branch: record.branch || 'CSE',
          year: yearVal,
          batch: formattedId,
          memberType: isLead || isSenior ? 'senior_developer' : 'junior_developer',
          role: isLead ? 'teamlead' : 'user',
          status: 'active',
          teamId: teamDocMap[record.teamNumber]._id,
        });
      } else {
        user.name = record.name.trim();
        user.rollNumber = cleanRoll;
        user.phone = record.phone || user.phone;
        user.phoneNumber = record.phone || user.phoneNumber;
        user.college = record.college || user.college || 'KIET';
        user.dayScholarHostel = record.type || user.dayScholarHostel || 'DS';
        user.activeBacklogs = Number(record.backlogs) || 0;
        user.branch = record.branch || user.branch || 'CSE';
        user.year = yearVal;
        user.batch = formattedId;
        user.memberType = isLead || isSenior ? 'senior_developer' : 'junior_developer';
        user.role = isLead ? 'teamlead' : (user.role === 'admin' ? 'admin' : 'user');
        user.status = 'active';
        user.teamId = teamDocMap[record.teamNumber]._id;
      }

      await user.save();

      if (isLead) {
        teamLeadsMap[record.teamNumber] = user._id;
      } else {
        teamMembersMap[record.teamNumber].push(user._id);
      }
    }

    // 3. Link Leads and Members to their respective Teams
    for (let i = 1; i <= 9; i++) {
      const team = teamDocMap[i];
      team.teamLeadId = teamLeadsMap[i] || null;
      team.members = teamMembersMap[i] || [];
      await team.save();
    }

    // 4. Create Batch document
    const newBatch = await Batch.create({
      id: formattedId,
      batchId: formattedId,
      name: rawName.trim(),
      year: rawName.trim(),
      status: status || 'Upcoming',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      teamsCount: 9,
      activeTeamsCount: 9,
      studentsCount: records.length,
      avgPerformance: '0%',
      upcoming: (status || '').toLowerCase().includes('upcoming'),
    });

    console.log(`Successfully initialized Batch ${formattedId} with 9 teams and 81 students.`);

    res.status(201).json({
      success: true,
      message: `Batch '${formattedId}' created successfully with 9 teams, 9 Leads, 36 SDs, and 36 JDs.`,
      batch: newBatch,
    });
  } catch (error) {
    console.error('Batch creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create batch with cohort data',
    });
  }
};

/**
 * @desc    Get team-wise performance analytics across weekly, monthly, and overall timeframes
 * @route   GET /api/admin/teams/analytics
 * @access  Private/Admin
 */
const getTeamPerformanceAnalytics = async (req, res) => {
  try {
    const batchId = req.query.batch || '2026-2027';
    const timeframe = (req.query.timeframe || 'weekly').toLowerCase(); // 'weekly', 'monthly', 'overall'

    const now = new Date();
    let windowStart = new Date(0);
    if (timeframe === 'weekly') {
      windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'monthly') {
      windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch all 9 teams for this batch
    const teams = await Team.find({ batch: batchId })
      .sort({ teamNumber: 1 })
      .populate('teamLeadId', 'name email role')
      .populate('members', 'name email role');

    // 2. Fetch all tasks (both Admin & Team Lead tasks)
    const allTasks = await Task.find().populate('createdBy', 'name role email');
    const allAssignments = await TaskAssignment.find();

    // Map each team with unified, standardized submission metrics
    const teamsAnalytics = teams.map((teamDoc) =>
      computeTeamMetrics(teamDoc, allTasks, allAssignments, timeframe, now)
    );

    // Generate Recharts timeline data points
    let trendData = [];
    if (timeframe === 'weekly') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      trendData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayLabel = dayNames[d.getDay()];
        const daySubs = allAssignments.filter((a) => {
          if (!a.submittedAt) return false;
          const sDate = new Date(a.submittedAt);
          return sDate.toDateString() === d.toDateString();
        }).length;
        return {
          label: dayLabel,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          submissions: daySubs,
          avgPerformance: Math.round(
            teamsAnalytics.reduce((acc, t) => acc + t.score, 0) / Math.max(teamsAnalytics.length, 1)
          ),
        };
      });
    } else if (timeframe === 'monthly') {
      const avg = Math.round(
        teamsAnalytics.reduce((acc, t) => acc + t.score, 0) / Math.max(teamsAnalytics.length, 1)
      );
      const weekBuckets = [
        { label: 'Week 1', startDays: 28, endDays: 21 },
        { label: 'Week 2', startDays: 21, endDays: 14 },
        { label: 'Week 3', startDays: 14, endDays: 7 },
        { label: 'Week 4', startDays: 7, endDays: 0 },
      ];
      trendData = weekBuckets.map((bucket) => {
        const start = new Date(now.getTime() - bucket.startDays * 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() - bucket.endDays * 24 * 60 * 60 * 1000);
        const count = allAssignments.filter((a) => {
          if (!a.submittedAt) return false;
          const s = new Date(a.submittedAt);
          return s >= start && s <= end;
        }).length;
        return {
          label: bucket.label,
          submissions: count,
          avgPerformance: avg,
        };
      });
    } else {
      trendData = teamsAnalytics.map((t) => ({
        label: `T${t.teamNumber}`,
        teamName: t.name,
        track: t.track,
        score: t.score,
        completed: t.completedAssignments,
        submitted: t.submittedAssignments,
      }));
    }

    const totalSubmissions = teamsAnalytics.reduce(
      (acc, t) => acc + t.completedAssignments + t.submittedAssignments,
      0
    );
    const avgScore = Math.round(
      teamsAnalytics.reduce((acc, t) => acc + t.score, 0) / Math.max(teamsAnalytics.length, 1)
    );
    const sortedByScore = [...teamsAnalytics].sort((a, b) => b.score - a.score);
    const topTeam = sortedByScore[0] && sortedByScore[0].score > 0 ? sortedByScore[0] : null;

    res.status(200).json({
      success: true,
      batchId,
      timeframe,
      teams: teamsAnalytics,
      trendData,
      summary: {
        averageScore: avgScore,
        totalSubmissions,
        topTeam: topTeam
          ? { teamNumber: topTeam.teamNumber, name: topTeam.name, score: topTeam.score, track: topTeam.track }
          : null,
        activeTeamsCount: teamsAnalytics.filter((t) => t.score > 0).length,
        totalTeams: teamsAnalytics.length,
      },
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate team performance analytics',
    });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  getAdminStats,
  getTeams,
  getTeamPerformanceAnalytics,
  assignTeamLead,
  removeTeamMember,
  getResources,
  createResource,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getBatches,
  createBatchWithCohort,
};


