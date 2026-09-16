const mongoose = require('mongoose');
const { Readable } = require('stream');
const Resource = require('../models/Resource');
const StudentResourceProgress = require('../models/StudentResourceProgress');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Helper to upload buffer to Cloudinary using upload_stream
 */
const uploadToCloudinary = (fileBuffer, originalFilename) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'c4gt_hub/resources',
        resource_type: 'auto',
        use_filename: true,
        filename_override: originalFilename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = Readable.from(fileBuffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Helper to determine resource type from file extension
 */
const getResourceTypeFromFile = (filename) => {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['doc', 'docx', 'txt'].includes(ext)) return 'doc';
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';
  return 'doc';
};

/**
 * @desc    Get all resources with filters & student completion status
 * @route   GET /api/resources
 * @access  Private (Student, TeamLead, Admin)
 */
const getResources = async (req, res) => {
  try {
    const { type, topic, difficulty, search } = req.query;
    const userId = req.user?._id;

    const query = {};

    if (type && type !== 'all') {
      if (type === 'files') {
        query.type = { $in: ['doc', 'excel', 'pdf', 'image'] };
      } else if (type === 'links') {
        query.type = { $in: ['git_repo', 'dsa_problem', 'link'] };
      } else {
        query.type = type;
      }
    }

    if (topic && topic !== 'all') {
      query.topic = topic;
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { topic: regex },
        { originalFilename: regex },
      ];
    }

    // Auto-seed starter learning resources if collection is completely empty
    const totalCount = await Resource.countDocuments();
    if (totalCount === 0) {
      const seedResources = [
        {
          title: 'DSA: Two Pointers & Sliding Window Mastery Guide',
          type: 'dsa_problem',
          description: 'Top LeetCode practice problems and algorithmic patterns for dynamic arrays and subarrays.',
          url: 'https://leetcode.com/problem-list/top-interview-questions/',
          topic: 'Data Structures & Algorithms',
          difficulty: 'Medium',
          createdBy: userId,
        },
        {
          title: 'C4GT KIET HUB - Official Core Monorepo',
          type: 'git_repo',
          description: 'Main production repository covering React frontend architecture, Express API, and Atlas DB.',
          url: 'https://github.com/c4gt-kiet/c4gt-hub',
          topic: 'Full-Stack Web Dev',
          difficulty: 'General',
          createdBy: userId,
        },
        {
          title: 'System Design & Security RBAC Specification',
          type: 'pdf',
          description: 'Official architecture document outlining role-based authentication, token validation, and DB models.',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          topic: 'Security & Cloud',
          fileFormat: 'pdf',
          fileSize: 1048576,
          originalFilename: 'C4GT_Security_RBAC_Spec.pdf',
          createdBy: userId,
        },
        {
          title: 'Cohort Student Performance & Milestone Tracker',
          type: 'excel',
          description: 'Master spreadsheet template for task completion metrics, daily streaks, and domain benchmarks.',
          url: 'https://file-examples.com/storage/fe92451c276632f7413a968/2017/02/file_example_XLSX_50.xlsx',
          topic: 'Student Performance',
          fileFormat: 'xlsx',
          fileSize: 524288,
          originalFilename: 'Student_Milestone_Tracker_2026.xlsx',
          createdBy: userId,
        },
      ];
      await Resource.insertMany(seedResources);
    }

    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role avatar');

    // Calculate completion metrics for the requesting user
    const formatted = resources.map((r) => {
      const isCompleted = Boolean(
        userId && r.completedBy && r.completedBy.some((uid) => uid.toString() === userId.toString())
      );
      return {
        _id: r._id,
        id: r._id,
        title: r.title,
        type: r.type,
        description: r.description,
        url: r.url,
        topic: r.topic,
        difficulty: r.difficulty,
        fileSize: r.fileSize,
        fileFormat: r.fileFormat,
        originalFilename: r.originalFilename,
        cloudinaryPublicId: r.cloudinaryPublicId,
        downloadsCount: r.downloadsCount || 0,
        createdBy: r.createdBy,
        isCompleted,
        createdAt: r.createdAt,
      };
    });

    const total = formatted.length;
    const completedCount = formatted.filter((r) => r.isCompleted).length;
    const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Extract available topics for filtering
    const topics = await Resource.distinct('topic');

    res.status(200).json({
      success: true,
      count: total,
      completedCount,
      completionPercentage,
      topics,
      resources: formatted,
    });
  } catch (error) {
    console.error('Failed to get resources:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch resources',
    });
  }
};

/**
 * @desc    Upload a file (Doc, Excel, PDF, Image) to Cloudinary & create Resource
 * @route   POST /api/resources/upload
 * @access  Private (Admin, TeamLead)
 */
const uploadResourceFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a document, spreadsheet, PDF, or image.',
      });
    }

    const { title, topic, description, difficulty, targetTeamId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required.' });
    }
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic / Domain is required.' });
    }

    const originalFilename = req.file.originalname;
    const fileFormat = (originalFilename.split('.').pop() || '').toLowerCase();
    const detectedType = getResourceTypeFromFile(originalFilename);

    let secureUrl = '';
    let publicId = '';

    if (isCloudinaryConfigured) {
      console.log(`Streaming ${originalFilename} (${req.file.size} bytes) to Cloudinary...`);
      const uploadResult = await uploadToCloudinary(req.file.buffer, originalFilename);
      secureUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    } else {
      // Fallback if Cloudinary credentials are not set
      console.warn('Cloudinary not configured. Storing data URL placeholder for testing.');
      const base64Data = req.file.buffer.toString('base64');
      secureUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      publicId = `local_${Date.now()}`;
    }

    const resource = await Resource.create({
      title: title.trim(),
      type: detectedType,
      description: description ? description.trim() : '',
      url: secureUrl,
      topic: topic.trim(),
      difficulty: difficulty || 'General',
      fileSize: req.file.size,
      fileFormat,
      originalFilename,
      cloudinaryPublicId: publicId,
      targetTeamId: targetTeamId || null,
      createdBy: req.user._id,
    });

    const populated = await Resource.findById(resource._id).populate(
      'createdBy',
      'name email role avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Resource file successfully uploaded to Cloudinary!',
      resource: populated,
    });
  } catch (error) {
    console.error('Resource upload failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Resource upload to Cloudinary failed',
    });
  }
};

/**
 * @desc    Create link resource (Git repo, DSA problem, Docs)
 * @route   POST /api/resources/link
 * @access  Private (Admin, TeamLead)
 */
const createLinkResource = async (req, res) => {
  try {
    const { title, url, type, topic, description, difficulty, targetTeamId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required.' });
    }
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Valid URL is required.' });
    }
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic / Domain is required.' });
    }

    const validTypes = ['git_repo', 'dsa_problem', 'link', 'note'];
    const safeType = validTypes.includes(type) ? type : 'link';

    const resource = await Resource.create({
      title: title.trim(),
      url: url.trim(),
      type: safeType,
      topic: topic.trim(),
      description: description ? description.trim() : '',
      difficulty: difficulty || 'General',
      targetTeamId: targetTeamId || null,
      createdBy: req.user._id,
    });

    const populated = await Resource.findById(resource._id).populate(
      'createdBy',
      'name email role avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Resource link added successfully!',
      resource: populated,
    });
  } catch (error) {
    console.error('Failed to create link resource:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create link resource',
    });
  }
};

/**
 * @desc    Toggle student completion status for a resource
 * @route   POST /api/resources/:id/complete
 * @access  Private (Student, TeamLead)
 */
const toggleResourceCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const alreadyCompleted = resource.completedBy.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (alreadyCompleted) {
      // Unmark completion
      resource.completedBy = resource.completedBy.filter(
        (uid) => uid.toString() !== userId.toString()
      );
      await resource.save();

      await StudentResourceProgress.findOneAndUpdate(
        { studentId: userId, resourceId: id },
        { isCompleted: false, progressPercentage: 0, completedAt: null }
      );

      return res.status(200).json({
        success: true,
        isCompleted: false,
        message: 'Resource unmarked as completed',
      });
    } else {
      // Mark as completed
      resource.completedBy.push(userId);
      await resource.save();

      await StudentResourceProgress.findOneAndUpdate(
        { studentId: userId, resourceId: id },
        {
          studentId: userId,
          resourceId: id,
          resourceType: resource.type,
          isCompleted: true,
          progressPercentage: 100,
          completedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        isCompleted: true,
        message: 'Great job! Resource marked as completed.',
      });
    }
  } catch (error) {
    console.error('Failed to toggle completion:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update resource completion',
    });
  }
};

/**
 * @desc    Record a download/view action on a resource
 * @route   POST /api/resources/:id/download
 * @access  Private
 */
const recordResourceDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloadsCount: 1 } },
      { new: true }
    );
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.status(200).json({
      success: true,
      downloadsCount: resource.downloadsCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a resource (Admin or original Creator)
 * @route   DELETE /api/resources/:id
 * @access  Private (Admin, TeamLead)
 */
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      resource.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this resource.',
      });
    }

    // If resource is on Cloudinary, delete it from Cloudinary
    if (resource.cloudinaryPublicId && isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(resource.cloudinaryPublicId, {
          resource_type: resource.type === 'image' ? 'image' : 'raw',
        });
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await Resource.findByIdAndDelete(id);
    await StudentResourceProgress.deleteMany({ resourceId: id });

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete resource:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete resource',
    });
  }
};

module.exports = {
  getResources,
  uploadResourceFile,
  createLinkResource,
  toggleResourceCompletion,
  recordResourceDownload,
  deleteResource,
};
