const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'in_progress', 'submitted', 'completed', 'not_completed', 'revision_requested'],
        message: 'Status must be pending, in_progress, submitted, completed, not_completed, or revision_requested',
      },
      default: 'pending',
      index: true,
    },
    submissionUrl: {
      type: String,
      trim: true,
      default: '',
    },
    submissions: [
      {
        deliverableName: {
          type: String,
          required: true,
          trim: true,
        },
        link: {
          type: String,
          trim: true,
          default: '',
        },
        fileUrl: {
          type: String,
          trim: true,
          default: '',
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    submissionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignment of the same task to the same student
taskAssignmentSchema.index({ taskId: 1, studentId: 1 }, { unique: true });

// Optimize status filtering per student for dashboard queries
taskAssignmentSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.models.TaskAssignment || mongoose.model('TaskAssignment', taskAssignmentSchema);
