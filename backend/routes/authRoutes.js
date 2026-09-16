const express = require('express');
const { loginWithRollNumber, googleAuth, getMe, updateProfile, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes - Roll Number & Password authentication
router.post('/login', loginWithRollNumber);
router.post('/google', googleAuth);
router.post('/logout', logout);

// Protected routes - strictly verified against live MongoDB Atlas user document
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;


