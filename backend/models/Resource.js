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
      values: ['note', 'pdf', 'image', 'link'],
      message: 'Resource type must be note, pdf, image, or link',
    },
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  url: {
    type: String,
    required: [true, 'Resource URL or file reference is required'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required'],
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
