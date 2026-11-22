const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');

const groupId = new mongoose.Types.ObjectId();
const eventModelPath = require.resolve(path.join(__dirname, '../src/models/Event'));
const groupModelPath = require.resolve(path.join(__dirname, '../src/models/Group'));
let queryFilter;
let limit;

const fakeEventModel = {
  find(filter) {
    queryFilter = filter;
    const query = {
      populate() { return this; },
      sort() { return this; },
      limit(value) { limit = value; return this; },
      then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); },
    };
    return query;
  },
};
const fakeGroupModel = {
  findById: async () => ({ members: [groupId] }),
};

require.cache[eventModelPath] = { id: eventModelPath, filename: eventModelPath, loaded: true, exports: fakeEventModel };
require.cache[groupModelPath] = { id: groupModelPath, filename: groupModelPath, loaded: true, exports: fakeGroupModel };
const { getGroupEvents } = require('../src/controllers/eventController');

const search = async (q) => {
  let status = 200;
  let body;
  const res = {
    status(code) { status = code; return this; },
    json(value) { body = value; return this; },
  };
  await getGroupEvents({
    params: { groupId: String(groupId) },
    query: { q },
    user: { _id: groupId },
  }, res);
  return { status, body };
};

test('la búsqueda de eventos limita resultados y trata los códigos como ObjectId', async () => {
  const code = new mongoose.Types.ObjectId().toString();
  limit = 0;
  const result = await search(code);
  assert.equal(result.status, 200);
  assert.equal(limit, 8);
  assert.equal(queryFilter.$or[0].title.$regex, `^${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  assert.equal(String(queryFilter.$or[1]._id), code);
});
