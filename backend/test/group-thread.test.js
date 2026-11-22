const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const groupId = '67a123456789012345678901';
const postId = '67a123456789012345678902';
const parentId = '67a123456789012345678903';
const groupPath = require.resolve(path.join(__dirname, '../src/models/Group'));
const postPath = require.resolve(path.join(__dirname, '../src/models/GroupPost'));
const commentPath = require.resolve(path.join(__dirname, '../src/models/GroupComment'));
let listFilter;
let parentFilter;
let createdPayload;
let promotedFilter;
let deleted = false;

const commentDocument = (fields) => ({
  ...fields,
  populate: async () => commentDocument(fields),
  toObject: () => fields,
  deleteOne: async () => { deleted = true; },
});

const fakeGroup = {
  findById: () => ({ select: async () => ({ creator: groupId, members: [groupId] }) }),
};
const fakePost = { exists: async () => true };
const fakeComment = {
  exists: async (filter) => { parentFilter = filter; return true; },
  create: async (fields) => {
    createdPayload = fields;
    return commentDocument({ ...fields, _id: '67a123456789012345678904' });
  },
  findOne: async () => commentDocument({
    _id: parentId,
    post: postId,
    group: groupId,
    author: { toString: () => groupId },
    content: 'Comentario padre',
  }),
  updateMany: async (filter) => { promotedFilter = filter; },
  find(filter) {
    listFilter = filter;
    return {
      select() { return this; },
      populate() { return this; },
      sort() { return this; },
      limit: async () => [],
    };
  },
};

require.cache[groupPath] = { id: groupPath, filename: groupPath, loaded: true, exports: fakeGroup };
require.cache[postPath] = { id: postPath, filename: postPath, loaded: true, exports: fakePost };
require.cache[commentPath] = { id: commentPath, filename: commentPath, loaded: true, exports: fakeComment };
const { getComments, createComment, deleteComment } = require('../src/controllers/groupContentController');

const request = async (parent) => {
  let status = 200;
  let body;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return this; },
  };
  await getComments({
    params: { groupId, postId },
    query: parent ? { parentId: parent } : {},
    user: { _id: groupId },
  }, res);
  return { status, body };
};

test('el foro consulta comentarios raíz y respuestas con cursores separados', async () => {
  assert.equal((await request()).status, 200);
  assert.equal(listFilter.parent, null);

  assert.equal((await request(parentId)).status, 200);
  assert.equal(String(parentFilter._id), parentId);
  assert.equal(listFilter.parent, parentId);

  assert.equal((await request('not-an-id')).status, 400);
});

test('crear una respuesta guarda su padre y borrar un comentario promueve sus respuestas', async () => {
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  await createComment({
    params: { groupId, postId },
    body: { content: 'Respuesta', parentId },
    user: { _id: groupId },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createdPayload.parent, parentId);
  assert.equal(res.body.parent, parentId);

  await deleteComment({
    params: { groupId, postId, commentId: parentId },
    user: { _id: groupId },
  }, res);
  assert.equal(promotedFilter.parent, parentId);
  assert.equal(deleted, true);
});
