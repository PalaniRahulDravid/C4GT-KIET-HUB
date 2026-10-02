const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Batch = require('../models/Batch');
const Resource = require('../models/Resource');
const Notification = require('../models/Notification');
const StudentActivity = require('../models/StudentActivity');
const StudentResourceProgress = require('../models/StudentResourceProgress');
const TeamRequest = require('../models/TeamRequest');
const bcrypt = require('bcryptjs');
const { isEligibleMember, syncUserTaskAssignmentsOnRoleChange } = require('../services/taskSyncService');

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
      .select('-__v')
      .lean();

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
 * @desc    Delete a user permanently from database and cascade clean relations (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    if (user.role === 'admin' && req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own active account.',
      });
    }

    // 1. If user was a team lead, clear lead from teams
    await Team.updateMany({ teamLeadId: id }, { $set: { teamLeadId: null } });

    // 2. Remove user from any team member arrays
    await Team.updateMany({ members: id }, { $pull: { members: id } });

    // 3. Cascade cleanup of student assignments, progress, activities, notifications, requests
    await Promise.all([
      TaskAssignment.deleteMany({ studentId: id }),
      StudentActivity.deleteMany({ studentId: id }),
      StudentResourceProgress.deleteMany({ studentId: id }),
      Notification.deleteMany({ studentId: id }),
      TeamRequest.deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] }),
      Task.updateMany({ assignedTo: id }, { $pull: { assignedTo: id } }),
    ]);

    // 4. Permanently delete user document from MongoDB Atlas
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.email}) permanently deleted from database.`,
      deletedUserId: id,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
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
    const [totalUsers, students, teamLeads, admins, teamsCount, tasksCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['user', 'student'] } }),
      User.countDocuments({ role: { $in: ['teamlead', 'team_lead'] } }),
      User.countDocuments({ role: 'admin' }),
      Team.countDocuments(),
      Task.countDocuments(),
    ]);

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

  // Compute granular individual member performance metrics
  const membersAnalytics = allTeamUserIds.map((uid) => {
    const userAssignments = relevantAssignments.filter(
      (a) => (a.studentId?._id || a.studentId || '').toString() === uid.toString()
    );
    const mCompleted = userAssignments.filter((a) => a.status === 'completed').length;
    const mSubmitted = userAssignments.filter((a) => a.status === 'submitted').length;
    const mInProgress = userAssignments.filter((a) => a.status === 'in_progress').length;
    const mPending = userAssignments.filter((a) => a.status === 'pending').length;
    const mTotal = userAssignments.length;
    const mScore =
      mTotal > 0
        ? Math.min(100, Math.round(((mCompleted * 1.0 + mSubmitted * 0.7 + mInProgress * 0.2) / mTotal) * 100))
        : 0;

    return {
      userId: uid,
      completed: mCompleted,
      submitted: mSubmitted,
      inProgress: mInProgress,
      pending: mPending,
      totalAssignments: mTotal,
      score: mScore,
      pct: `${mScore}%`,
    };
  });

  // Count how many tasks have at least one completed assignment by this team
  const tasksCompletedCount = relevantTasks.filter((t) => {
    const tAssigns = relevantAssignments.filter((a) => (a.taskId?._id || a.taskId).toString() === t._id.toString());
    return tAssigns.some((a) => a.status === 'completed');
  }).length;

  return {
    ...team,
    teamLeadName: team.teamLeadId?.name || 'Unassigned',
    membersCount: (team.members || []).length + (teamLeadId ? 1 : 0),
    membersAnalytics,
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
    let targetBatch = null;
    if (req.query.batch) {
      targetBatch = await Batch.findOne({
        $or: [
          { id: req.query.batch },
          { batchId: req.query.batch },
          { year: req.query.batch },
          { name: req.query.batch },
        ],
      });
    } else {
      targetBatch =
        (await Batch.findOne({ status: 'Active Batch' }).sort({ createdAt: -1 })) ||
        (await Batch.findOne().sort({ createdAt: -1 }));
    }

    // If no batch exists in database at all, do not seed phantom teams
    if (!targetBatch) {
      return res.status(200).json({
        success: true,
        count: 0,
        teams: [],
        message: 'No batches found in database.',
      });
    }

    const batchId = targetBatch.id;

    // Ensure all 9 teams (1 through 9) exist with max capacity of 9
    for (let i = 1; i <= 9; i++) {
      let team = await Team.findOne({ teamNumber: i, batch: batchId });
      if (!team) {
        await Team.create({
          name: `Team ${i}`,
          teamNumber: i,
          project: '',
          track: '',
          batch: batchId,
          maxMembers: 9,
          teamLeadId: null,
          members: [],
        });
      } else {
        let changed = false;
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

    // Clean up members array on loaded docs if any populated member was null or dangling
    for (const t of teams) {
      if (Array.isArray(t.members)) {
        const hasNullOrLead = t.members.some(
          (m) => !m || (t.teamLeadId && m._id?.toString() === t.teamLeadId._id?.toString())
        );
        if (hasNullOrLead) {
          t.members = t.members.filter(
            (m) => m && (!t.teamLeadId || m._id?.toString() !== t.teamLeadId._id?.toString())
          );
          await Team.findByIdAndUpdate(t._id, { members: t.members.map((m) => m._id) });
        }
      }
    }

    // Fetch all published tasks and assignments to compute team progress in parallel
    const [allTasks, allAssignments] = await Promise.all([
      Task.find().populate('createdBy', 'name role email').lean(),
      TaskAssignment.find().lean(),
    ]);

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
 * @desc    Update team project/responsibility and general properties in MongoDB Atlas
 * @route   PATCH /api/admin/teams/:id
 * @access  Private/Admin
 */
const updateTeam = async (req, res) => {
  try {
    const { project, name, track } = req.body;
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

    if (project !== undefined) {
      team.project = String(project).trim();
    }
    if (name !== undefined && String(name).trim()) {
      team.name = String(name).trim();
    }
    if (track !== undefined) {
      team.track = String(track).trim();
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    const allTasks = await Task.find().populate('createdBy', 'name role email');
    const allAssignments = await TaskAssignment.find();
    const enrichedTeam = computeTeamMetrics(populatedTeam, allTasks, allAssignments, 'overall');

    res.status(200).json({
      success: true,
      message: `Team ${team.teamNumber} project updated successfully in MongoDB Atlas.`,
      team: enrichedTeam,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update team project',
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

    if (team.teamLeadId && team.teamLeadId.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the Team Lead from members list. To change or remove the Team Lead, use the Assign Lead dropdown on the team card.',
      });
    }

    // 1. Remove member from this team's roster
    team.members = (team.members || []).filter((m) => m && m.toString() !== memberId);
    await team.save();

    // 2. Remove member from any other team's members just in case
    await Team.updateMany({ members: memberId }, { $pull: { members: memberId } });

    // 3. Cascade cleanup of student assignments, progress, activities, notifications, requests
    await Promise.all([
      TaskAssignment.deleteMany({ studentId: memberId }),
      StudentActivity.deleteMany({ studentId: memberId }),
      StudentResourceProgress.deleteMany({ studentId: memberId }),
      Notification.deleteMany({ studentId: memberId }),
      TeamRequest.deleteMany({ $or: [{ fromUserId: memberId }, { toUserId: memberId }] }),
      Task.updateMany({ assignedTo: memberId }, { $pull: { assignedTo: memberId } }),
    ]);

    // 4. Permanently delete student from MongoDB User collection
    const deletedUser = await User.findByIdAndDelete(memberId);

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    res.status(200).json({
      success: true,
      message: deletedUser
        ? `Student ${deletedUser.name} removed and permanently deleted from database.`
        : 'Member removed and deleted from database.',
      team: updatedTeam,
      deletedStudentId: memberId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove member from team',
    });
  }
};

/**
 * @desc    Add a new student member to a team (Admin)
 * @route   POST /api/admin/teams/:id/members
 * @access  Private/Admin
 */
const addTeamMember = async (req, res) => {
  try {
    const { id: teamId } = req.params;
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

    // Clean up any ghost IDs or duplicate lead IDs in team.members
    const validMembers = await User.find({ _id: { $in: team.members || [] } }).select('_id');
    const validMemberIdStrings = validMembers.map((u) => u._id.toString());
    team.members = (team.members || []).filter(
      (m) =>
        m &&
        validMemberIdStrings.includes(m.toString()) &&
        m.toString() !== team.teamLeadId?.toString()
    );

    const currentMemberCount = team.members.length;
    const maxMembersAllowed = team.maxMembers || 9;
    const totalCount = currentMemberCount + (team.teamLeadId ? 1 : 0);

    if (totalCount >= maxMembersAllowed) {
      return res.status(400).json({
        success: false,
        message: `Team has reached its maximum capacity limit of ${maxMembersAllowed} members (1 Lead + 8 Members). Please remove a member who quit before adding a new student.`,
      });
    }

    const {
      name,
      rollNumber,
      email,
      phone,
      phoneNumber,
      college = 'KIET',
      branch = 'CSE',
      year,
      roleCode,
      memberType,
      type = 'DS',
      dayScholarHostel,
      backlogs = 0,
      activeBacklogs = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student full name is required' });
    }
    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Roll number is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = rollNumber.toUpperCase().trim();
    const cleanPhone = (phone || phoneNumber || '').trim();
    const isSenior = roleCode === 'SD' || memberType === 'senior_developer';
    const yearVal = Number(year) || (isSenior ? 4 : 3);
    const mType = isSenior ? 'senior_developer' : 'junior_developer';
    const residence = (dayScholarHostel || type || 'DS').trim().toUpperCase();
    const backlogsCount = Number(activeBacklogs || backlogs) || 0;

    // Check if Roll Number or Email belongs to any Team Lead or Admin
    const userByEmail = await User.findOne({ email: cleanEmail });
    const userByRoll = await User.findOne({ rollNumber: cleanRoll });

    const existingLeadOrAdmin =
      (userByEmail && (userByEmail.role === 'teamlead' || userByEmail.role === 'admin')) ||
      (userByRoll && (userByRoll.role === 'teamlead' || userByRoll.role === 'admin'));

    if (existingLeadOrAdmin) {
      const match = userByEmail || userByRoll;
      return res.status(400).json({
        success: false,
        message: `Cannot add student: Credentials belong to an active Team Lead or Administrator (${match.name} - ${match.role}). Team Leads cannot be overwritten or replaced with student members.`,
      });
    }

    // Check if student is already assigned to a team
    if (userByEmail && userByEmail.teamId) {
      const existingTeam = await Team.findById(userByEmail.teamId);
      return res.status(400).json({
        success: false,
        message: `A student with email "${cleanEmail}" is already assigned to ${existingTeam ? existingTeam.name : 'a team'} (${userByEmail.name}).`,
      });
    }

    if (userByRoll && userByRoll.teamId) {
      const existingTeam = await Team.findById(userByRoll.teamId);
      return res.status(400).json({
        success: false,
        message: `A student with Roll Number "${cleanRoll}" is already assigned to ${existingTeam ? existingTeam.name : 'a team'} (${userByRoll.name}).`,
      });
    }

    // Check if email and roll number belong to different users
    if (userByEmail && userByRoll && userByEmail._id.toString() !== userByRoll._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `The email "${cleanEmail}" and Roll Number "${cleanRoll}" belong to two different existing user records. Please provide consistent credentials.`,
      });
    }

    let user = userByEmail || userByRoll;

    if (user) {
      // Re-assigning an existing unassigned student
      user.name = name.trim();
      user.rollNumber = cleanRoll;
      user.email = cleanEmail;
      if (cleanPhone) {
        user.phone = cleanPhone;
        user.phoneNumber = cleanPhone;
      }
      user.college = college || user.college || 'KIET';
      user.branch = branch || user.branch || 'CSE';
      user.year = yearVal;
      user.memberType = mType;
      user.dayScholarHostel = residence;
      user.activeBacklogs = backlogsCount;
      user.teamId = team._id;
      user.batch = team.batch || user.batch || '2026-2027';
      user.role = 'user';
      user.status = 'active';
      await user.save();
    } else {
      // Create new student
      user = new User({
        name: name.trim(),
        email: cleanEmail,
        rollNumber: cleanRoll,
        phone: cleanPhone || null,
        phoneNumber: cleanPhone || null,
        password: cleanRoll,
        college: college || 'KIET',
        dayScholarHostel: residence,
        activeBacklogs: backlogsCount,
        branch: branch || 'CSE',
        year: yearVal,
        batch: team.batch || '2026-2027',
        memberType: mType,
        role: 'user',
        status: 'active',
        teamId: team._id,
      });
      await user.save();
    }

    // Keep task assignments in sync with current memberType (clean up tasks from previous tracks)
    await syncUserTaskAssignmentsOnRoleChange(user._id, mType);

    // Add student exclusively to team.members without modifying teamLeadId
    if (!team.members) team.members = [];
    if (team.teamLeadId) {
      team.members = team.members.filter(
        (m) => m && m.toString() !== team.teamLeadId.toString()
      );
    }
    if (!team.members.some((m) => m && m.toString() === user._id.toString())) {
      team.members.push(user._id);
    }
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

    res.status(201).json({
      success: true,
      message: `Student ${user.name} (${user.rollNumber}) successfully added to ${team.name}.`,
      member: user,
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add student to team',
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
      .populate('createdBy', 'name email avatar')
      .lean();

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
    const { title, type, description, url, topic, visibility, targetGroup } = req.body;

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
      visibility: visibility === 'published' ? 'published' : 'library',
      targetGroup: targetGroup || 'all',
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
    // Admin workspace strictly manages tasks created by administrators.
    // Team lead tasks are internal to their teams and are not displayed or reviewed in the admin tasks dashboard.
    const existingBatches = await Batch.find().select('id batchId year name');
    const validBatchIdentifiers = [];
    existingBatches.forEach((b) => {
      if (b.id) validBatchIdentifiers.push(b.id);
      if (b.batchId) validBatchIdentifiers.push(b.batchId);
      if (b.year) validBatchIdentifiers.push(b.year);
      if (b.name) validBatchIdentifiers.push(b.name);
    });

    if (validBatchIdentifiers.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        tasks: [],
      });
    }

    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map((u) => u._id);

    const taskFilter = {
      $or: [
        { createdBy: { $in: adminUserIds } },
        { createdBy: req.user._id },
      ],
    };
    if (req.query.batch) {
      const bDoc = await Batch.findOne({
        $or: [{ id: req.query.batch }, { batchId: req.query.batch }, { year: req.query.batch }, { name: req.query.batch }],
      });
      const matchKeys = [req.query.batch];
      if (bDoc) {
        if (bDoc.id) matchKeys.push(bDoc.id);
        if (bDoc.batchId) matchKeys.push(bDoc.batchId);
        if (bDoc.year) matchKeys.push(bDoc.year);
        if (bDoc.name) matchKeys.push(bDoc.name);
      }
      taskFilter.batch = { $in: Array.from(new Set(matchKeys)) };
    } else {
      taskFilter.batch = { $in: validBatchIdentifiers };
    }

    const tasks = await Task.find(taskFilter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar role')
      .populate('relatedResources', 'title type description url topic fileSize fileFormat');

    const taskIds = tasks.map((t) => t._id);
    const taskAssignments = await TaskAssignment.find({ taskId: { $in: taskIds } })
      .populate('studentId', 'name rollNumber email avatar memberType teamId')
      .populate('reviewedBy', 'name email avatar role');

    // Fetch team map to associate each student with their team number (scoped to batch if filtered)
    const teamQuery = {};
    if (req.query.batch && taskFilter.batch) {
      teamQuery.batch = taskFilter.batch;
    }
    const teams = await Team.find(teamQuery).select('teamNumber name members teamLeadId');
    const userTeamMap = {};
    teams.forEach((tm) => {
      if (tm.teamLeadId) userTeamMap[tm.teamLeadId.toString()] = tm.teamNumber;
      if (Array.isArray(tm.members)) {
        tm.members.forEach((m) => {
          userTeamMap[m.toString()] = tm.teamNumber;
        });
      }
    });

    const orphanedPendingAssignmentIds = [];

    const tasksWithStats = tasks.map((t) => {
      const tObj = t.toObject ? t.toObject() : t;
      const relatedAssignments = taskAssignments
        .filter((a) => {
          if (a.taskId.toString() !== t._id.toString()) return false;
          if (!a.studentId) return false;
          const eligible = isEligibleMember(a.studentId, t.targetGroup);
          if (!eligible && (a.status === 'pending' || a.status === 'in_progress')) {
            orphanedPendingAssignmentIds.push(a._id);
            return false;
          }
          return eligible;
        })
        .map((a) => {
          const aObj = a.toObject ? a.toObject() : a;
          const sid = aObj.studentId?._id ? aObj.studentId._id.toString() : (aObj.studentId ? aObj.studentId.toString() : '');
          aObj.teamNumber = userTeamMap[sid] || null;
          return aObj;
        });

      tObj.totalAssignments = relatedAssignments.length;
      tObj.completedCount = relatedAssignments.filter((a) => a.status === 'completed').length;
      tObj.submittedCount = relatedAssignments.filter((a) => a.status === 'submitted').length;
      tObj.assignments = relatedAssignments;
      return tObj;
    });

    if (orphanedPendingAssignmentIds.length > 0) {
      TaskAssignment.deleteMany({ _id: { $in: orphanedPendingAssignmentIds } }).catch((err) => {
        console.warn('Background cleanup of orphaned assignments:', err.message);
      });
    }

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

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline date format',
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (deadlineDate < todayStart) {
      return res.status(400).json({
        success: false,
        message: 'Task deadline cannot be set to a past date. Please select today or an upcoming date.',
      });
    }

    let targetBatch = null;
    if (req.body.batch) {
      targetBatch = await Batch.findOne({
        $or: [{ id: req.body.batch }, { batchId: req.body.batch }, { year: req.body.batch }, { name: req.body.batch }],
      });
    }
    if (!targetBatch) {
      targetBatch = (await Batch.findOne({ status: 'Active Batch' }).sort({ createdAt: -1 })) || (await Batch.findOne().sort({ createdAt: -1 }));
    }
    const taskBatch = targetBatch ? (targetBatch.id || targetBatch.batchId || targetBatch.year) : (req.body.batch || null);

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
      deliverables: Array.isArray(deliverables)
        ? deliverables.filter((d) => typeof d === 'string' && d.trim().length > 0).map((d) => d.trim())
        : [],
      relatedResources: Array.isArray(relatedResources) ? relatedResources : [],
      status: 'Published',
      createdBy: req.user._id,
      taskScope: 'students',
      batch: taskBatch,
    });

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar role');

    // Create initial TaskAssignment records ONLY for students matching targetGroup in assigned teams FOR THIS BATCH
    try {
      const teamFilter = { teamNumber: { $in: task.assignedTeams } };
      if (task.batch) {
        const batchKeys = [task.batch];
        if (targetBatch) {
          if (targetBatch.id) batchKeys.push(targetBatch.id);
          if (targetBatch.batchId) batchKeys.push(targetBatch.batchId);
          if (targetBatch.year) batchKeys.push(targetBatch.year);
        }
        teamFilter.batch = { $in: Array.from(new Set(batchKeys)) };
      }
      const assignedTeamDocs = await Team.find(teamFilter)
        .populate('members', 'role memberType')
        .populate('teamLeadId', 'role memberType');

      const studentIdsToAssign = [];
      for (const tDoc of assignedTeamDocs) {
        const potentialMembers = [];
        if (Array.isArray(tDoc.members)) {
          potentialMembers.push(...tDoc.members);
        }
        if (tDoc.teamLeadId) {
          potentialMembers.push(tDoc.teamLeadId);
        }

        for (const userObj of potentialMembers) {
          if (!userObj || !userObj._id) continue;
          const uId = userObj._id.toString();
          const mType = userObj.memberType;

          // Target group check:
          // 'junior_developers' -> only junior_developer
          // 'developer_interns' -> developer_intern or senior_developer
          // 'both' / 'all' -> both junior_developer and developer_intern / senior_developer
          let isEligible = false;
          if (task.targetGroup === 'junior_developers') {
            isEligible = mType === 'junior_developer';
          } else if (task.targetGroup === 'developer_interns') {
            isEligible = mType === 'developer_intern' || mType === 'senior_developer';
          } else {
            isEligible = true;
          }

          if (isEligible && !studentIdsToAssign.includes(uId)) {
            studentIdsToAssign.push(uId);
          }
        }
      }

      for (const sId of studentIdsToAssign) {
        await TaskAssignment.findOneAndUpdate(
          { taskId: task._id, studentId: sId },
          { $setOnInsert: { status: 'pending' } },
          { upsert: true }
        );
      }

      // Populate created assignments so the frontend immediately has student data upon creation
      const createdAssignments = await TaskAssignment.find({ taskId: task._id })
        .populate('studentId', 'name rollNumber email avatar memberType teamId')
        .populate('reviewedBy', 'name email avatar role');

      const teams = await Team.find().select('teamNumber name members teamLeadId');
      const userTeamMap = {};
      teams.forEach((tm) => {
        if (tm.teamLeadId) userTeamMap[tm.teamLeadId.toString()] = tm.teamNumber;
        if (Array.isArray(tm.members)) {
          tm.members.forEach((m) => {
            userTeamMap[m.toString()] = tm.teamNumber;
          });
        }
      });

      const relatedAssignments = createdAssignments
        .filter((a) => a.studentId && isEligibleMember(a.studentId, task.targetGroup))
        .map((a) => {
          const aObj = a.toObject ? a.toObject() : a;
          const sid = aObj.studentId?._id ? aObj.studentId._id.toString() : (aObj.studentId ? aObj.studentId.toString() : '');
          aObj.teamNumber = userTeamMap[sid] || null;
          return aObj;
        });

      const taskObj = populatedTask.toObject ? populatedTask.toObject() : populatedTask;
      taskObj.assignments = relatedAssignments;
      taskObj.totalAssignments = relatedAssignments.length;
      taskObj.completedCount = 0;
      taskObj.submittedCount = 0;

      return res.status(201).json({
        success: true,
        message: 'Task published successfully',
        task: taskObj,
      });
    } catch (assignErr) {
      console.warn('Non-blocking assignment creation note:', assignErr.message);
    }

    const fallbackObj = populatedTask.toObject ? populatedTask.toObject() : populatedTask;
    fallbackObj.assignments = fallbackObj.assignments || [];
    fallbackObj.totalAssignments = fallbackObj.totalAssignments || 0;
    fallbackObj.completedCount = 0;
    fallbackObj.submittedCount = 0;

    res.status(201).json({
      success: true,
      message: 'Task published successfully',
      task: fallbackObj,
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

    const oldTargetGroup = task.targetGroup;
    const oldAssignedTeams = task.assignedTeams;

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

    // If targetGroup or assignedTeams changed, re-sync eligible assignments
    if (
      (targetGroup && targetGroup !== oldTargetGroup) ||
      (assignedTeams && JSON.stringify(assignedTeams) !== JSON.stringify(oldAssignedTeams))
    ) {
      try {
        const assignedTeamDocs = await Team.find({ teamNumber: { $in: task.assignedTeams } })
          .populate('members', 'role memberType')
          .populate('teamLeadId', 'role memberType');

        const eligibleIds = new Set();
        for (const tDoc of assignedTeamDocs) {
          const potential = [...(tDoc.members || [])];
          if (tDoc.teamLeadId) potential.push(tDoc.teamLeadId);

          for (const u of potential) {
            if (!u || !u._id) continue;
            const mType = u.memberType;
            let isEligible = false;
            if (task.targetGroup === 'junior_developers') {
              isEligible = mType === 'junior_developer';
            } else if (task.targetGroup === 'developer_interns') {
              isEligible = mType === 'developer_intern' || mType === 'senior_developer';
            } else {
              isEligible = true;
            }
            if (isEligible) eligibleIds.add(u._id.toString());
          }
        }

        // Add missing eligible ones
        for (const sId of eligibleIds) {
          await TaskAssignment.findOneAndUpdate(
            { taskId: task._id, studentId: sId },
            { $setOnInsert: { status: 'pending' } },
            { upsert: true }
          );
        }

        // Remove pending assignments that are no longer eligible
        await TaskAssignment.deleteMany({
          taskId: task._id,
          studentId: { $nin: Array.from(eligibleIds) },
          status: 'pending',
        });
      } catch (syncErr) {
        console.warn('Re-sync assignment warning:', syncErr.message);
      }
    }

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar role');

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
 * @desc    Admin review student deliverables submission (Accept & Mark Completed or Request Revision)
 * @route   POST /api/admin/tasks/:taskId/review/:studentId
 * @access  Private/Admin
 */
const reviewTaskSubmission = async (req, res) => {
  try {
    const { taskId, studentId } = req.params;
    const { action, reviewNotes } = req.body; // 'accept' or 'request_revision'

    if (!['accept', 'request_revision'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'accept' or 'request_revision'",
      });
    }

    const task = await Task.findById(taskId).populate('createdBy', 'name email role');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Admin can ONLY review tasks assigned by administrators.
    // Tasks created by Team Leads are internal and reviewed exclusively by their Team Lead.
    const creatorRole = task.createdBy?.role ? String(task.createdBy.role).toLowerCase().trim() : '';
    if (creatorRole && creatorRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins can only review tasks created by administrators. Team Lead tasks are reviewed by the respective Team Lead.',
      });
    }

    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    let assignment = await TaskAssignment.findOne({ taskId: task._id, studentId: studentUser._id });

    // Once approved, status is finalized and cannot be modified or undone
    if (assignment && assignment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This task submission has already been approved and completed. Approvals are final and cannot be undone.',
      });
    }

    if (!assignment) {
      assignment = new TaskAssignment({
        taskId: task._id,
        studentId: studentUser._id,
        status: action === 'accept' ? 'completed' : 'revision_requested',
      });
    } else {
      assignment.status = action === 'accept' ? 'completed' : 'revision_requested';
    }

    assignment.reviewedBy = req.user._id;
    assignment.reviewedAt = new Date();
    if (reviewNotes !== undefined) {
      assignment.reviewNotes = reviewNotes ? reviewNotes.trim() : '';
    }

    if (action === 'accept') {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }

    await assignment.save();

    // Dispatch notification to student
    try {
      await Notification.create({
        studentId: studentUser._id,
        taskId: task._id,
        title: action === 'accept' ? `Admin Task Approved: ${task.title}` : `Admin Requested Changes: ${task.title}`,
        message:
          action === 'accept'
            ? `Admin ${req.user.name} reviewed and accepted your deliverables! Task is marked Completed.`
            : `Admin ${req.user.name} reviewed your submission and requested updates: ${reviewNotes || 'Please update your deliverables.'}`,
        type: action === 'accept' ? 'task_completed' : 'task_assigned',
        assignedBy: `Admin (${req.user.name})`,
      });
    } catch (notifErr) {
      console.warn('Notification creation error:', notifErr.message);
    }

    const populatedAssignment = await TaskAssignment.findById(assignment._id)
      .populate('studentId', 'name rollNumber email memberType avatar')
      .populate('reviewedBy', 'name email avatar role');

    res.status(200).json({
      success: true,
      message:
        action === 'accept'
          ? `Work accepted and marked as completed for ${studentUser.name}`
          : `Revision requested from ${studentUser.name}`,
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error('Error reviewing task submission by admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to review task submission',
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
/**
 * Robust CSV Line Parser
 * Handles commas, quotes, double-quotes (""), and whitespace
 */
const parseCsvLine = (text) => {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
};

/**
 * Helper to validate Cohort CSV data
 * Requirements:
 * - Exactly 9 teams (1 through 9)
 * - For EACH team: exactly 1 LEAD, 4 SDs, and 4 JDs
 * - Total students = 81
 * - Supported columns:
 *     1. Team No
 *     2. Role
 *     3. Name of the Student
 *     4. Roll No
 *     5. PHONE NO
 *     6. Mail ID
 * - Other fields (college, branch, backlogs, type) default cleanly
 *   and students can update them directly from their profile.
 */
const parseAndValidateCohort = (input) => {
  let rows = [];
  const errors = [];

  if (typeof input === 'string') {
    const lines = input.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { valid: false, errors: ['CSV file is empty or missing data lines.'], records: [] };
    }

    // Locate header line (skips potential title banner row like 'K-Hub Final List')
    let headerLineIndex = -1;
    let headerMap = {};

    for (let lIdx = 0; lIdx < Math.min(lines.length, 5); lIdx++) {
      const candidateHeaders = parseCsvLine(lines[lIdx]).map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const tempMap = {};
      candidateHeaders.forEach((h, idx) => {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['team', 'teamnum', 'teamnumber', 'teamno', 'teams', 'teamid'].includes(lower) || lower.startsWith('team')) {
          tempMap.teamNumber = idx;
        } else if (['role', 'rolecode', 'designation', 'memberrole', 'roles'].includes(lower) || lower.startsWith('role')) {
          tempMap.roleCode = idx;
        } else if (['name', 'fullname', 'studentname', 'nameofthestudent', 'student', 'names'].includes(lower) || lower.includes('name') || lower.includes('student')) {
          tempMap.name = idx;
        } else if (['roll', 'rollnumber', 'rollno', 'regno', 'registrationnumber', 'roll_no'].includes(lower) || lower.startsWith('roll') || lower.startsWith('reg')) {
          tempMap.rollNumber = idx;
        } else if (['phone', 'phonenumber', 'phoneno', 'mobile', 'mobileno', 'contact', 'contactno', 'phone_no'].includes(lower) || lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
          tempMap.phone = idx;
        } else if (['email', 'mail', 'emailaddress', 'mailid', 'emailid', 'mail_id', 'email_id'].includes(lower) || lower.includes('mail') || lower.includes('email')) {
          tempMap.email = idx;
        } else if (lower.includes('college') || lower.includes('institution') || lower.includes('campus')) {
          tempMap.college = idx;
        } else if (lower.includes('branch') || lower.includes('department') || lower.includes('dept')) {
          tempMap.branch = idx;
        } else if (lower.includes('backlog')) {
          tempMap.backlogs = idx;
        } else if (lower.includes('type') || lower.includes('dayscholar') || lower.includes('hostel') || lower.includes('residence')) {
          tempMap.type = idx;
        }
      });

      const matchedCount = ['teamNumber', 'roleCode', 'name', 'rollNumber', 'email'].filter((k) => tempMap[k] !== undefined).length;
      if (matchedCount >= 3) {
        headerLineIndex = lIdx;
        headerMap = tempMap;
        break;
      }
    }

    if (headerLineIndex === -1) {
      headerLineIndex = 0;
      const rawHeaders = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^["']|["']$/g, ''));
      rawHeaders.forEach((h, idx) => {
        const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (['team', 'teamnum', 'teamnumber', 'teamno', 'teams', 'teamid'].includes(lower) || lower.startsWith('team')) headerMap.teamNumber = idx;
        else if (['role', 'rolecode', 'designation', 'memberrole', 'roles'].includes(lower) || lower.startsWith('role')) headerMap.roleCode = idx;
        else if (['name', 'fullname', 'studentname', 'nameofthestudent', 'student', 'names'].includes(lower) || lower.includes('name') || lower.includes('student')) headerMap.name = idx;
        else if (['roll', 'rollnumber', 'rollno', 'regno', 'registrationnumber', 'roll_no'].includes(lower) || lower.startsWith('roll') || lower.startsWith('reg')) headerMap.rollNumber = idx;
        else if (['phone', 'phonenumber', 'phoneno', 'mobile', 'mobileno', 'contact', 'contactno', 'phone_no'].includes(lower) || lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) headerMap.phone = idx;
        else if (['email', 'mail', 'emailaddress', 'mailid', 'emailid', 'mail_id', 'email_id'].includes(lower) || lower.includes('mail') || lower.includes('email')) headerMap.email = idx;
      });
    }

    const requiredKeys = ['teamNumber', 'roleCode', 'name', 'rollNumber', 'email'];
    const missingKeys = requiredKeys.filter((k) => headerMap[k] === undefined);
    if (missingKeys.length > 0) {
      return {
        valid: false,
        errors: [
          `Missing required CSV header columns: ${missingKeys.join(', ')}. Expected columns: Team No, Role, Name of the Student, Roll No, PHONE NO, Mail ID`,
        ],
        records: [],
      };
    }

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cleanValues = parseCsvLine(line).map((v) => v.replace(/^["']|["']$/g, '').trim());
      if (cleanValues.every((v) => !v)) continue;

      rows.push({
        teamNumber: parseInt(cleanValues[headerMap.teamNumber], 10),
        roleCode: cleanValues[headerMap.roleCode] || '',
        name: cleanValues[headerMap.name] || '',
        rollNumber: cleanValues[headerMap.rollNumber] || '',
        email: cleanValues[headerMap.email] || '',
        phone: headerMap.phone !== undefined ? cleanValues[headerMap.phone] || '' : '',
        college: headerMap.college !== undefined && cleanValues[headerMap.college] ? cleanValues[headerMap.college] : 'KIET',
        branch: headerMap.branch !== undefined && cleanValues[headerMap.branch] ? cleanValues[headerMap.branch] : 'CSE',
        backlogs: headerMap.backlogs !== undefined && cleanValues[headerMap.backlogs] ? parseInt(cleanValues[headerMap.backlogs], 10) || 0 : 0,
        type: headerMap.type !== undefined && cleanValues[headerMap.type] ? cleanValues[headerMap.type] : 'DS',
        rowNumber: i + 1,
      });
    }
  } else if (Array.isArray(input)) {
    rows = input.map((r, idx) => ({
      teamNumber: parseInt(r.teamNumber || r.teamNum || r.team || r['Team No'] || r.teamNo, 10),
      roleCode: String(r.roleCode || r.role || r['Role'] || '').trim(),
      name: String(r.name || r.fullName || r.studentName || r['Name of the Student'] || '').trim(),
      rollNumber: String(r.rollNumber || r.roll || r.rollNo || r['Roll No'] || '').trim(),
      email: String(r.email || r.mail || r.mailId || r['Mail ID'] || '').trim(),
      phone: String(r.phone || r.phoneNumber || r.phoneNo || r['PHONE NO'] || '').trim(),
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
    if (['LEAD', 'TL', 'TEAMLEAD', 'TEAMLEADER', 'LEADER'].includes(code) || code.startsWith('LEAD') || code.startsWith('TL')) {
      r.normalizedRole = 'LEAD';
    } else if (['SD', 'SD1', 'SD2', 'SD3', 'SD4', 'SENIOR', 'SENIORDEV', 'SENIORDEVELOPER'].includes(code) || code.startsWith('SD') || code.includes('SENIOR')) {
      r.normalizedRole = 'SD';
    } else if (['JD', 'JD1', 'JD2', 'JD3', 'JD4', 'JUNIOR', 'JUNIORDEV', 'JUNIORDEVELOPER'].includes(code) || code.startsWith('JD') || code.includes('JUNIOR')) {
      r.normalizedRole = 'JD';
    } else {
      errors.push(`Row ${r.rowNumber}: Unrecognized Role '${r.roleCode}'. Must be LEAD, SD (SD1–SD4 / Senior Dev), or JD (JD1–JD4 / Junior Dev).`);
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
    const batches = await Batch.find().sort({ createdAt: -1 }).lean();

    // Fetch user and team counts by batch in parallel using single aggregation pipelines
    const [userCounts, teamCounts] = await Promise.all([
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$batch', count: { $sum: 1 } } },
      ]),
      Team.aggregate([
        { $group: { _id: '$batch', count: { $sum: 1 } } },
      ]),
    ]);

    const userCountMap = new Map();
    userCounts.forEach((u) => {
      if (u._id) userCountMap.set(String(u._id).toLowerCase(), u.count);
    });

    const teamCountMap = new Map();
    teamCounts.forEach((t) => {
      if (t._id) teamCountMap.set(String(t._id).toLowerCase(), t.count);
    });

    const enrichedBatches = batches.map((batchObj) => {
      const batchKeys = [
        batchObj.id,
        batchObj.batchId,
        batchObj.year,
        batchObj.name,
      ].filter(Boolean).map((k) => String(k).toLowerCase());

      let liveCount = 0;
      for (const k of batchKeys) {
        if (userCountMap.has(k)) {
          liveCount = userCountMap.get(k);
          break;
        }
      }

      let teamCount = 0;
      for (const k of batchKeys) {
        if (teamCountMap.has(k)) {
          teamCount = teamCountMap.get(k);
          break;
        }
      }

      batchObj.studentsCount = liveCount;
      batchObj.teamsCount = teamCount;
      batchObj.activeTeamsCount = teamCount;
      return batchObj;
    });

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

    // 1. Create or retrieve 9 Teams for this new batch in bulk
    const existingTeams = await Team.find({ batch: formattedId });
    const teamDocMap = {};
    const teamsToCreate = [];

    for (let i = 1; i <= 9; i++) {
      const found = existingTeams.find((t) => t.teamNumber === i);
      if (found) {
        teamDocMap[i] = found;
      } else {
        teamsToCreate.push({
          name: `Team ${i}`,
          teamNumber: i,
          track: '',
          project: '',
          batch: formattedId,
          maxMembers: 9,
          teamLeadId: null,
          members: [],
        });
      }
    }

    if (teamsToCreate.length > 0) {
      const created = await Team.insertMany(teamsToCreate);
      created.forEach((t) => {
        teamDocMap[t.teamNumber] = t;
      });
    }

    // 2. Single-query lookup for existing users
    const cleanEmails = records.map((r) => r.email.toLowerCase().trim());
    const cleanRolls = records.map((r) => r.rollNumber.toUpperCase().trim());

    const existingUsers = await User.find({
      $or: [
        { email: { $in: cleanEmails } },
        { rollNumber: { $in: cleanRolls } },
      ],
    }).select('_id email rollNumber password role phone phoneNumber college dayScholarHostel branch year');

    const userMapByEmail = new Map();
    const userMapByRoll = new Map();
    existingUsers.forEach((u) => {
      if (u.email) userMapByEmail.set(u.email.toLowerCase(), u);
      if (u.rollNumber) userMapByRoll.set(u.rollNumber.toUpperCase(), u);
    });

    // 3. Parallel non-blocking password hashing
    const saltRounds = 10;
    const hashedPasswords = await Promise.all(
      records.map((r) => {
        const roll = r.rollNumber.toUpperCase().trim();
        const existing = userMapByEmail.get(r.email.toLowerCase().trim()) || userMapByRoll.get(roll);
        if (existing && existing.password) {
          return Promise.resolve(null);
        }
        return bcrypt.hash(roll, saltRounds);
      })
    );

    // 4. Build bulk operations for all 81 users & compute team rosters
    const bulkUserOps = [];
    const teamLeadsMap = {};
    const teamMembersMap = {};
    for (let i = 1; i <= 9; i++) {
      teamMembersMap[i] = [];
    }

    records.forEach((record, index) => {
      const cleanEmail = record.email.toLowerCase().trim();
      const cleanRoll = record.rollNumber.toUpperCase().trim();
      const isLead = record.normalizedRole === 'LEAD';
      const isSenior = record.normalizedRole === 'SD';
      const yearVal = isLead || isSenior ? 4 : 3;
      const teamDoc = teamDocMap[record.teamNumber];
      const existing = userMapByEmail.get(cleanEmail) || userMapByRoll.get(cleanRoll);

      const userId = existing ? existing._id : new mongoose.Types.ObjectId();

      if (isLead) {
        teamLeadsMap[record.teamNumber] = userId;
      } else {
        teamMembersMap[record.teamNumber].push(userId);
      }

      if (!existing) {
        bulkUserOps.push({
          insertOne: {
            document: {
              _id: userId,
              name: record.name.trim(),
              email: cleanEmail,
              rollNumber: cleanRoll,
              phone: record.phone || null,
              phoneNumber: record.phone || null,
              password: hashedPasswords[index],
              college: record.college || 'KIET',
              dayScholarHostel: record.type || 'DS',
              activeBacklogs: Number(record.backlogs) || 0,
              branch: record.branch || 'CSE',
              year: yearVal,
              batch: formattedId,
              memberType: isLead || isSenior ? 'senior_developer' : 'junior_developer',
              role: isLead ? 'teamlead' : 'user',
              status: 'active',
              teamId: teamDoc._id,
            },
          },
        });
      } else {
        const updateSet = {
          name: record.name.trim(),
          rollNumber: cleanRoll,
          college: record.college || existing.college || 'KIET',
          dayScholarHostel: record.type || existing.dayScholarHostel || 'DS',
          activeBacklogs: Number(record.backlogs) || 0,
          branch: record.branch || existing.branch || 'CSE',
          year: yearVal,
          batch: formattedId,
          memberType: isLead || isSenior ? 'senior_developer' : 'junior_developer',
          role: isLead ? 'teamlead' : (existing.role === 'admin' ? 'admin' : 'user'),
          status: 'active',
          teamId: teamDoc._id,
        };
        if (record.phone) {
          updateSet.phone = record.phone;
          updateSet.phoneNumber = record.phone;
        }
        if (hashedPasswords[index]) {
          updateSet.password = hashedPasswords[index];
        }

        bulkUserOps.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: updateSet },
          },
        });
      }
    });

    // 5. Execute 81 User operations in ONE single database request
    if (bulkUserOps.length > 0) {
      await User.bulkWrite(bulkUserOps, { ordered: false });
    }

    // 6. Update all 9 Teams in ONE single bulk database request
    const bulkTeamOps = [];
    for (let i = 1; i <= 9; i++) {
      bulkTeamOps.push({
        updateOne: {
          filter: { _id: teamDocMap[i]._id },
          update: {
            $set: {
              teamLeadId: teamLeadsMap[i] || null,
              members: teamMembersMap[i] || [],
            },
          },
        },
      });
    }
    await Team.bulkWrite(bulkTeamOps);

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
 * @desc    Delete a batch permanently from MongoDB Atlas
 * @route   DELETE /api/admin/batches/:id
 * @access  Private/Admin
 */
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Batch identifier is required',
      });
    }

    const cleanId = id.trim();
    const normalizedId = cleanId.replace(/\s+/g, '').replace(/–/g, '-');

    // 1. Locate the batch document
    let batch = await Batch.findOne({
      $or: [
        { id: cleanId },
        { id: normalizedId },
        { batchId: cleanId },
        { batchId: normalizedId },
        { year: cleanId },
        { name: cleanId },
      ],
    });

    if (!batch && mongoose.Types.ObjectId.isValid(cleanId)) {
      batch = await Batch.findById(cleanId);
    }

    if (!batch) {
      const escaped = cleanId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      batch = await Batch.findOne({
        $or: [
          { id: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { year: { $regex: new RegExp(`^${escaped}$`, 'i') } },
          { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ],
      });
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch '${cleanId}' not found`,
      });
    }

    const batchKey = batch.id || normalizedId;
    const batchYear = batch.year || batch.name || batchKey;

    const batchIdentifiers = Array.from(
      new Set(
        [
          cleanId,
          normalizedId,
          batchKey,
          batch.year,
          batch.name,
          batch.batchId,
          String(batch._id),
        ].filter(Boolean)
      )
    );

    // 2. Delete the batch document itself FIRST so it never resurrects
    await Batch.deleteOne({ _id: batch._id });

    // 3. Find and delete all teams in this batch
    const teams = await Team.find({
      batch: { $in: batchIdentifiers },
    }).select('_id');
    const teamIds = teams.map((t) => t._id);

    await Team.deleteMany({
      $or: [{ batch: { $in: batchIdentifiers } }, { _id: { $in: teamIds } }],
    });

    // 4. Find all users associated with this batch (excluding admin accounts)
    const batchUsers = await User.find({
      batch: { $in: batchIdentifiers },
      role: { $ne: 'admin' },
    }).select('_id');
    const userIds = batchUsers.map((u) => u._id);

    // 5. Find all tasks directly or indirectly associated with this batch
    let taskIdsFromAssignments = [];
    if (userIds.length > 0) {
      try {
        const relatedAssignments = await TaskAssignment.find({
          studentId: { $in: userIds },
        }).select('taskId');
        taskIdsFromAssignments = relatedAssignments.map((a) => a.taskId).filter(Boolean);
      } catch (err) { }
    }

    const tasksToDelete = await Task.find({
      $or: [
        { batch: { $in: batchIdentifiers } },
        ...(taskIdsFromAssignments.length > 0 ? [{ _id: { $in: taskIdsFromAssignments } }] : []),
        ...(userIds.length > 0 ? [{ createdBy: { $in: userIds } }, { assignedTo: { $in: userIds } }] : []),
      ],
    }).select('_id');
    const allTaskIdsToDelete = tasksToDelete.map((t) => t._id);

    // 6. Delete all TaskAssignment records for these tasks or students
    try {
      await TaskAssignment.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ studentId: { $in: userIds } }] : []),
          ...(allTaskIdsToDelete.length > 0 ? [{ taskId: { $in: allTaskIdsToDelete } }] : []),
        ],
      });
    } catch (err) {
      console.warn('Batch deletion task assignments error:', err.message);
    }

    // 7. Delete all tasks associated with this batch
    try {
      await Task.deleteMany({
        $or: [
          { batch: { $in: batchIdentifiers } },
          ...(allTaskIdsToDelete.length > 0 ? [{ _id: { $in: allTaskIdsToDelete } }] : []),
          ...(userIds.length > 0 ? [{ createdBy: { $in: userIds } }, { assignedTo: { $in: userIds } }] : []),
        ],
      });
    } catch (err) {
      console.warn('Batch deletion tasks error:', err.message);
    }

    // 8. Delete related users and activities safely
    if (userIds.length > 0) {
      try {
        await User.deleteMany({ _id: { $in: userIds } });
      } catch (err) {
        console.warn('Batch deletion users error:', err.message);
      }
      try {
        const StudentActivity = mongoose.models.StudentActivity || require('../models/StudentActivity');
        await StudentActivity.deleteMany({ studentId: { $in: userIds } });
      } catch (err) { }
    }

    // 9. Delete team requests related to these teams
    if (teamIds.length > 0) {
      try {
        const TeamRequest = mongoose.models.TeamRequest || require('../models/TeamRequest');
        await TeamRequest.deleteMany({ teamId: { $in: teamIds } });
      } catch (err) { }
    }

    console.log(`Successfully deleted Batch '${batchKey}' (${batchYear}) and all associated records.`);

    return res.status(200).json({
      success: true,
      message: `Batch '${batchYear}' deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete batch',
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

    // 1. Fetch teams, tasks, and assignments concurrently in parallel
    const [teams, allTasks, allAssignments] = await Promise.all([
      Team.find({ batch: batchId })
        .sort({ teamNumber: 1 })
        .populate('teamLeadId', 'name email role')
        .populate('members', 'name email role')
        .lean(),
      Task.find().populate('createdBy', 'name role email').lean(),
      TaskAssignment.find().lean(),
    ]);

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
        track: t.project || 'Project Not Assigned',
        project: t.project || '',
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
        activeTeamsCount: teamsAnalytics.filter((t) => t.score > 0).length,
        inactiveTeamsCount: teamsAnalytics.filter((t) => t.score === 0).length,
        topTeam: topTeam
          ? { teamNumber: topTeam.teamNumber, name: topTeam.name, score: topTeam.score, track: topTeam.track }
          : null,
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
  deleteUser,
  getAdminStats,
  getTeams,
  updateTeam,
  getTeamPerformanceAnalytics,
  assignTeamLead,
  removeTeamMember,
  addTeamMember,
  getResources,
  createResource,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getBatches,
  createBatchWithCohort,
  deleteBatch,
  reviewTaskSubmission,
  parseAndValidateCohort,
};


