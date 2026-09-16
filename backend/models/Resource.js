const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: {
      values: ['doc', 'excel', 'pdf', 'image', 'git_repo', 'dsa_problem', 'link', 'note'],
      message: 'Resource type must be doc, excel, pdf, image, git_repo, dsa_problem, link, or note',
    },
    lowercase: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  url: {
    type: String,
    required: [true, 'Resource URL or file link is required'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic / Domain is required'],
    trim: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'General'],
    default: 'General',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileFormat: {
    type: String,
    default: '',
    trim: true,
  },
  originalFilename: {
    type: String,
    default: '',
    trim: true,
  },
  cloudinaryPublicId: {
    type: String,
    default: '',
    trim: true,
  },
  targetTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required'],
    index: true,
  },
  completedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  downloadsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
