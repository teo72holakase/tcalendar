const mongoose = require('mongoose');

const GroupResourceSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  url: { type: String, required: true, trim: true, maxlength: 2048 },
  fileType: { type: String, enum: ['auto', 'pdf', 'document', 'image', 'link'], default: 'auto' },
  createdAt: { type: Date, default: Date.now },
});

GroupResourceSchema.index({ group: 1, _id: -1 });
GroupResourceSchema.index({ group: 1, title: 1 });

module.exports = mongoose.model('GroupResource', GroupResourceSchema);
