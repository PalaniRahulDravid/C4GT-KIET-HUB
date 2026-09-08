const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
  },
  topic: {
    type: String,
    trim: true,
    default: '',
  },
  targetGroup: {
    type: String,
    required: [true, 'Target group is required'],
    enum: {
      values: ['junior_developers', 'developer_interns', 'both', 'individual'],
      message: 'Target group must be junior_developers, developer_interns, both, or individual',
    },
    default: 'both',
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    index: true,
  },
  priority: {
    type: String,
    default: 'Normal',
  },
  assignedTeams: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  deliverables: {
    type: [String],
    default: ['Source Code Repo', 'GitHub Pull Request', 'Documentation / Spec', 'Demo / Presentation'],
  },
  status: {
    type: String,
    default: 'Published',
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

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
