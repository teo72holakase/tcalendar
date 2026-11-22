const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const groupId = '67a123456789012345678901';
const eventId = '67a123456789012345678902';
const resourceId = '67a123456789012345678903';
const eventPath = require.resolve(path.join(__dirname, '../src/models/Event'));
const resourcePath = require.resolve(path.join(__dirname, '../src/models/GroupResource'));
let eventFilter;
let resourceFilter;

const queryFor = (docs) => ({
  select() { return this; },
  lean: async () => docs,
});
const fakeEvents = {
  find(filter) {
    eventFilter = filter;
    return queryFor([{ _id: eventId, title: 'Entrega final', dueDate: new Date('2026-12-01T12:00:00Z') }]);
  },
};
const fakeResources = {
  find(filter) {
    resourceFilter = filter;
    return queryFor([{ _id: resourceId, title: 'Guía PDF', url: 'https://drive.example/guide.pdf' }]);
  },
};

require.cache[eventPath] = { id: eventPath, filename: eventPath, loaded: true, exports: fakeEvents };
require.cache[resourcePath] = { id: resourcePath, filename: resourcePath, loaded: true, exports: fakeResources };
const { attachMentions } = require('../src/controllers/groupContentController');

test('resuelve menciones solo dentro del grupo y devuelve títulos y destinos', async () => {
  const post = {
    content: `Revisen /${eventId} y !${resourceId}`,
    toObject() { return { content: this.content }; },
  };
  const [result] = await attachMentions([post], groupId);

  assert.equal(String(eventFilter.group), groupId);
  assert.equal(String(resourceFilter.group), groupId);
  assert.equal(result.eventRefs[eventId].title, 'Entrega final');
  assert.equal(result.resourceRefs[resourceId].title, 'Guía PDF');
  assert.equal(result.resourceRefs[resourceId].url, 'https://drive.example/guide.pdf');
});
