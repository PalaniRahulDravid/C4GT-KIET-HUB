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
      values: ['junior_developer', 'senior_developer', 'developer_intern'],
      message: 'Member type must be junior_developer, senior_developer, or developer_intern',
    },
    default: null,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['user', 'teamlead', 'admin', 'student', 'team_lead'],
      message: 'Role must be user, teamlead, or admin',
    },
    default: 'user',
    set: (val) => {
      if (val === 'student') return 'user';
      if (val === 'team_lead') return 'teamlead';
      return val;
    },
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

// Normalize role before saving
userSchema.pre('save', function (next) {
  if (this.role === 'student') this.role = 'user';
  if (this.role === 'team_lead') this.role = 'teamlead';
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
