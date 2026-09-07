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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

teamSchema.index({ members: 1 });

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
