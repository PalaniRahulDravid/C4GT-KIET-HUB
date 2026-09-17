const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Team = require('../models/Team');
const User = require('../models/User');
const TeamRequest = require('../models/TeamRequest');
const Notification = require('../models/Notification');
const StudentActivity = require('../models/StudentActivity');
const StudentResourceProgress = require('../models/StudentResourceProgress');
const Resource = require('../models/Resource');

/**
 * Helper to format Date objects to 'YYYY-MM-DD'
 */
const formatDateKey = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper to determine student's team number
 */
const getStudentTeamNumber = async (user) => {
  if (!user) return null;
  if (user.teamId) {
    const team = await Team.findById(user.teamId);
    if (team) return team.teamNumber;
  }
  const team = await Team.findOne({
    $or: [{ members: user._id }, { teamLeadId: user._id }],
  });
  return team ? team.teamNumber : null;
};

/**
 * @desc    Get all tasks assigned to the logged-in student with status
 * @route   GET /api/student/tasks
 * @access  Private (Authenticated User)
 */
const getStudentTasks = async (req, res) => {
  try {
    const studentId = req.user._id;
    const teamNumber = await getStudentTeamNumber(req.user);

    // Fetch explicit assignments for student
    const assignments = await TaskAssignment.find({ studentId }).populate('reviewedBy', 'name email avatar role');
    const assignmentMap = {};
    const fullAssignmentMap = {};
    assignments.forEach((a) => {
      assignmentMap[a.taskId.toString()] = a.status;
      fullAssignmentMap[a.taskId.toString()] = a;
    });

    const explicitTaskIds = assignments.map((a) => a.taskId);

    // Determine targetGroup filter based on memberType
    let targetGroups = ['both'];
    if (req.user.memberType === 'junior_developer') {
      targetGroups.push('junior_developers');
    } else if (
      req.user.memberType === 'senior_developer' ||
      req.user.memberType === 'developer_intern'
    ) {
      targetGroups.push('developer_interns');
    } else {
      targetGroups.push('junior_developers', 'developer_interns');
    }

    // Build task query matching team and targetGroup or explicit assignment
    const query = {
      $or: [
        { _id: { $in: explicitTaskIds } },
        {
          $and: [
            teamNumber
              ? { assignedTeams: teamNumber }
              : { assignedTeams: { $exists: true } },
            { targetGroup: { $in: targetGroups } },
          ],
        },
      ],
    };

    let tasks = await Task.find(query)
      .sort({ deadline: 1 })
      .populate('createdBy', 'name email avatar role')
      .populate('relatedResources', 'title type description url topic fileSize fileFormat originalFilename cloudinaryPublicId difficulty completedBy downloadsCount');

    // Fallback: if database has tasks but query returned none, return published tasks for cohort
    if (tasks.length === 0) {
      tasks = await Task.find()
        .sort({ deadline: 1 })
        .populate('createdBy', 'name email avatar role')
        .populate('relatedResources', 'title type description url topic fileSize fileFormat originalFilename cloudinaryPublicId difficulty completedBy downloadsCount');
    }

    // Attach student specific status and assignment details to each task
    const tasksWithStatus = tasks.map((t) => {
      const taskObj = t.toObject();
      const assignment = fullAssignmentMap[t._id.toString()] || null;
      taskObj.status = assignment ? assignment.status : 'pending';
      taskObj.assignment = assignment;
      return taskObj;
    });

    res.status(200).json({
      success: true,
      count: tasksWithStatus.length,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student tasks',
    });
  }
};

/**
 * @desc    Submit task deliverables (e.g. Google Drive links for Doc, Presentation, repo, notes)
 * @route   POST /api/student/tasks/:taskId/submit
 * @access  Private (Authenticated User)
 */
const submitTaskDeliverables = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { submissions, submissionNotes } = req.body;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Format deliverables array
    const cleanSubmissions = Array.isArray(submissions)
      ? submissions.map((s) => ({
          deliverableName: s.deliverableName || 'Deliverable',
          link: s.link ? s.link.trim() : '',
          fileUrl: s.fileUrl ? s.fileUrl.trim() : '',
          submittedAt: new Date(),
        }))
      : [];

    let assignment = await TaskAssignment.findOne({ taskId: task._id, studentId });
    if (!assignment) {
      assignment = new TaskAssignment({
        taskId: task._id,
        studentId,
        status: 'submitted',
        submissions: cleanSubmissions,
        submissionNotes: submissionNotes ? submissionNotes.trim() : '',
        submittedAt: new Date(),
      });
    } else {
      assignment.status = 'submitted';
      assignment.submissions = cleanSubmissions;
      if (submissionNotes !== undefined) {
        assignment.submissionNotes = submissionNotes ? submissionNotes.trim() : '';
      }
      assignment.submittedAt = new Date();
    }

    await assignment.save();

    // Record task submission for daily streak tracking
    const todayDateKey = formatDateKey(new Date());
    await StudentActivity.findOneAndUpdate(
      { studentId, date: todayDateKey },
      {
        $inc: { taskSubmissionsCount: 1 },
        $set: {
          isStreakCompleted: true,
          lastSubmissionAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Find student's team and team lead to dispatch notification
    const studentUser = await User.findById(studentId);
    let team = null;
    if (studentUser && studentUser.teamId) {
      team = await Team.findById(studentUser.teamId);
    }
    if (!team) {
      team = await Team.findOne({ members: studentId });
    }

    if (team && team.teamLeadId) {
      try {
        await Notification.create({
          studentId: team.teamLeadId,
          taskId: task._id,
          teamId: team._id,
          title: `Deliverables Submitted: ${task.title}`,
          message: `${studentUser.name || 'A team member'} submitted task deliverables (Doc/Presentation links) for review.`,
          type: 'submission_received',
          assignedBy: studentUser.name || 'Student',
        });
      } catch (notifErr) {
        // Continue
      }
    }

    const populatedAssignment = await TaskAssignment.findById(assignment._id)
      .populate('studentId', 'name rollNumber email memberType')
      .populate('reviewedBy', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: 'Deliverables submitted successfully. Awaiting Team Lead review.',
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error('Error submitting deliverables:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit task deliverables',
    });
  }
};

/**
 * @desc    Update task status for logged-in student
 * @route   PATCH /api/student/tasks/:taskId/status
 * @access  Private (Authenticated User)
 */
const updateStudentTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const studentId = req.user._id;

    const allowedStatuses = ['pending', 'in_progress', 'submitted', 'completed', 'not_completed', 'revision_requested'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    // Verify task exists
    let task = null;
    if (mongoose.Types.ObjectId.isValid(taskId)) {
      task = await Task.findById(taskId);
    }
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // If trying to manually complete task, verify required resources are finished
    if (status === 'completed') {
      const taskResourcesCount = task.resources ? task.resources.length : 0;
      if (taskResourcesCount > 0) {
        const completedCount = await StudentResourceProgress.countDocuments({
          studentId,
          taskId: task._id,
          isCompleted: true,
        });
        if (completedCount < taskResourcesCount) {
          return res.status(400).json({
            success: false,
            message: 'Task cannot be completed until all required resources are watched/viewed.',
          });
        }
      }
    }

    // Find or create TaskAssignment record for student
    let assignment = await TaskAssignment.findOne({ taskId: task._id, studentId });
    if (!assignment) {
      assignment = new TaskAssignment({
        taskId: task._id,
        studentId,
        status,
      });
    } else {
      assignment.status = status;
    }

    if (status === 'completed') {
      assignment.completedAt = new Date();
      if (!assignment.submittedAt) {
        assignment.submittedAt = new Date();
      }
    } else if (status === 'submitted') {
      if (!assignment.submittedAt) {
        assignment.submittedAt = new Date();
      }
    } else {
      assignment.completedAt = null;
    }

    await assignment.save();

    // If task was submitted or marked completed, register task submission for streak
    if (status === 'submitted' || status === 'completed') {
      const todayDateKey = formatDateKey(new Date());
      await StudentActivity.findOneAndUpdate(
        { studentId, date: todayDateKey },
        {
          $inc: { taskSubmissionsCount: 1 },
          $set: {
            isStreakCompleted: true,
            lastSubmissionAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to '${status}' successfully`,
      assignment: {
        taskId: task._id,
        studentId,
        status: assignment.status,
        completedAt: assignment.completedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task status',
    });
  }
};

/**
 * @desc    Record active session heartbeat (increments active seconds for student date)
 * @route   POST /api/student/heartbeat
 * @access  Private (Authenticated User)
 */
const recordHeartbeat = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { incrementSeconds } = req.body;
    const now = new Date();
    const dateKey = formatDateKey(now);

    let activity = await StudentActivity.findOne({ studentId, date: dateKey });

    const secondsToAdd = Math.min(Math.max(Number(incrementSeconds) || 30, 5), 60);

    if (!activity) {
      activity = new StudentActivity({
        studentId,
        date: dateKey,
        activeSeconds: secondsToAdd,
        lastHeartbeat: now,
        isStreakCompleted: false, // Streak is strictly task submission based
      });
    } else {
      activity.activeSeconds = (activity.activeSeconds || 0) + secondsToAdd;
      activity.lastHeartbeat = now;
      // Streak completion is strictly driven by task submissions, not login/active seconds
    }

    await activity.save();

    res.status(200).json({
      success: true,
      date: dateKey,
      activeSeconds: activity.activeSeconds,
      isStreakCompleted: activity.isStreakCompleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record session heartbeat',
    });
  }
};

/**
 * @desc    Get student streak and weekly activity breakdown (task submission based)
 * @route   GET /api/student/streak
 * @access  Private (Authenticated User)
 */
const getStudentStreak = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();
    const todayKey = formatDateKey(now);

    // Fetch all task assignments with submission timestamps or completed/submitted status
    const assignments = await TaskAssignment.find({
      studentId,
      $or: [
        { submittedAt: { $ne: null } },
        { 'submissions.submittedAt': { $exists: true } },
        { status: { $in: ['submitted', 'completed', 'revision_requested'] } },
      ],
    }).select('submittedAt status submissions completedAt createdAt updatedAt');

    const submissionDateSet = new Set();
    const dateSubmissionCountMap = {};

    const registerDate = (dateVal) => {
      if (!dateVal) return;
      try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const key = formatDateKey(d);
          submissionDateSet.add(key);
          dateSubmissionCountMap[key] = (dateSubmissionCountMap[key] || 0) + 1;
        }
      } catch (e) {}
    };

    assignments.forEach((assignment) => {
      if (assignment.submittedAt) {
        registerDate(assignment.submittedAt);
      } else if (assignment.completedAt) {
        registerDate(assignment.completedAt);
      } else if (
        assignment.status === 'submitted' ||
        assignment.status === 'completed' ||
        assignment.status === 'revision_requested'
      ) {
        registerDate(assignment.updatedAt || assignment.createdAt);
      }

      if (Array.isArray(assignment.submissions)) {
        assignment.submissions.forEach((sub) => {
          if (sub.submittedAt) {
            registerDate(sub.submittedAt);
          }
        });
      }
    });

    // Also check StudentActivity records where taskSubmissionsCount > 0
    const activities = await StudentActivity.find({
      studentId,
      taskSubmissionsCount: { $gt: 0 },
    });
    activities.forEach((act) => {
      if (act.date) {
        submissionDateSet.add(act.date);
        dateSubmissionCountMap[act.date] = Math.max(
          dateSubmissionCountMap[act.date] || 0,
          act.taskSubmissionsCount || 1
        );
      }
    });

    // Calculate current consecutive streak based strictly on TASK SUBMISSION
    let currentStreak = 0;
    let checkDate = new Date(now);

    const hasSubmittedToday = submissionDateSet.has(todayKey);

    if (hasSubmittedToday) {
      currentStreak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const key = formatDateKey(checkDate);
        if (submissionDateSet.has(key)) {
          currentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      // If student hasn't submitted today yet, check yesterday to preserve ongoing streak
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = formatDateKey(checkDate);
      if (submissionDateSet.has(yesterdayKey)) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
          const key = formatDateKey(checkDate);
          if (submissionDateSet.has(key)) {
            currentStreak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }
    }

    // Build 7-day week array (Monday to Sunday of current week)
    const currentDayOfWeek = now.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weeklyActivity = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const dKey = formatDateKey(dayDate);
      const isCompleted = submissionDateSet.has(dKey);

      weeklyActivity.push({
        dateStr: dKey,
        dayName: dayLabels[i],
        dateNum: String(dayDate.getDate()).padStart(2, '0'),
        isStreakCompleted: isCompleted,
        taskSubmissionsCount: dateSubmissionCountMap[dKey] || 0,
        isToday: dKey === todayKey,
      });
    }

    res.status(200).json({
      success: true,
      currentStreak,
      todayStreakCompleted: hasSubmittedToday,
      totalTaskSubmissionsToday: dateSubmissionCountMap[todayKey] || 0,
      totalSubmissionDays: submissionDateSet.size,
      weeklyActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student streak',
    });
  }
};

/**
 * @desc    Get all resource progress for the logged-in student
 * @route   GET /api/student/resource-progress
 * @access  Private (Authenticated User)
 */
const getStudentResourceProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const progressList = await StudentResourceProgress.find({ studentId });
    res.status(200).json({
      success: true,
      count: progressList.length,
      progress: progressList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch resource progress',
    });
  }
};

/**
 * @desc    Update resource progress (watch time for video, or view event for doc/link)
 * @route   POST /api/student/resource-progress
 * @access  Private (Authenticated User)
 */
const updateResourceProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const {
      taskId,
      resourceId,
      resourceType,
      watchedSeconds,
      durationSeconds,
      requiredResourceIds,
      totalTaskResourcesCount,
    } = req.body;

    if (!taskId || !resourceId || !resourceType) {
      return res.status(400).json({
        success: false,
        message: 'taskId, resourceId, and resourceType are required',
      });
    }

    // Security check: Verify task exists
    let task = null;
    if (mongoose.Types.ObjectId.isValid(taskId)) {
      task = await Task.findById(taskId);
    }

    let progress = await StudentResourceProgress.findOne({
      studentId,
      taskId,
      resourceId,
    });

    const cleanType = String(resourceType).toLowerCase();
    const validTypes = ['video', 'pdf', 'docx', 'note', 'link'];
    const safeType = validTypes.includes(cleanType) ? cleanType : 'note';

    if (!progress) {
      progress = new StudentResourceProgress({
        studentId,
        taskId,
        resourceId,
        resourceType: safeType,
        durationSeconds: Number(durationSeconds) || 0,
        watchedSeconds: Number(watchedSeconds) || 0,
        progressPercentage: 0,
      });
    }

    progress.lastWatchedAt = new Date();

    if (safeType === 'video') {
      const newDur = Math.max(Number(durationSeconds) || 0, progress.durationSeconds || 0);
      const newWatched = Math.max(Number(watchedSeconds) || 0, progress.watchedSeconds || 0);
      progress.durationSeconds = newDur;
      progress.watchedSeconds = newWatched;
      progress.progressPercentage = newDur > 0 ? Math.min(100, Math.round((newWatched / newDur) * 100)) : 0;

      // Rule: Video watched >= 50% of total duration
      if (newDur > 0 && newWatched >= 0.5 * newDur) {
        progress.isCompleted = true;
        if (!progress.completedAt) progress.completedAt = new Date();
      }
    } else {
      // PDF, DOCX, Note, Link: viewing/opening marks completed
      progress.progressPercentage = 100;
      progress.isCompleted = true;
      if (!progress.completedAt) progress.completedAt = new Date();
    }

    await progress.save();

    // Required Resources Audit
    // Determine which resourceIds are REQUIRED for this task
    let reqIds = Array.isArray(requiredResourceIds) ? requiredResourceIds : [];
    
    // If not provided in body, fallback to matching all student resource progress records for this task
    let allTaskProgress = await StudentResourceProgress.find({ studentId, taskId });

    let isTaskCompleted = false;
    let taskStatus = 'in_progress';

    if (reqIds.length > 0) {
      // Task has explicitly defined required resource IDs
      const completedReqCount = allTaskProgress.filter(
        (p) => reqIds.includes(String(p.resourceId)) && p.isCompleted
      ).length;
      if (completedReqCount >= reqIds.length) {
        isTaskCompleted = true;
        taskStatus = 'completed';
      } else {
        taskStatus = 'in_progress';
      }
    } else {
      // Default rule: compare completed vs total assigned task resources count
      const totalCount = Number(totalTaskResourcesCount) || 4;
      const completedCount = allTaskProgress.filter((p) => p.isCompleted).length;
      if (completedCount >= totalCount) {
        isTaskCompleted = true;
        taskStatus = 'completed';
      } else {
        taskStatus = 'in_progress';
      }
    }

    // Update TaskAssignment in MongoDB
    if (mongoose.Types.ObjectId.isValid(taskId)) {
      let assignment = await TaskAssignment.findOne({ taskId, studentId });
      if (!assignment) {
        assignment = new TaskAssignment({
          taskId,
          studentId,
          status: taskStatus,
        });
      } else {
        assignment.status = taskStatus;
      }

      if (taskStatus === 'completed') {
        assignment.completedAt = assignment.completedAt || new Date();
      } else {
        assignment.completedAt = null;
      }
      await assignment.save();
    }

    res.status(200).json({
      success: true,
      progress,
      taskStatus,
      isTaskCompleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update resource progress',
    });
  }
};

/**
 * @desc    Get student's current team details & roster
 * @route   GET /api/student/team
 * @access  Private (Student / User)
 */
const getStudentTeam = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let team = null;

    if (user && user.teamId) {
      team = await Team.findById(user.teamId);
    }
    if (!team) {
      team = await Team.findOne({
        $or: [{ members: req.user._id }, { teamLeadId: req.user._id }],
      });
    }

    if (!team) {
      return res.status(200).json({
        success: true,
        hasTeam: false,
        team: null,
      });
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType branch year rollNumber')
      .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

    const maxMembers = populatedTeam.maxMembers || 9;
    const currentMembersCount = (populatedTeam.members ? populatedTeam.members.length : 0) + (populatedTeam.teamLeadId ? 1 : 0);

    res.status(200).json({
      success: true,
      hasTeam: true,
      team: populatedTeam,
      maxMembers,
      currentMembersCount,
    });
  } catch (error) {
    console.error('Error fetching student team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team',
    });
  }
};

/**
 * @desc    Get pending team invitations for student
 * @route   GET /api/student/team-invitations
 * @access  Private (Student / User)
 */
const getStudentInvitations = async (req, res) => {
  try {
    const invitations = await TeamRequest.find({
      invitedUserId: req.user._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('teamId', 'name teamNumber track maxMembers members teamLeadId')
      .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType');

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error('Error fetching student invitations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invitations',
    });
  }
};

/**
 * @desc    Accept or decline a team invitation
 * @route   POST /api/student/team-invitations/:id/respond
 * @access  Private (Student / User)
 */
const respondToTeamInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either accept or reject',
      });
    }

    const invitation = await TeamRequest.findById(id);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (invitation.invitedUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this invitation',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation is already ${invitation.status}`,
      });
    }

    const team = await Team.findById(invitation.teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Associated team no longer exists',
      });
    }

    if (action === 'accept') {
      // Check 9-member team capacity limit
      const maxLimit = team.maxMembers || 9;
      const currentTotal = (team.members ? team.members.length : 0) + (team.teamLeadId ? 1 : 0);
      if (currentTotal >= maxLimit) {
        invitation.status = 'rejected';
        invitation.respondedAt = new Date();
        await invitation.save();
        return res.status(400).json({
          success: false,
          message: `Team ${team.name} has already reached its maximum capacity of ${maxLimit} members.`,
        });
      }

      // Add user to team.members if not already present
      if (!team.members.some((m) => m.toString() === req.user._id.toString())) {
        team.members.push(req.user._id);
        await team.save();
      }

      // Update user document
      const currentUser = await User.findById(req.user._id);
      if (currentUser) {
        currentUser.teamId = team._id;
        await currentUser.save();
      }

      // Update invitation status
      invitation.status = 'accepted';
      invitation.respondedAt = new Date();
      await invitation.save();

      // Cancel other pending invitations for this user
      await TeamRequest.updateMany(
        {
          invitedUserId: req.user._id,
          _id: { $ne: invitation._id },
          status: 'pending',
        },
        {
          $set: { status: 'cancelled', respondedAt: new Date() },
        }
      );

      // Notify Team Lead
      try {
        await Notification.create({
          studentId: team.teamLeadId,
          teamId: team._id,
          title: `New Team Member: ${req.user.name}`,
          message: `${req.user.name} accepted your invitation and joined ${team.name}!`,
          type: 'team_joined',
          assignedBy: req.user.name,
        });
      } catch (e) {}

      const populatedTeam = await Team.findById(team._id)
        .populate('teamLeadId', 'name email phone phoneNumber avatar role memberType')
        .populate('members', 'name email phone phoneNumber avatar role memberType branch year rollNumber status');

      return res.status(200).json({
        success: true,
        message: `Congratulations! You have joined ${team.name}.`,
        team: populatedTeam,
      });
    } else {
      // Reject
      invitation.status = 'rejected';
      invitation.respondedAt = new Date();
      await invitation.save();

      // Notify Team Lead
      try {
        await Notification.create({
          studentId: team.teamLeadId,
          teamId: team._id,
          title: `Invitation Declined: ${req.user.name}`,
          message: `${req.user.name} declined the invitation to join ${team.name}.`,
          type: 'team_left',
          assignedBy: req.user.name,
        });
      } catch (e) {}

      return res.status(200).json({
        success: true,
        message: `Invitation to join ${team.name} has been declined.`,
      });
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to invitation',
    });
  }
};

module.exports = {
  getStudentTasks,
  updateStudentTaskStatus,
  recordHeartbeat,
  getStudentStreak,
  getStudentResourceProgress,
  updateResourceProgress,
  getStudentTeam,
  getStudentInvitations,
  respondToTeamInvitation,
  submitTaskDeliverables,
};
