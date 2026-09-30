const express = require('express');
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and strictly the 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/teams/analytics', getTeamPerformanceAnalytics);
router.get('/teams', getTeams);
router.patch('/teams/:id/project', updateTeam);
router.patch('/teams/:id/lead', assignTeamLead);
router.patch('/teams/:id', updateTeam);
router.post('/teams/:id/members', addTeamMember);
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
router.post('/tasks/:taskId/review/:studentId', reviewTaskSubmission);

module.exports = router;


