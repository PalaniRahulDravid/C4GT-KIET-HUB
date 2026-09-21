const express = require('express');
const {
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
  deleteBatch,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and strictly the 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/teams/analytics', getTeamPerformanceAnalytics);
router.get('/teams', getTeams);
router.patch('/teams/:id/lead', assignTeamLead);
router.delete('/teams/:id/members/:memberId', removeTeamMember);
router.get('/resources', getResources);
router.post('/resources', createResource);
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.get('/batches', getBatches);
router.post('/batches', createBatchWithCohort);
router.delete('/batches/:id', deleteBatch);
router.patch('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

module.exports = router;


