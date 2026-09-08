const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');

/**
 * @desc    Get all registered users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
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

/**
 * @desc    Get all teams (auto-seeds 9 teams if none exist)
 * @route   GET /api/admin/teams
 * @access  Private/Admin
 */
const getTeams = async (req, res) => {
  try {
    let teams = await Team.find()
      .sort({ teamNumber: 1 })
      .populate('teamLeadId', 'name email avatar role')
      .populate('members', 'name email avatar role');

    // Auto-seed 9 cohort teams if database is empty
    if (teams.length === 0) {
      const seedTeams = [];
      for (let i = 1; i <= 9; i++) {
        seedTeams.push({
          name: `Team ${i}`,
          teamNumber: i,
          teamLeadId: null,
          members: [],
        });
      }
      await Team.insertMany(seedTeams);
      teams = await Team.find()
        .sort({ teamNumber: 1 })
        .populate('teamLeadId', 'name email avatar role')
        .populate('members', 'name email avatar role');
    }

    res.status(200).json({
      success: true,
      count: teams.length,
      teams,
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
      .populate('teamLeadId', 'name email avatar role')
      .populate('members', 'name email avatar role');

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
 * @desc    Get all tasks
 * @route   GET /api/admin/tasks
 * @access  Private/Admin
 */
const getTasks = async (req, res) => {
  try {
    let tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar');

    // Auto-seed default task if none exist
    if (tasks.length === 0) {
      const adminUser = (await User.findOne({ role: 'admin' })) || (await User.findOne());
      if (adminUser) {
        const defaultTask = await Task.create({
          title: 'Build Authentication Flow & Role Guards (Google SSO + RBAC)',
          description:
            'Connect Google OAuth 2.0 authentication with MongoDB Atlas users collection. Ensure Team Lead role gating and Admin privilege verification before granting workspace access. Provide unit tests and a live deployment preview link.',
          topic: 'Full-Stack Web Dev / Security & RBAC / MongoDB Atlas',
          targetGroup: 'both',
          deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
          priority: 'Normal',
          assignedTeams: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          deliverables: ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'],
          status: 'Published',
          createdBy: adminUser._id,
        });
        tasks = [await Task.findById(defaultTask._id).populate('createdBy', 'name email avatar')];
      }
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
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
      status: 'Published',
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar');

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
 * @desc    Delete a task
 * @route   DELETE /api/admin/tasks/:id
 * @access  Private/Admin
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task',
    });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  getAdminStats,
  getTeams,
  assignTeamLead,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
