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
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
  minimize: true,
});

// ✅ Solo un índice compuesto para búsquedas rápidas
InviteSchema.index({ group: 1, token: 1 });

module.exports = mongoose.model('Invite', InviteSchema);