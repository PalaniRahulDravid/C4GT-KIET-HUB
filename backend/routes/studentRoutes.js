const express = require('express');
const {
  getStudentTasks,
  updateStudentTaskStatus,
  recordHeartbeat,
  getStudentStreak,
  getStudentResourceProgress,
  updateResourceProgress,
  getStudentTeam,
  getStudentInvitations,
  respondToTeamInvitation,
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

const {
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');

const router = express.Router();

// Require authentication for student endpoints
router.use(protect);

router.get('/tasks', getStudentTasks);
router.patch('/tasks/:taskId/status', updateStudentTaskStatus);
router.post('/heartbeat', recordHeartbeat);
router.get('/streak', getStudentStreak);

// Resource progress tracking endpoints (automatic task completion)
router.get('/resource-progress', getStudentResourceProgress);
router.post('/resource-progress', updateResourceProgress);

// Notification endpoints
router.get('/notifications', getStudentNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// Team & Invitation endpoints
router.get('/team', getStudentTeam);
router.get('/team-invitations', getStudentInvitations);
router.post('/team-invitations/:id/respond', respondToTeamInvitation);

module.exports = router;
