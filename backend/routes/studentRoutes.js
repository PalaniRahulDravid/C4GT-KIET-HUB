const express = require('express');
const {
  getStudentTasks,
  updateStudentTaskStatus,
  recordHeartbeat,
  getStudentStreak,
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Require authentication for student endpoints
router.use(protect);

router.get('/tasks', getStudentTasks);
router.patch('/tasks/:taskId/status', updateStudentTaskStatus);
router.post('/heartbeat', recordHeartbeat);
router.get('/streak', getStudentStreak);

module.exports = router;
