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

test('ajusta los eventos a cada fila regular y conserva el final exacto del rango', () => {
  const rows15 = structuredClone(validSchedule);
  rows15.settings.interval = 15;
  rows15.blocks[0].startMinute = 630;
  rows15.blocks[0].endMinute = 705;
  assert.equal(validateSchedule(rows15).value.blocks[0].endMinute, 705);

  const offGrid = structuredClone(rows15);
  offGrid.settings.interval = 30;
  assert.match(validateSchedule(offGrid).error, /filas/i);
});

test('valida períodos de duración variable con pausas sin perder sus horas reales', () => {
  const blocksSchedule = {
    title: 'Secuencia diaria',
    settings: {
      layoutMode: 'blocks',
      days: [1, 2, 3, 4, 5],
      startMinute: 635,
      endMinute: 705,
      interval: 15,
      columnWidth: 152,
      rowHeight: 40,
      cornerLabel: 'Hora',
      periods: [
        { id: 'period-1', label: 'Hora 1', durationMinutes: 35, gapAfterMinutes: 5 },
        { id: 'period-2', label: 'Hora 2', durationMinutes: 30, gapAfterMinutes: 0 },
      ],
    },
    blocks: [{
      title: 'Química',
      days: [1],
      rowId: 'period-2',
      startMinute: 675,
      endMinute: 705,
      color: '#3478a8',
      tone: 'soft',
    }],
  };
  assert.equal(validateSchedule(blocksSchedule).value.blocks[0].startMinute, 675);

  const wrongPeriod = structuredClone(blocksSchedule);
  wrongPeriod.blocks[0].startMinute = 670;
  assert.match(validateSchedule(wrongPeriod).error, /período/i);
});

test('valida una grilla Custom libre con columnas y filas propias', () => {
  const custom = {
    title: 'Tablero de tareas',
    settings: {
      layoutMode: 'custom',
      days: [],
      startMinute: 0,
      endMinute: 1440,
      interval: 15,
      columnWidth: 152,
      rowHeight: 36,
      cornerLabel: 'Etapa',
      columns: [{ id: 'equipo-a', label: 'Equipo A', width: 180 }],
      rows: [{ id: 'fase-1', label: 'Fase 1', height: 72, gapAfterMinutes: 0 }],
    },
    blocks: [{
      title: 'Diseño',
      days: [],
      rowId: 'fase-1',
      columnId: 'equipo-a',
      color: '#3478a8',
      tone: 'balanced',
    }],
  };
  const result = validateSchedule(custom);
  assert.equal(result.value.settings.columns[0].label, 'Equipo A');
  assert.equal(result.value.blocks[0].startMinute, null);

  const invalidCell = structuredClone(custom);
  invalidCell.blocks[0].columnId = 'missing';
  assert.match(validateSchedule(invalidCell).error, /Custom/i);
});
