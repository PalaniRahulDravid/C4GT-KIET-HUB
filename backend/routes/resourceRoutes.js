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
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Stream or download file directly with Cloudinary bypass
router.get('/:id/file', streamResourceFile);
router.get('/:id/download', streamResourceFile);

// Require authentication for all protected management endpoints
router.use(protect);

// View and filter resources
router.get('/', getResources);

// Student completion toggle & download counter
router.post('/:id/complete', toggleResourceCompletion);
router.post('/:id/download', recordResourceDownload);

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
