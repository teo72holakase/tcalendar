import test from 'node:test';
import assert from 'node:assert/strict';
import { getPeriodRows, normalizeSchedule } from '../src/lib/schedulePresets.js';

test('compresses gaps between periods without changing their real clock times', () => {
  const rows = getPeriodRows({
    startMinute: 635,
    interval: 15,
    rowHeight: 40,
    periods: [
      { id: 'period-1', label: 'Hora 1', durationMinutes: 35, gapAfterMinutes: 5 },
      { id: 'period-2', label: 'Hora 2', durationMinutes: 30, gapAfterMinutes: 0 },
    ],
  });

  assert.deepEqual(rows.map(({ startMinute, endMinute }) => [startMinute, endMinute]), [[635, 670], [675, 705]]);
  assert.equal(rows[1].top, rows[0].height);
  assert.equal(rows[1].height, 80);
});

test('uses the finest existing interval required to keep stored event boundaries aligned', () => {
  const schedule = normalizeSchedule({
    settings: { layoutMode: 'interval', days: [1], startMinute: 480, endMinute: 1080, interval: 30 },
    blocks: [{ startMinute: 630, endMinute: 705, days: [1] }],
  });

  assert.equal(schedule.settings.interval, 15);
});
