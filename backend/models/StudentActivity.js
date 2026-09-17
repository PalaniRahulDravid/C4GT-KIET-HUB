const mongoose = require('mongoose');

const studentActivitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    activeSeconds: {
      type: Number,
      default: 0,
    },
    taskSubmissionsCount: {
      type: Number,
      default: 0,
    },
    isStreakCompleted: {
      type: Boolean,
      default: false, // Streak completion is strictly driven by task submissions
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    lastSubmissionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce unique activity record per student per date
studentActivitySchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.StudentActivity ||
  mongoose.model('StudentActivity', studentActivitySchema);
