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
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (teamLeadId) {
      const user = await User.findById(teamLeadId);
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
      team.teamLeadId = null;
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLeadId', 'name email avatar role')
      .populate('members', 'name email avatar role');

    res.status(200).json({
      success: true,
      message: `Team Lead assigned successfully for ${team.name}`,
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
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar');

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
    const { title, description, topic, targetGroup, deadline } = req.body;

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
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
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

    await Task.findByIdAndDelete(req.params.id);

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
  deleteTask,
};
