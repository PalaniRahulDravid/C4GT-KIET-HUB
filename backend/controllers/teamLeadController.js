const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const TeamRequest = require('../models/TeamRequest');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const StudentActivity = require('../models/StudentActivity');
const StudentResourceProgress = require('../models/StudentResourceProgress');
const Batch = require('../models/Batch');
const { syncUserTaskAssignmentsOnRoleChange } = require('../services/taskSyncService');

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

    if (populatedTeam && Array.isArray(populatedTeam.members)) {
      const hasNullOrLead = populatedTeam.members.some(
        (m) => !m || (populatedTeam.teamLeadId && m._id?.toString() === populatedTeam.teamLeadId._id?.toString())
      );
      if (hasNullOrLead) {
        populatedTeam.members = populatedTeam.members.filter(
          (m) => m && (!populatedTeam.teamLeadId || m._id?.toString() !== populatedTeam.teamLeadId._id?.toString())
        );
        await Team.findByIdAndUpdate(populatedTeam._id, { members: populatedTeam.members.map((m) => m._id) });
      }
    }

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

    if (team.teamLeadId && team.teamLeadId.toString() === memberId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself as Team Lead from your roster.',
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
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

    res.status(200).json({
      success: true,
      message: deletedUser
        ? `Student ${deletedUser.name} removed and permanently deleted from database.`
        : 'Member removed and permanently deleted from database.',
      team: updatedTeam,
      deletedStudentId: memberId,
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
 * @desc    Add a student member to the team (Team Lead)
 * @route   POST /api/teamlead/members
 * @access  Private (Team Lead / Admin)
 */
const addMember = async (req, res) => {
  try {
    const team = await findLeadTeam(req.user._id, req.body.teamId);

    if (!team) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned as Team Lead of any team',
      });
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
        message: `Your team has reached the maximum capacity limit of ${maxMembersAllowed} members (1 Lead + 8 Members). Please remove the member who quit before adding a replacement.`,
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

    // Check if student is already assigned to any team
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
      // Create brand new student
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

    // Keep task assignments in sync with current memberType
    await syncUserTaskAssignmentsOnRoleChange(user._id, mType);

    // Add student strictly to team.members, preserving teamLeadId intact
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

    // Create welcome notification
    try {
      await Notification.create({
        studentId: user._id,
        teamId: team._id,
        title: `Welcome to ${team.name}!`,
        message: `You have been added to ${team.name} by ${req.user.name || 'Team Lead'}.`,
        type: 'team_joined',
        assignedBy: req.user.name || 'Team Lead',
      });
    } catch (e) {
      // ignore notification errors
    }

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
    console.error('Error adding member in teamLeadController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add student to team',
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

    const memberIds = [...(team.members || [])];
    const teamLeadId = team.teamLeadId ? team.teamLeadId.toString() : req.user._id.toString();
    const memberIdStrings = memberIds.map((m) => (m._id || m).toString());
    const teamUserIdsSet = new Set([...memberIdStrings, teamLeadId]);
    const teamMemberObjectIds = Array.from(teamUserIdsSet).map((id) => new mongoose.Types.ObjectId(id));

    // Fetch team members with memberType for precise targetGroup filtering
    const teamMembers = await User.find({ _id: { $in: memberIds } })
      .select('name rollNumber email memberType avatar')
      .lean();

    const leadBatch = team.batch || req.user.batch;
    const taskQuery = {
      $or: [
        { assignedTeams: team.teamNumber },
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { assignedTo: { $in: memberIds } },
      ],
    };

    if (leadBatch) {
      const bDoc = await Batch.findOne({
        $or: [{ id: leadBatch }, { batchId: leadBatch }, { year: leadBatch }, { name: leadBatch }],
      });
      const matchKeys = [leadBatch];
      if (bDoc) {
        if (bDoc.id) matchKeys.push(bDoc.id);
        if (bDoc.batchId) matchKeys.push(bDoc.batchId);
        if (bDoc.year) matchKeys.push(bDoc.year);
        if (bDoc.name) matchKeys.push(bDoc.name);
      }
      taskQuery.batch = { $in: Array.from(new Set(matchKeys)) };
    }

    const tasks = await Task.find(taskQuery)
      .sort({ deadline: 1 })
      .populate('createdBy', 'name email avatar role')
      .populate('assignedTo', 'name rollNumber email memberType avatar')
      .populate('relatedResources', 'title type description url topic fileSize fileFormat originalFilename cloudinaryPublicId difficulty completedBy downloadsCount')
      .lean();

    // Fetch assignments for these tasks specifically belonging to this team's members and lead
    const taskIds = tasks.map((t) => t._id);
    const assignments = await TaskAssignment.find({
      taskId: { $in: taskIds },
      studentId: { $in: teamMemberObjectIds },
    })
      .populate('studentId', 'name rollNumber email memberType avatar teamId')
      .populate('reviewedBy', 'name email avatar role')
      .lean();

    const tasksWithMembersProgress = tasks.map((t) => {
      const tObj = { ...t };
      const taskAssignments = assignments.filter((a) => {
        if (!a.taskId || !a.studentId) return false;
        const taskIdStr = (a.taskId._id || a.taskId).toString();
        const studentIdStr = (a.studentId._id || a.studentId).toString();
        return taskIdStr === t._id.toString() && teamUserIdsSet.has(studentIdStr);
      });
      tObj.assignments = taskAssignments;

      const createdById = t.createdBy ? (t.createdBy._id || t.createdBy).toString() : '';
      const isCreatedByLead = createdById === req.user._id.toString();
      const isCreatedByAdmin = Boolean(t.createdBy && t.createdBy.role === 'admin');

      // Determine task audience / scope
      let audience = tObj.taskScope || 'students';
      if (!tObj.taskScope) {
        if (isCreatedByAdmin) {
          audience = 'team_lead';
        } else if (tObj.assignedTo && tObj.assignedTo.length > 0 && tObj.assignedTo.length < memberIds.length) {
          audience = 'individual';
        } else {
          audience = 'students';
        }
      }

      tObj.audience = audience;
      tObj.isCreatedByLead = isCreatedByLead;
      tObj.isCreatedByAdmin = isCreatedByAdmin;

      // Find team lead's own assignment if this is a lead task
      const leadAssignment = taskAssignments.find(
        (a) => a.studentId && (a.studentId._id || a.studentId).toString() === req.user._id.toString()
      );
      tObj.leadAssignment = leadAssignment || null;

      // Filter out any assignments with missing/deleted studentId to avoid crashes
      const validAssignments = taskAssignments.filter((a) => a.studentId && (a.studentId._id || a.studentId));

      // Determine targeted assignees with 100% precision
      const hasSpecificAssignees = Array.isArray(tObj.assignedTo) && tObj.assignedTo.length > 0;
      let eligibleMemberIds = [];

      if (hasSpecificAssignees) {
        // Specific members assigned
        const teamSpecificAssignees = tObj.assignedTo.filter((u) => {
          const uid = (u._id || u).toString();
          return teamUserIdsSet.has(uid);
        });
        eligibleMemberIds = teamSpecificAssignees.map((u) => (u._id || u).toString());
      } else if (audience === 'team_lead') {
        eligibleMemberIds = [teamLeadId];
      } else {
        // Filter by targetGroup
        const targetGroup = tObj.targetGroup;
        if (targetGroup === 'junior_developers' || targetGroup === 'junior_developer') {
          eligibleMemberIds = teamMembers
            .filter((m) => m.memberType === 'junior_developer')
            .map((m) => m._id.toString());
        } else if (targetGroup === 'developer_interns' || targetGroup === 'developer_intern') {
          eligibleMemberIds = teamMembers
            .filter((m) => m.memberType === 'developer_intern')
            .map((m) => m._id.toString());
        } else if (targetGroup === 'senior_developers' || targetGroup === 'senior_developer') {
          eligibleMemberIds = teamMembers
            .filter((m) => m.memberType === 'senior_developer')
            .map((m) => m._id.toString());
        } else {
          eligibleMemberIds = teamMembers.map((m) => m._id.toString());
        }

        // Check if task assignments exist in DB for this task
        const assignmentStudentIds = validAssignments.map((a) => (a.studentId._id || a.studentId).toString());
        if (eligibleMemberIds.length === 0 && assignmentStudentIds.length > 0) {
          eligibleMemberIds = assignmentStudentIds;
        }
      }

      const relevantAssignments = validAssignments.filter((a) => {
        const sid = (a.studentId._id || a.studentId).toString();
        return eligibleMemberIds.includes(sid);
      });

      const totalAssigned = Math.max(relevantAssignments.length, eligibleMemberIds.length);
      tObj.totalAssigned = totalAssigned;
      tObj.eligibleMemberIds = eligibleMemberIds;
      tObj.completedCount = relevantAssignments.filter((a) => a.status === 'completed').length;
      tObj.submittedCount = relevantAssignments.filter((a) => a.status === 'submitted').length;
      tObj.pendingCount = Math.max(0, tObj.totalAssigned - tObj.completedCount - tObj.submittedCount);

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
 * @desc    Team Lead review student deliverables submission (Accept & Mark Completed or Request Revision)
 * @route   POST /api/teamlead/tasks/:taskId/review/:studentId
 * @access  Private (Team Lead / Admin)
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

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Strict Role Separation: Team Lead can ONLY review tasks created by themselves.
    // Admin tasks are reviewed exclusively by Admin on the Admin dashboard.
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isCreator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only review tasks created by you. Admin tasks are reviewed exclusively by the Admin.',
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
        title: action === 'accept' ? `Task Approved: ${task.title}` : `Changes Requested: ${task.title}`,
        message:
          action === 'accept'
            ? `Team Lead ${req.user.name} reviewed and accepted your deliverables! Task is marked Completed.`
            : `Team Lead ${req.user.name} reviewed your submission and requested updates: ${reviewNotes || 'Please review deliverables.'}`,
        type: action === 'accept' ? 'task_completed' : 'task_assigned',
        assignedBy: req.user.name || 'Team Lead',
      });
    } catch (notifErr) {
      // Continue
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
    console.error('Error reviewing task submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to review task submission',
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
      relatedResources,
      assignedTo,
      taskScope,
    } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and deadline are required to assign a task',
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

    // Determine assignees and scope
    let targetStudentIds = [];
    let determinedScope = taskScope || 'students';

    if (taskScope === 'team_lead' || assignedTo === 'team_lead') {
      return res.status(400).json({
        success: false,
        message: 'Team Lead self milestone tasks are disabled. Tasks can only be assigned to team members.',
      });
    } else if (Array.isArray(assignedTo) && assignedTo.length > 0 && !assignedTo.includes('all') && !assignedTo.includes('all_students')) {
      determinedScope = 'individual';
      targetStudentIds = assignedTo.filter((id) => mongoose.Types.ObjectId.isValid(id));
    } else if (typeof assignedTo === 'string' && mongoose.Types.ObjectId.isValid(assignedTo)) {
      determinedScope = 'individual';
      targetStudentIds = [assignedTo];
    } else if (taskScope === 'junior_developers' || targetGroup === 'junior_developers') {
      determinedScope = 'students';
      const juniorMembers = await User.find({
        _id: { $in: team.members || [] },
        memberType: 'junior_developer',
      }).select('_id').lean();
      targetStudentIds = juniorMembers.map((m) => m._id);
    } else if (taskScope === 'senior_developers' || targetGroup === 'senior_developers') {
      determinedScope = 'students';
      const seniorMembers = await User.find({
        _id: { $in: team.members || [] },
        memberType: 'senior_developer',
      }).select('_id').lean();
      targetStudentIds = seniorMembers.map((m) => m._id);
    } else {
      determinedScope = 'students';
      targetStudentIds = [...(team.members || [])];
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      topic: topic ? topic.trim() : (team.track || 'Team Sprint'),
      targetGroup: targetGroup || (determinedScope === 'individual' ? 'individual' : 'both'),
      deadline: new Date(deadline),
      priority: priority || 'Normal',
      assignedTeams: [team.teamNumber],
      assignedTo: targetStudentIds,
      taskScope: determinedScope,
      deliverables: Array.isArray(deliverables)
        ? deliverables.filter((d) => typeof d === 'string' && d.trim().length > 0).map((d) => d.trim())
        : [],
      relatedResources: Array.isArray(relatedResources) ? relatedResources : [],
      status: 'Published',
      createdBy: req.user._id,
      batch: team.batch || req.user.batch || null,
    });

    // Create TaskAssignment and Notification for each assigned member
    for (const mId of targetStudentIds) {
      try {
        await TaskAssignment.findOneAndUpdate(
          { studentId: mId, taskId: task._id },
          { $setOnInsert: { studentId: mId, taskId: task._id, status: 'pending' } },
          { upsert: true }
        );

        if (mId.toString() !== req.user._id.toString()) {
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
        }
      } catch (err) {
        // Continue on individual errors
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignedTo', 'name rollNumber email memberType avatar')
      .populate('relatedResources', 'title type description url topic fileSize fileFormat originalFilename cloudinaryPublicId difficulty completedBy downloadsCount');

    res.status(201).json({
      success: true,
      message: `Task successfully assigned to ${
        determinedScope === 'individual' ? `${targetStudentIds.length} student(s)` : `${team.name} students`
      }!`,
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
  addMember,
  getTeamTasks,
  createTeamTask,
  deleteTeamTask,
  reviewTaskSubmission,
};
