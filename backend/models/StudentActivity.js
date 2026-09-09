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
    isStreakCompleted: {
      type: Boolean,
      default: false,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Enforce unique activity record per student per date
studentActivitySchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.StudentActivity ||
  mongoose.model('StudentActivity', studentActivitySchema);
