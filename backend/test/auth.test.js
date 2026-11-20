// Contraseña, bloqueo, cambio, admin e isAdmin con un User simulado (no necesita MongoDB).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.ADMIN_USERNAMES = ' Admin , otra ';

const db = [];
let nextId = 1;
const fakeUser = {
  findOne: ({ username }) => {
    const found = db.find((u) => u.username.toLowerCase() === String(username).toLowerCase()) || null;
    const q = { collation: () => q, then: (res, rej) => Promise.resolve(found).then(res, rej) };
    return q;
  },
  findById: async (id) => db.find((u) => u._id === id) || null,
  create: async (data) => { const u = { _id: nextId++, failedAttempts: 0, lockUntil: null, ...data }; db.push(u); return u; },
  findByIdAndUpdate: async (id, upd) => { const u = db.find((x) => x._id === id); u.failedAttempts += upd.$inc.failedAttempts; return u; },
  updateOne: async ({ _id }, upd) => Object.assign(db.find((x) => x._id === _id), upd),
};
const modelPath = require.resolve(path.join(__dirname, '../src/models/User'));
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: fakeUser };

const { register, login, changePassword, adminResetPassword, updateAvatar, getCurrentUser } = require('../src/controllers/authController');
const { isAdmin } = require('../src/utils/admin');

const call = async (fn, body, user) => {
  let status = 200, json;
  const res = { status(c) { status = c; return this; }, json(j) { json = j; return this; } };
  await fn({ body, user }, res);
  return { status, json };
};

test('registro valida usuario y contraseña (mensaje original si faltan)', async () => {
  const empty = await call(register, { username: 'ana' });
  assert.strictEqual(empty.status, 400);
  assert.strictEqual(empty.json.message, 'Usuario y contraseña son requeridos');
  for (const password of ['12345', 'x'.repeat(65)]) assert.strictEqual((await call(register, { username: 'ana', password })).status, 400);
  assert.strictEqual((await call(register, { username: 'a!', password: 'secret1' })).status, 400);
});

test('registro + login (usuario sin distinguir mayúsculas) y hash bcrypt', async () => {
  assert.strictEqual((await call(register, { username: 'Miguel', password: 'clave-segura' })).status, 201);
  assert.strictEqual((await call(login, { username: 'miguel', password: 'clave-segura' })).status, 200);
  assert.strictEqual((await call(register, { username: 'MIGUEL', password: 'otra-clave' })).status, 400);
  assert.ok(db[0].password.startsWith('$2') && db[0].password !== 'clave-segura');
});

test('contraseña incorrecta da 400 y a los 5 intentos bloquea (429) incluso con la buena', async () => {
  for (let i = 0; i < 5; i++) assert.strictEqual((await call(login, { username: 'miguel', password: 'mala-clave' })).status, 400);
  assert.strictEqual((await call(login, { username: 'miguel', password: 'clave-segura' })).status, 429);
  db[0].lockUntil = new Date(Date.now() - 1000); // vence el bloqueo
  assert.strictEqual((await call(login, { username: 'miguel', password: 'clave-segura' })).status, 200);
  assert.strictEqual(db[0].failedAttempts, 0);
});

test('changePassword exige la actual y la vieja deja de servir', async () => {
  const me = { _id: db[0]._id };
  assert.strictEqual((await call(changePassword, { currentPassword: 'mala-clave', newPassword: 'nueva-clave' }, me)).status, 400);
  assert.strictEqual((await call(changePassword, { currentPassword: 'clave-segura', newPassword: '123' }, me)).status, 400);
  db[0].failedAttempts = 0;
  assert.strictEqual((await call(changePassword, { currentPassword: 'clave-segura', newPassword: 'nueva-clave' }, me)).status, 200);
  assert.strictEqual((await call(login, { username: 'miguel', password: 'clave-segura' })).status, 400);
  assert.strictEqual((await call(login, { username: 'miguel', password: 'nueva-clave' })).status, 200);
});

test('isAdmin + login informa isAdmin + adminResetPassword', async () => {
  assert.ok(isAdmin({ username: 'ADMIN' }) && isAdmin({ username: 'otra' }) && !isAdmin({ username: 'miguel' }) && !isAdmin(null));
  await call(register, { username: 'admin', password: 'admin-clave' });
  assert.strictEqual((await call(login, { username: 'Admin', password: 'admin-clave' })).json.user.isAdmin, true);
  db[0].lockUntil = new Date(Date.now() + 60000);
  assert.strictEqual((await call(adminResetPassword, { username: 'miguel', password: '123' })).status, 400);
  assert.strictEqual((await call(adminResetPassword, { username: 'nadie', password: 'abcdef' })).status, 404);
  assert.strictEqual((await call(adminResetPassword, { username: 'MIGUEL', password: 'reseteada1' })).status, 200);
  assert.strictEqual(db[0].lockUntil, null);
  assert.strictEqual((await call(login, { username: 'miguel', password: 'reseteada1' })).status, 200);
});

test('avatar se valida, persiste y se devuelve al revalidar la sesión', async () => {
  const me = { _id: db[0]._id };
  assert.strictEqual((await call(updateAvatar, { avatar: 'invalido' }, me)).status, 400);
  assert.strictEqual((await call(updateAvatar, { avatar: '06' }, me)).status, 200);
  assert.strictEqual(db[0].avatar, '06');
  const current = await call(getCurrentUser, {}, db[0]);
  assert.strictEqual(current.status, 200);
  assert.strictEqual(current.json.avatar, '06');
});
