const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    default: null, // null = ilimitado
  },
  maxUses: {
    type: Number,
    default: 1,
  },
  uses: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
  minimize: true,
});

InviteSchema.index({ group: 1, token: 1 });

module.exports = mongoose.model('Invite', InviteSchema);