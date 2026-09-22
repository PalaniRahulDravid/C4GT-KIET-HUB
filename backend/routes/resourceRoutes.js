const express = require('express');
const {
  getResources,
  uploadResourceFile,
  createLinkResource,
  toggleResourceCompletion,
  recordResourceDownload,
  deleteResource,
  streamResourceFile,
} = require('../controllers/resourceController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Stream or download file directly with Cloudinary bypass
router.get('/:id/file', streamResourceFile);
router.get('/:id/download', streamResourceFile);

// View and filter resources (available to all students/admins; personalized if token/cookie present)
router.get('/', optionalAuth, getResources);

// Download counter
router.post('/:id/download', optionalAuth, recordResourceDownload);

// Require authentication for all protected management endpoints
router.use(protect);

// Student completion toggle
router.post('/:id/complete', toggleResourceCompletion);

// Admin & Team Lead upload / creation endpoints
router.post(
  '/upload',
  authorize('admin', 'teamlead', 'team_lead'),
  upload.single('file'),
  uploadResourceFile
);

router.post(
  '/link',
  authorize('admin', 'teamlead', 'team_lead'),
  createLinkResource
);

// Delete resource (Admin or original creator)
router.delete(
  '/:id',
  authorize('admin', 'teamlead', 'team_lead'),
  deleteResource
);

module.exports = router;
