const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 30, default: '' },
  days: { type: [{ type: Number, min: 1, max: 7 }], default: [] },
  startMinute: { type: Number, min: 0, max: 1440, default: null },
  endMinute: { type: Number, min: 0, max: 1440, default: null },
  rowId: { type: String, default: '' },
  columnId: { type: String, default: '' },
  color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  tone: { type: String, enum: ['soft', 'balanced', 'vivid'], default: 'soft' },
});

const ScheduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group', index: true }],
  settings: {
    layoutMode: { type: String, enum: ['interval', 'blocks', 'custom'], default: 'interval' },
    days: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7] },
    startMinute: { type: Number, default: 480 },
    endMinute: { type: Number, default: 1080 },
    interval: { type: Number, enum: [15, 30, 60], default: 30 },
    columnWidth: { type: Number, default: 152 },
    rowHeight: { type: Number, default: 36 },
    cornerLabel: { type: String, default: 'Hora', maxlength: 40 },
    periods: [{
      id: { type: String, required: true },
      label: { type: String, required: true, maxlength: 40 },
      durationMinutes: { type: Number, required: true, min: 15, max: 360 },
      gapAfterMinutes: { type: Number, default: 0, min: 0, max: 240 },
    }],
    columns: [{
      id: { type: String, required: true },
      label: { type: String, required: true, maxlength: 40 },
      width: { type: Number, required: true, min: 100, max: 320 },
    }],
    rows: [{
      id: { type: String, required: true },
      label: { type: String, required: true, maxlength: 50 },
      height: { type: Number, required: true, min: 28, max: 240 },
      gapAfterMinutes: { type: Number, default: 0, min: 0, max: 240 },
    }],
  },
  blocks: { type: [BlockSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
