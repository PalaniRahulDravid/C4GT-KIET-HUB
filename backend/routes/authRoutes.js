const express = require('express');
const { googleAuth, getMe, devLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/google', googleAuth);
router.post('/dev-login', devLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
