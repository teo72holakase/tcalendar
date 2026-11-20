// Admins = usernames listados en ADMIN_USERNAMES (separados por coma). Registrá esas cuentas vos primero:
// si el usuario aún no existe, cualquiera podría registrarlo y quedar como admin.
const adminNames = () =>
  (process.env.ADMIN_USERNAMES || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

const isAdmin = (user) => Boolean(user) && adminNames().includes(String(user.username).toLowerCase());

const requireAdmin = (req, res, next) =>
  isAdmin(req.user) ? next() : res.status(403).json({ message: 'Solo administradores' });

module.exports = { isAdmin, requireAdmin };
