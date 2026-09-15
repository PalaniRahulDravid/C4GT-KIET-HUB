const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'task_assigned',
      enum: ['task_assigned', 'task_updated', 'announcement', 'reminder'],
    },
    assignedBy: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate task assignment notifications
notificationSchema.index(
  { studentId: 1, taskId: 1, type: 1 },
  { unique: true, sparse: true }
);

module.exports =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
