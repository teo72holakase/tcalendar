const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSchedule } = require('../src/utils/schedule');

const validSchedule = {
  title: 'Semana de estudio',
  settings: {
    days: [1, 2, 3, 4, 5],
    startMinute: 480,
    endMinute: 1080,
    interval: 30,
    columnWidth: 152,
    rowHeight: 36,
  },
  blocks: [{
    title: 'Matemática',
    description: 'Tutoría semanal',
    days: [1, 3],
    startMinute: 540,
    endMinute: 600,
    color: '#3478a8',
    tone: 'soft',
  }],
};

test('valida y normaliza una tabla semanal y sus bloques', () => {
  const result = validateSchedule({ ...validSchedule, settings: { ...validSchedule.settings, days: [5, 1, 3, 1] } });
  assert.deepEqual(result.value.settings.days, [1, 3, 5]);
  assert.equal(result.value.blocks[0].title, 'Matemática');
  assert.equal(result.value.blocks[0].description, 'Tutoría semanal');
});

test('acepta descripciones opcionales de hasta 30 caracteres y rechaza las más largas', () => {
  const maximumDescription = structuredClone(validSchedule);
  maximumDescription.blocks[0].description = 'x'.repeat(30);
  assert.equal(validateSchedule(maximumDescription).value.blocks[0].description.length, 30);

  const missingDescription = structuredClone(validSchedule);
  delete missingDescription.blocks[0].description;
  assert.equal(validateSchedule(missingDescription).value.blocks[0].description, '');

  const longDescription = structuredClone(validSchedule);
  longDescription.blocks[0].description = 'x'.repeat(31);
  assert.match(validateSchedule(longDescription).error, /descripción/i);
});

test('rechaza bloques fuera de la tabla, colores inválidos y dimensiones extremas', () => {
  const outsideGrid = structuredClone(validSchedule);
  outsideGrid.blocks[0].endMinute = 1110;
  assert.match(validateSchedule(outsideGrid).error, /bloque/i);

  const badColor = structuredClone(validSchedule);
  badColor.blocks[0].color = 'red';
  assert.match(validateSchedule(badColor).error, /bloque/i);

  const badWidth = structuredClone(validSchedule);
  badWidth.settings.columnWidth = 999;
  assert.match(validateSchedule(badWidth).error, /configuración/i);
});
