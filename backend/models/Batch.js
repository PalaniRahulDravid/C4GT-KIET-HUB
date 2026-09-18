const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Batch ID is required'],
    unique: true,
    trim: true,
    index: true,
  },
  batchId: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  year: {
    type: String,
    required: [true, 'Batch Year/Name is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active Batch', 'Upcoming', 'Completed'],
    default: 'Upcoming',
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  teamsCount: {
    type: Number,
    default: 9,
  },
  activeTeamsCount: {
    type: Number,
    default: 9,
  },
  studentsCount: {
    type: Number,
    default: 81,
  },
  avgPerformance: {
    type: String,
    default: '0%',
  },
  upcoming: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
