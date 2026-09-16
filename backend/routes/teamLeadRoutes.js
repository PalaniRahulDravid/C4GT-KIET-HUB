const express = require('express');
const {
  getMyTeam,
  searchUsers,
  inviteMember,
  getTeamInvitations,
  cancelInvitation,
  removeMember,
} = require('../controllers/teamLeadController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Require authentication and teamlead/admin role
router.use(protect);
router.use(authorize('teamlead', 'admin'));

router.get('/my-team', getMyTeam);
router.get('/users', searchUsers);
router.post('/invite', inviteMember);
router.get('/invitations', getTeamInvitations);
router.delete('/invitations/:id', cancelInvitation);
router.delete('/members/:memberId', removeMember);

module.exports = router;
