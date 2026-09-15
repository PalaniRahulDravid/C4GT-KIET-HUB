const mongoose = require('mongoose');

const studentResourceProgressSchema = new mongoose.Schema(
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
      required: [true, 'Task reference is required'],
      index: true,
    },
    resourceId: {
      type: String,
      required: [true, 'Resource ID is required'],
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['video', 'pdf', 'docx', 'note', 'link'],
      lowercase: true,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    watchedSeconds: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentResourceProgressSchema.index(
  { studentId: 1, taskId: 1, resourceId: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.StudentResourceProgress ||
  mongoose.model('StudentResourceProgress', studentResourceProgressSchema);
