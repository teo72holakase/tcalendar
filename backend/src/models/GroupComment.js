const mongoose = require('mongoose');

const GroupCommentSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupPost', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupComment', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

GroupCommentSchema.index({ post: 1, parent: 1, _id: -1 });
GroupCommentSchema.index({ group: 1, post: 1, parent: 1, _id: -1 });

module.exports = mongoose.model('GroupComment', GroupCommentSchema);
