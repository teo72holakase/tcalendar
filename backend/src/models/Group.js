const mongoose = require('mongoose');
const crypto = require('crypto');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // Sello del grupo: id de un glifo de línea, nunca la inicial del nombre.
  icon: { type: String, default: 'calendar' },
  // FIX: era createdBy — el controller usa creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  color: { type: String, default: '#3B82F6' },
  // FIX: era required:true sin default — crasheaba si no se pasaba
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Group', GroupSchema);