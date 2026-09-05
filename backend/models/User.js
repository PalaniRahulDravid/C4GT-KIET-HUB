const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  rollNumber: {
    type: String,
    trim: true,
    default: null,
  },
  branch: {
    type: String,
    trim: true,
    default: null,
  },
  year: {
    type: Number,
    min: [1, 'Year must be at least 1'],
    max: [4, 'Year must be at most 4'],
    default: null,
  },
  memberType: {
    type: String,
    enum: {
      values: ['junior_developer', 'developer_intern'],
      message: 'Member type must be junior_developer or developer_intern',
    },
    default: null,
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'team_lead', 'student'],
      message: 'Role must be admin, team_lead, or student',
    },
    default: 'student',
    index: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'inactive'],
      message: 'Status must be active or inactive',
    },
    default: 'active',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
