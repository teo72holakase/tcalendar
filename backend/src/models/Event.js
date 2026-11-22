const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  topics: { type: String, trim: true },
  assignedBy: { type: String, trim: true },
  dueDate: { type: Date, required: true },
  requestedDate: { type: Date },
  color: { type: String, default: '#A2CFFE' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminded: { type: Boolean, default: false }, // ya se mandó el recordatorio push de "mañana"
  createdAt: { type: Date, default: Date.now },
});

EventSchema.index({ group: 1, dueDate: 1 });
EventSchema.index({ group: 1, title: 1 });

module.exports = mongoose.model('Event', EventSchema);