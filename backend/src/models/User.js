const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // Hash bcrypt de la contraseña.
  password: {
    type: String,
    required: true,
  },
  // Retrato elegido entre los 8 incluidos en frontend-alt/public/avatars.
  avatar: { type: String, default: '01' },
  failedAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
