// Uso: node scripts/resetPassword.js <usuario> <contraseña nueva>
// Sirve para recuperar una contraseña olvidada (no hay email). También existe en la app: "Mi cuenta" → Administración.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { PASSWORD_MESSAGE, isValidPassword, hashPassword } = require('../src/utils/password');

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username || !isValidPassword(password)) {
    console.error(`Uso: node scripts/resetPassword.js <usuario> <contraseña nueva>\n${PASSWORD_MESSAGE}`);
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ username }).collation({ locale: 'es', strength: 2 });
  if (!user) {
    console.error('Usuario no encontrado');
    process.exit(1);
  }
  user.password = await hashPassword(password);
  user.failedAttempts = 0;
  user.lockUntil = null;
  await user.save();
  console.log(`Contraseña actualizada para ${user.username}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
