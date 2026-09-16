const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const TeamRequest = require('../models/TeamRequest');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');

/**
 * Helper: Find team for current team lead
 */
const findLeadTeam = async (userId, customTeamId = null) => {
  if (customTeamId && mongoose.Types.ObjectId.isValid(customTeamId)) {
    return await Team.findById(customTeamId);
  }
  let team = await Team.findOne({ teamLeadId: userId });
  if (!team) {
    // Check if user has teamId pointing to a team
    const user = await User.findById(userId);
    if (user && user.teamId) {
      team = await Team.findById(user.teamId);
    }
  }
  return team;
};

/**
 * @desc    Get Team Lead's active team details & roster
 * @route   GET /api/teamlead/my-team
 * @access  Private (Team Lead / Admin)
 */
const getMyTeam = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id, req.query.teamId);

    if (!team) {
      return res.status(200).json({
        success: true,
        hasTeam: false,
        message: 'No team is currently assigned to you as Team Lead. Please contact Admin.',
      });
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber status')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status createdAt');

    const pendingInvitations = await TeamRequest.find({
      teamId: team._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('invitedUserId', 'name email phone phoneNumber avatar role memberType branch year rollNumber');

    const maxMembers = populatedTeam.maxMembers || 9;
    const currentMembersCount = populatedTeam.members ? populatedTeam.members.length : 0;
    const totalTeamCount = currentMembersCount + (populatedTeam.teamLeadId ? 1 : 0);
    const isFull = totalTeamCount >= maxMembers;

    res.status(200).json({
      success: true,
      hasTeam: true,
      team: populatedTeam,
      maxMembers,
      currentMembersCount,
      totalTeamCount,
      isFull,
      availableSlots: Math.max(0, maxMembers - totalTeamCount),
      pendingInvitations,
    });
  } catch (error) {
    console.error('Error fetching team lead team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team details',
    });
  }
};

/**
 * @desc    Search total registered users to add/invite to team
 * @route   GET /api/teamlead/users
 * @access  Private (Team Lead / Admin)
 */
const searchUsers = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id, req.query.teamId);
    const { search = '', filter = 'all' } = req.query;

    const query = {
      _id: { $ne: req.user._id },
    };

    // If team exists, exclude current team members from search
    if (team && Array.isArray(team.members)) {
      query._id = { $nin: [req.user._id, ...team.members] };
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { email: reg }, { rollNumber: reg }, { branch: reg }, { phone: reg }, { phoneNumber: reg }];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select('name email phone phoneNumber avatar role memberType branch year rollNumber teamId status')
      .lean();

    // Fetch all pending requests for caller's team
    let pendingRequestMap = {};
    if (team) {
      const teamRequests = await TeamRequest.find({
        teamId: team._id,
        status: 'pending',
      });
      teamRequests.forEach((tr) => {
        pendingRequestMap[tr.invitedUserId.toString()] = tr._id;
      });
    }

    // Fetch team map for display
    const allTeams = await Team.find().select('name teamNumber').lean();
    const teamNameMap = {};
    allTeams.forEach((t) => {
      teamNameMap[t._id.toString()] = t.name;
    });

    const enrichedUsers = users.map((u) => {
      const hasTeam = Boolean(u.teamId);
      const teamName = u.teamId && teamNameMap[u.teamId.toString()] ? teamNameMap[u.teamId.toString()] : null;
      const pendingInviteId = pendingRequestMap[u._id.toString()] || null;

      return {
        ...u,
        inTeam: hasTeam,
        teamName,
        isPendingInvite: Boolean(pendingInviteId),
        pendingInviteId,
      };
    });

    // Apply availability filter if specified
    let filteredUsers = enrichedUsers;
    if (filter === 'available') {
      filteredUsers = enrichedUsers.filter((u) => !u.inTeam && !u.isPendingInvite);
    } else if (filter === 'assigned') {
      filteredUsers = enrichedUsers.filter((u) => u.inTeam);
    }

    res.status(200).json({
      success: true,
      count: filteredUsers.length,
      users: filteredUsers,
    });
  } catch (error) {
    console.error('Error searching users for team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search users',
    });
  }
};

/**
 * @desc    Send team invitation request to a user
 * @route   POST /api/teamlead/invite
 * @access  Private (Team Lead / Admin)
 */
const inviteMember = async (req, res) => {
  try {
    const { userId, message = '' } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required to send team invitation',
      });
    }

    const team = await findLeadTeam(req.user._id, req.body.teamId);
    if (!team) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as Team Lead of any team',
      });
    }

    // Check capacity: team roster capped at maxMembers (9)
    const maxMembers = team.maxMembers || 9;
    const currentTotal = (team.members ? team.members.length : 0) + (team.teamLeadId ? 1 : 0);
    if (currentTotal >= maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Your team has reached the maximum capacity limit of ${maxMembers} members. You cannot invite more members.`,
      });
    }

    // Check target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found',
      });
    }

    // Check if user is already a member of this team
    if (team.members && team.members.some((m) => m.toString() === targetUser._id.toString())) {
      return res.status(400).json({
        success: false,
        message: `${targetUser.name} is already a member of ${team.name}`,
      });
    }

    // Check if an active pending invitation already exists
    const existingInvite = await TeamRequest.findOne({
      teamId: team._id,
      invitedUserId: targetUser._id,
      status: 'pending',
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        message: `An active invitation has already been sent to ${targetUser.name}`,
      });
    }

    // Create TeamRequest
    const newRequest = await TeamRequest.create({
      teamId: team._id,
      teamLeadId: req.user._id,
      invitedUserId: targetUser._id,
      status: 'pending',
      message: message.trim() || `You have been invited by ${req.user.name} to join ${team.name}.`,
    });

    // Send Notification to invited user
    try {
      await Notification.create({
        studentId: targetUser._id,
        teamId: team._id,
        title: `Team Invitation: ${team.name}`,
        message: `${req.user.name} (Team Lead) invited you to join ${team.name} (${team.track || 'Track'}).`,
        type: 'team_invite',
        assignedBy: req.user.name || 'Team Lead',
      });
    } catch (notifErr) {
      console.warn('Notification creation notice:', notifErr.message);
    }

    const populatedRequest = await TeamRequest.findById(newRequest._id)
      .populate('invitedUserId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('teamId', 'name teamNumber track');

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${targetUser.name}!`,
      invitation: populatedRequest,
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invitation',
    });
  }
};

/**
 * @desc    Get all invitations sent by this team
 * @route   GET /api/teamlead/invitations
 * @access  Private (Team Lead / Admin)
 */
const getTeamInvitations = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id, req.query.teamId);
    if (!team) {
      return res.status(200).json({ success: true, invitations: [] });
    }

    const invitations = await TeamRequest.find({ teamId: team._id })
      .sort({ createdAt: -1 })
      .populate('invitedUserId', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invitations',
    });
  }
};

/**
 * @desc    Cancel a pending invitation
 * @route   DELETE /api/teamlead/invitations/:id
 * @access  Private (Team Lead / Admin)
 */
const cancelInvitation = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id);
    const invite = await TeamRequest.findById(req.params.id);

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (team && invite.teamId.toString() !== team._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this invitation',
      });
    }

    invite.status = 'cancelled';
    await invite.save();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      invitationId: invite._id,
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel invitation',
    });
  }
};

/**
 * @desc    Remove a member from the team
 * @route   DELETE /api/teamlead/members/:memberId
 * @access  Private (Team Lead / Admin)
 */
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = await findLeadTeam(req.user._id, req.query.teamId);

    if (!team) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as Team Lead of any team',
      });
    }

    team.members = (team.members || []).filter((m) => m && m.toString() !== memberId);
    await team.save();

    const user = await User.findById(memberId);
    if (user && user.teamId && user.teamId.toString() === team._id.toString()) {
      user.teamId = null;
      await user.save();
    }

    // Notify student
    try {
      await Notification.create({
        studentId: memberId,
        teamId: team._id,
        title: `Team Update: ${team.name}`,
        message: `You are no longer a member of ${team.name}.`,
        type: 'team_left',
        assignedBy: req.user.name || 'Team Lead',
      });
    } catch (e) {
      // ignore
    }

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

    res.status(200).json({
      success: true,
      message: 'Member removed from team',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Error removing member from team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove member',
    });
  }
};

/**
 * @desc    Get tasks assigned to this team / created by team lead
 * @route   GET /api/teamlead/tasks
 * @access  Private (Team Lead / Admin)
 */
const getTeamTasks = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id);
    if (!team) {
      return res.status(200).json({
        success: true,
        tasks: [],
        message: 'No team assigned yet',
      });
    }

    const tasks = await Task.find({
      $or: [
        { assignedTeams: team.teamNumber },
        { createdBy: req.user._id },
      ],
    })
      .sort({ deadline: 1 })
      .populate('createdBy', 'name email avatar role');

    // Fetch members and their individual assignment statuses
    const memberIds = [...(team.members || [])];
    const taskIds = tasks.map((t) => t._id);

    const assignments = await TaskAssignment.find({
      taskId: { $in: taskIds },
      studentId: { $in: memberIds },
    }).populate('studentId', 'name rollNumber email memberType');

    const tasksWithMembersProgress = tasks.map((t) => {
      const tObj = t.toObject();
      const taskAssignments = assignments.filter(
        (a) => a.taskId.toString() === t._id.toString()
      );
      tObj.assignments = taskAssignments;
      tObj.totalAssigned = memberIds.length;
      tObj.completedCount = taskAssignments.filter((a) => a.status === 'completed').length;
      return tObj;
    });

    res.status(200).json({
      success: true,
      count: tasksWithMembersProgress.length,
      tasks: tasksWithMembersProgress,
    });
  } catch (error) {
    console.error('Error fetching team tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team tasks',
    });
  }
};

/**
 * @desc    Team lead create/assign task to their team students
 * @route   POST /api/teamlead/tasks
 * @access  Private (Team Lead / Admin)
 */
const createTeamTask = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id);
    if (!team) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as Team Lead of any team',
      });
    }

    const {
      title,
      description,
      topic,
      targetGroup,
      deadline,
      priority,
      deliverables,
    } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and deadline are required to assign a task',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      topic: topic ? topic.trim() : (team.track || 'Team Sprint'),
      targetGroup: targetGroup || 'both',
      deadline: new Date(deadline),
      priority: priority || 'Normal',
      assignedTeams: [team.teamNumber],
      deliverables:
        Array.isArray(deliverables) && deliverables.length > 0
          ? deliverables
          : ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'],
      status: 'Published',
      createdBy: req.user._id,
    });

    // Create TaskAssignment and Notification for each team member
    const memberIds = [...(team.members || [])];
    for (const mId of memberIds) {
      try {
        await TaskAssignment.findOneAndUpdate(
          { studentId: mId, taskId: task._id },
          { $setOnInsert: { studentId: mId, taskId: task._id, status: 'pending' } },
          { upsert: true }
        );

        await Notification.create({
          studentId: mId,
          taskId: task._id,
          teamId: team._id,
          title: `New Task: ${task.title}`,
          message: `${team.name} Lead ${req.user.name} assigned a new task: ${task.title}`,
          type: 'task_assigned',
          assignedBy: req.user.name || 'Team Lead',
          deadline: task.deadline,
        });
      } catch (err) {
        // Continue on individual duplicate notification errors
      }
    }

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: `Task successfully assigned to ${team.name} students`,
      task: populatedTask,
    });
  } catch (error) {
    console.error('Error creating team task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create team task',
    });
  }
};

/**
 * @desc    Delete a task created by this team lead
 * @route   DELETE /api/teamlead/tasks/:id
 * @access  Private (Team Lead / Admin)
 */
const deleteTeamTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete tasks created by you',
      });
    }

    await Task.findByIdAndDelete(id);
    await TaskAssignment.deleteMany({ taskId: id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team task:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};

module.exports = {
  getMyTeam,
  searchUsers,
  inviteMember,
  getTeamInvitations,
  cancelInvitation,
  removeMember,
  getTeamTasks,
  createTeamTask,
  deleteTeamTask,
};
