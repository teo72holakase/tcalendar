const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  topics: {
    type: String,
    trim: true,
  },
  assignedBy: {
    type: String,
    trim: true,
  },
  // FIX: el controller usa 'date', unificamos acá
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    trim: true,
  },
  requestedDate: {
    type: Date,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  // FIX: era createdBy — el controller usa creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', EventSchema);