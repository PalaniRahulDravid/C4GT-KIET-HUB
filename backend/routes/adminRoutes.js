const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and strictly the 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);

module.exports = router;
