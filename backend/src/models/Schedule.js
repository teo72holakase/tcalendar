const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 30, default: '' },
  days: [{ type: Number, min: 1, max: 7 }],
  startMinute: { type: Number, required: true, min: 0, max: 1439 },
  endMinute: { type: Number, required: true, min: 1, max: 1440 },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  tone: { type: String, enum: ['soft', 'balanced', 'vivid'], default: 'soft' },
});

const ScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group', index: true }],
  settings: {
    days: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7] },
    startMinute: { type: Number, default: 480 },
    endMinute: { type: Number, default: 1080 },
    interval: { type: Number, enum: [15, 30, 60], default: 30 },
    columnWidth: { type: Number, default: 152 },
    rowHeight: { type: Number, default: 36 },
  },
  blocks: { type: [BlockSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
