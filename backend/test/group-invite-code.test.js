const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const ownerId = '67a123456789012345678901';
const memberId = '67a123456789012345678902';
let group;
let update;

const fakeGroup = {
  findById: async () => group,
  findOne: async ({ inviteCode }) => (group?.inviteCode === inviteCode ? group : null),
  updateOne: async (...args) => { update = args; return { matchedCount: 1 }; },
};
const invitePath = require.resolve(path.join(__dirname, '../src/models/Invite'));
const groupPath = require.resolve(path.join(__dirname, '../src/models/Group'));
require.cache[invitePath] = { id: invitePath, filename: invitePath, loaded: true, exports: {} };
require.cache[groupPath] = { id: groupPath, filename: groupPath, loaded: true, exports: fakeGroup };

const { generateGroupCode, joinGroupByCode } = require('../src/controllers/inviteController');
const call = async (handler, body, userId = ownerId) => {
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await handler({ body, user: { _id: userId } }, res);
  return res;
};

test('el creador puede generar un código de seis dígitos', async () => {
  group = { _id: 'group-id', creator: ownerId, members: [ownerId], save: async () => {} };
  const res = await call(generateGroupCode, { groupId: group._id });
  assert.equal(res.statusCode, undefined);
  assert.match(res.body.code, /^\d{6}$/);
  assert.equal(group.inviteCode, res.body.code);
});

test('solo el creador puede generar un código', async () => {
  group = { _id: 'group-id', creator: ownerId, members: [], save: async () => {} };
  const res = await call(generateGroupCode, { groupId: group._id }, memberId);
  assert.equal(res.statusCode, 403);
});

test('un código válido agrega al usuario al grupo y uno inválido se rechaza', async () => {
  group = { _id: 'group-id', creator: ownerId, members: [ownerId], inviteCode: '012345' };
  const joined = await call(joinGroupByCode, { code: '012345' }, memberId);
  assert.equal(joined.body.success, true);
  assert.deepEqual(update, [{ _id: group._id, inviteCode: '012345' }, { $addToSet: { members: memberId } }]);

  const invalid = await call(joinGroupByCode, { code: '12345' }, memberId);
  assert.equal(invalid.statusCode, 400);
});

test('un miembro actual no puede volver a unirse con el código', async () => {
  group = { _id: 'group-id', creator: ownerId, members: [ownerId, memberId], inviteCode: '654321' };
  const res = await call(joinGroupByCode, { code: '654321' }, memberId);
  assert.equal(res.statusCode, 400);
});
