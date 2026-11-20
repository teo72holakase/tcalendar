const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { PASSWORD_MESSAGE, isValidPassword, hashPassword, checkPassword } = require('../utils/password');
const { isAdmin } = require('../utils/admin');

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const USERNAME_REGEX = /^[\p{L}\p{N}_.-]{3,20}$/u;

// Las búsquedas ignoran mayúsculas: en el celular el teclado suele capitalizar la primera letra.
const findByUsername = (username) =>
  User.findOne({ username }).collation({ locale: 'es', strength: 2 });

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const AVATARS = new Set(['01', '02', '03', '04', '05', '06', '07', '08']);

const toResponse = (user) => ({
  user: { id: user._id, username: user.username, avatar: user.avatar || '01', isAdmin: isAdmin(user) },
  token: generateToken(user._id),
});

const lockMessage = (user) => {
  if (!user.lockUntil || user.lockUntil <= new Date()) return null;
  return `Demasiados intentos. Probá de nuevo en ${Math.ceil((user.lockUntil - Date.now()) / 60000)} min`;
};

const registerFailure = async (userId) => {
  const u = await User.findByIdAndUpdate(userId, { $inc: { failedAttempts: 1 } }, { new: true });
  if (u && u.failedAttempts >= MAX_FAILS) {
    await User.updateOne({ _id: userId }, { failedAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MS) });
  }
};

exports.register = async (req, res) => {
  try {
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ message: 'El usuario debe tener entre 3 y 20 caracteres (letras, números, _ . -)' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: PASSWORD_MESSAGE });
    }
    if (await findByUsername(username)) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const user = await User.create({ username, password: await hashPassword(password) });
    res.status(201).json(toResponse(user));
  } catch (error) {
    // 11000 = dos registros simultáneos con el mismo usuario
    if (error.code === 11000) return res.status(400).json({ message: 'El usuario ya existe' });
    console.error('Error register:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    const user = await findByUsername(username);
    if (!user) return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });

    const locked = lockMessage(user);
    if (locked) return res.status(429).json({ message: locked });

    if (!(await checkPassword(password, user.password))) {
      await registerFailure(user._id);
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    if (user.failedAttempts || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { failedAttempts: 0, lockUntil: null });
    }
    res.json(toResponse(user));
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// Cambiar la propia contraseña: exige la actual y comparte el bloqueo por intentos con el login.
exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword ?? '');
    const newPassword = String(req.body.newPassword ?? '');
    if (!currentPassword || !isValidPassword(newPassword)) {
      return res.status(400).json({ message: PASSWORD_MESSAGE });
    }

    const user = await User.findById(req.user._id); // el middleware no trae el hash
    const locked = lockMessage(user);
    if (locked) return res.status(429).json({ message: locked });

    if (!(await checkPassword(currentPassword, user.password))) {
      await registerFailure(user._id);
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    await User.updateOne({ _id: user._id }, { password: await hashPassword(newPassword), failedAttempts: 0, lockUntil: null });
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error changePassword:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};

// Solo admins (ADMIN_USERNAMES): reemplaza scripts/resetPassword.js sin necesidad de consola.
exports.adminResetPassword = async (req, res) => {
  try {
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');
    if (!username || !isValidPassword(password)) {
      return res.status(400).json({ message: PASSWORD_MESSAGE });
    }
    const user = await findByUsername(username);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    await User.updateOne({ _id: user._id }, { password: await hashPassword(password), failedAttempts: 0, lockUntil: null });
    res.json({ message: `Contraseña de ${user.username} restablecida` });
  } catch (error) {
    console.error('Error adminResetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

exports.updateAvatar = async (req, res) => {
  const avatar = String(req.body.avatar ?? '');
  if (!AVATARS.has(avatar)) return res.status(400).json({ message: 'Foto de perfil no válida' });
  try {
    await User.updateOne({ _id: req.user._id }, { avatar });
    res.json({ message: 'Foto actualizada', avatar });
  } catch (error) {
    console.error('Error updateAvatar:', error);
    res.status(500).json({ message: 'No se pudo guardar la foto' });
  }
};

exports.getCurrentUser = async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar || '01',
    isAdmin: isAdmin(req.user),
  });
};
