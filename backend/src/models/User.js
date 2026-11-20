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
  // Retrato persistente elegido por el usuario entre los 8 disponibles.
  avatar: {
    type: String,
    enum: ['01', '02', '03', '04', '05', '06', '07', '08'],
    default: '01',
  },
  failedAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
