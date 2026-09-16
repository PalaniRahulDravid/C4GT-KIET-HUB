const mongoose = require('mongoose');

const teamRequestSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required'],
      index: true,
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team Lead reference is required'],
      index: true,
    },
    invitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Invited user reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

teamRequestSchema.index({ invitedUserId: 1, status: 1 });
teamRequestSchema.index({ teamId: 1, status: 1 });
teamRequestSchema.index({ teamId: 1, invitedUserId: 1, status: 1 });

module.exports =
  mongoose.models.TeamRequest || mongoose.model('TeamRequest', teamRequestSchema);
