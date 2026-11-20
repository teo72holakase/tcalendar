const bcrypt = require('bcryptjs');

// bcrypt simple (sin pepper): los usuarios creados con la versión original de la app siguen pudiendo entrar.
const PASSWORD_MESSAGE = 'La contraseña debe tener entre 6 y 64 caracteres';
const isValidPassword = (p) => typeof p === 'string' && p.length >= 6 && p.length <= 64;

const hashPassword = (password) => bcrypt.hash(password, 10);
const checkPassword = (password, hash) => bcrypt.compare(password, hash);

module.exports = { PASSWORD_MESSAGE, isValidPassword, hashPassword, checkPassword };
