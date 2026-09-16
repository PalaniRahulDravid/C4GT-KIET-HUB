const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
  },
  teamNumber: {
    type: Number,
    required: [true, 'Team number is required'],
    unique: true,
    min: [1, 'Team number must be between 1 and 9'],
    max: [9, 'Team number must be between 1 and 9'],
    index: true,
  },
  teamLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    sparse: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  maxMembers: {
    type: Number,
    default: 9,
    min: [1, 'Maximum members must be at least 1'],
    max: [20, 'Maximum members cannot exceed 20'],
  },
  track: {
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

teamSchema.index({ members: 1 });

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
