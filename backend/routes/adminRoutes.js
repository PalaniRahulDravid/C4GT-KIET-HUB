const express = require('express');
const {
  getUsers,
  updateUserRole,
  getAdminStats,
  getTeams,
  assignTeamLead,
  getTasks,
  createTask,
  deleteTask,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and strictly the 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/teams', getTeams);
router.patch('/teams/:id/lead', assignTeamLead);
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.delete('/tasks/:id', deleteTask);

module.exports = router;

