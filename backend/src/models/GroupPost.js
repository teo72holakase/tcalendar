const mongoose = require('mongoose');

const GroupPostSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now },
});

GroupPostSchema.index({ group: 1, _id: -1 });

module.exports = mongoose.model('GroupPost', GroupPostSchema);
