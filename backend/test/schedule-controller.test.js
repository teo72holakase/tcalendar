const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const groups = new Map();
const schedules = new Map();
const populateCalls = [];
const scheduleModelPath = require.resolve(path.join(__dirname, '../src/models/Schedule'));
const groupModelPath = require.resolve(path.join(__dirname, '../src/models/Group'));

const fakeScheduleModel = {
  create: async (data) => {
    const schedule = {
      _id: 'schedule-1',
      sharedWith: [],
      ...data,
      set(values) { Object.assign(this, values); },
      save: async function save() { return this; },
      populate: async function populate() { return this; },
    };
    schedules.set(schedule._id, schedule);
    return schedule;
  },
  findById: async (id) => schedules.get(String(id)) || null,
  findByIdAndDelete: async (id) => schedules.delete(String(id)),
  updateOne: async ({ _id }, update) => {
    const schedule = schedules.get(String(_id));
    if (schedule && update.$addToSet && !schedule.sharedWith.includes(update.$addToSet.sharedWith)) {
      schedule.sharedWith.push(update.$addToSet.sharedWith);
    }
    return { modifiedCount: schedule ? 1 : 0 };
  },
  find: (filter) => {
    const docs = [...schedules.values()].filter((schedule) => {
      if (typeof filter.owner === 'string') return schedule.owner === filter.owner;
      return schedule.owner !== filter.owner.$ne
        && schedule.sharedWith.some((groupId) => filter.sharedWith.$in.includes(groupId));
    });
    const query = {
      populate: (path, select) => { populateCalls.push({ filter, path, select }); return query; },
      sort: async () => docs,
    };
    return query;
  },
};
const fakeGroupModel = {
  findById: async (id) => groups.get(String(id)) || null,
  find: ({ members }) => ({
    select: async () => [...groups.values()].filter((group) => group.members.includes(members)).map(({ _id }) => ({ _id })),
  }),
};

require.cache[scheduleModelPath] = { id: scheduleModelPath, filename: scheduleModelPath, loaded: true, exports: fakeScheduleModel };
require.cache[groupModelPath] = { id: groupModelPath, filename: groupModelPath, loaded: true, exports: fakeGroupModel };
const {
  addScheduleToGroup,
  removeScheduleFromGroup,
  updateSchedule,
  deleteSchedule,
  getSchedules,
} = require('../src/controllers/scheduleController');

const input = {
  title: 'Horario compartido',
  settings: { days: [1, 2, 3], startMinute: 480, endMinute: 1080, interval: 30, columnWidth: 152, rowHeight: 36 },
  blocks: [{ title: 'Clase', days: [1], startMinute: 540, endMinute: 600, color: '#3478a8', tone: 'soft' }],
};

const request = async (handler, body, userId, params = {}) => {
  let status = 200;
  let json;
  const res = { status(code) { status = code; return this; }, json(value) { json = value; return this; } };
  await handler({ body, user: { _id: userId }, params }, res);
  return { status, json };
};

test.beforeEach(() => {
  groups.clear();
  schedules.clear();
  populateCalls.length = 0;
  groups.set('group-1', { _id: 'group-1', creator: 'creator-1', members: ['creator-1', 'member-1'] });
  schedules.set('schedule-1', {
    _id: 'schedule-1',
    owner: 'author-1',
    sharedWith: ['group-1'],
    populate: async function populate() { return this; },
    set(values) { Object.assign(this, values); },
    save: async function save() { return this; },
  });
});

test('cualquier miembro del grupo puede añadir un horario compartido', async () => {
  const result = await request(addScheduleToGroup, {}, 'member-1', { scheduleId: 'schedule-1', groupId: 'group-1' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.json.sharedWith, ['group-1']);
  const outsider = await request(addScheduleToGroup, {}, 'outsider-1', { scheduleId: 'schedule-1', groupId: 'group-1' });
  assert.equal(outsider.status, 403);
});

test('solo quien creó el horario o el grupo puede quitarlo del grupo', async () => {
  const denied = await request(removeScheduleFromGroup, {}, 'member-1', { scheduleId: 'schedule-1', groupId: 'group-1' });
  assert.equal(denied.status, 403);

  const removedByGroupCreator = await request(removeScheduleFromGroup, {}, 'creator-1', { scheduleId: 'schedule-1', groupId: 'group-1' });
  assert.equal(removedByGroupCreator.status, 200);
  assert.deepEqual(schedules.get('schedule-1').sharedWith, []);

  schedules.get('schedule-1').sharedWith.push('group-1');
  const removedByAuthor = await request(removeScheduleFromGroup, {}, 'author-1', { scheduleId: 'schedule-1', groupId: 'group-1' });
  assert.equal(removedByAuthor.status, 200);
});

test('solo el autor puede editar o eliminar el horario', async () => {
  const deniedEdit = await request(updateSchedule, input, 'member-1', { scheduleId: 'schedule-1' });
  assert.equal(deniedEdit.status, 403);

  const deniedDelete = await request(deleteSchedule, {}, 'member-1', { scheduleId: 'schedule-1' });
  assert.equal(deniedDelete.status, 403);

  const allowedEdit = await request(updateSchedule, input, 'author-1', { scheduleId: 'schedule-1' });
  assert.equal(allowedEdit.status, 200);
  const allowedDelete = await request(deleteSchedule, {}, 'author-1', { scheduleId: 'schedule-1' });
  assert.equal(allowedDelete.status, 200);
});

test('los horarios compartidos solo revelan los grupos a los que pertenece el usuario', async () => {
  schedules.get('schedule-1').sharedWith = [];
  groups.set('group-2', { _id: 'group-2', creator: 'another-creator', members: ['other-member'] });
  schedules.set('schedule-2', {
    _id: 'schedule-2',
    owner: 'another-author',
    sharedWith: ['group-1', 'group-2'],
    updatedAt: new Date('2026-01-02'),
  });
  const result = await request(getSchedules, {}, 'member-1');
  assert.equal(result.status, 200);
  assert.equal(result.json.length, 1);
  const sharedPopulate = populateCalls.find((call) => call.filter.owner?.$ne && call.path?.path === 'sharedWith');
  assert.deepEqual(sharedPopulate.path.match._id.$in, ['group-1']);
});
