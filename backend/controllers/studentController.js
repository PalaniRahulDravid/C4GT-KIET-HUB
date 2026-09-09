const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Team = require('../models/Team');
const StudentActivity = require('../models/StudentActivity');

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
    const assignments = await TaskAssignment.find({ studentId });
    const assignmentMap = {};
    assignments.forEach((a) => {
      assignmentMap[a.taskId.toString()] = a.status;
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
      .populate('createdBy', 'name email avatar role');

    // Fallback: if database has tasks but query returned none, return published tasks for cohort
    if (tasks.length === 0) {
      tasks = await Task.find()
        .sort({ deadline: 1 })
        .populate('createdBy', 'name email avatar role');
    }

    // Attach student specific status to each task
    const tasksWithStatus = tasks.map((t) => {
      const taskObj = t.toObject();
      taskObj.status = assignmentMap[t._id.toString()] || 'pending';
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
 * @desc    Update task status for logged-in student
 * @route   PATCH /api/student/tasks/:taskId/status
 * @access  Private (Authenticated User)
 */
const updateStudentTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const studentId = req.user._id;

    const allowedStatuses = ['pending', 'in_progress', 'completed', 'not_completed'];
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
    } else {
      assignment.completedAt = null;
    }

    await assignment.save();

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
        isStreakCompleted: secondsToAdd >= 900, // 15 minutes = 900 seconds
      });
    } else {
      activity.activeSeconds = (activity.activeSeconds || 0) + secondsToAdd;
      activity.lastHeartbeat = now;
      if (activity.activeSeconds >= 900) {
        activity.isStreakCompleted = true;
      }
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
 * @desc    Get student streak and weekly activity breakdown (15 min requirement)
 * @route   GET /api/student/streak
 * @access  Private (Authenticated User)
 */
const getStudentStreak = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();
    const todayKey = formatDateKey(now);

    // Fetch student activity records for the last 90 days
    const activities = await StudentActivity.find({ studentId })
      .sort({ date: -1 })
      .limit(90);

    const activityMap = {};
    activities.forEach((act) => {
      activityMap[act.date] = act;
    });

    // Calculate current consecutive streak (15+ min required per day)
    let currentStreak = 0;
    let checkDate = new Date(now);

    const todayAct = activityMap[todayKey];
    const todayCompleted = todayAct && todayAct.isStreakCompleted;

    if (!todayCompleted) {
      // If today is not completed yet, check yesterday to start counting consecutive streak
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = formatDateKey(checkDate);
      const act = activityMap[key];
      if (act && act.isStreakCompleted) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Build 7-day week array (Monday to Sunday of current week)
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weeklyActivity = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const dKey = formatDateKey(dayDate);
      const act = activityMap[dKey];

      weeklyActivity.push({
        dateStr: dKey,
        dayName: dayLabels[i],
        dateNum: String(dayDate.getDate()).padStart(2, '0'),
        isStreakCompleted: Boolean(act && act.isStreakCompleted),
        activeSeconds: act ? act.activeSeconds : 0,
        isToday: dKey === todayKey,
      });
    }

    res.status(200).json({
      success: true,
      currentStreak,
      todayActiveSeconds: todayAct ? todayAct.activeSeconds : 0,
      todayStreakCompleted: Boolean(todayAct && todayAct.isStreakCompleted),
      weeklyActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student streak',
    });
  }
};

module.exports = {
  getStudentTasks,
  updateStudentTaskStatus,
  recordHeartbeat,
  getStudentStreak,
};
