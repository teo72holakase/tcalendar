// .ics y ventana de recordatorios (puras, sin base de datos).
const test = require('node:test');
const assert = require('node:assert');
const { buildIcs } = require('../src/utils/ics');
const { tomorrowRangeUTC } = require('../src/controllers/pushController');

test('buildIcs: CRLF, escapes, día completo y líneas ≤ 75 bytes', () => {
  const ics = buildIcs([{
    _id: 'abc123', title: 'Entrega; final, con "coma"',
    description: 'Línea 1\nLínea 2 ' + 'muy larga '.repeat(30), topics: 'Álgebra',
    dueDate: new Date('2026-11-20T12:00:00.000Z'),
  }], 'Mi grupo', new Date('2026-11-16T10:00:00.000Z'));
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261120') && ics.includes('DTEND;VALUE=DATE:20261121'));
  assert.ok(ics.includes('SUMMARY:Entrega\\; final\\, con "coma"'));
  assert.ok(ics.includes('Temas: Álgebra\\nLínea 1\\nLínea 2'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});

test('tomorrowRangeUTC cubre el día siguiente (UTC), también al cambiar de mes', () => {
  const { from, to } = tomorrowRangeUTC(new Date('2026-11-30T23:30:00Z'));
  assert.strictEqual(from.toISOString(), '2026-12-01T00:00:00.000Z');
  assert.strictEqual(to.toISOString(), '2026-12-01T23:59:59.999Z');
});
