const express = require('express');
const { googleAuth, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes - strictly real Google authentication
router.post('/google', googleAuth);
router.post('/logout', logout);

// Protected routes - strictly verified against live MongoDB Atlas user document
router.get('/me', protect, getMe);

module.exports = router;


