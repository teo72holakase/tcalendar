export const WEEK_DAYS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

export const BLOCK_COLORS = [
  '#247a70', '#397fbd', '#bd6b36', '#b84f69',
  '#755db3', '#5a8554', '#34829a', '#586376',
];

const weekdays = [1, 2, 3, 4, 5];
const baseSettings = {
  layoutMode: 'interval',
  days: [1, 2, 3, 4, 5, 6, 7],
  startMinute: 480,
  endMinute: 1080,
  interval: 30,
  columnWidth: 152,
  rowHeight: 36,
  cornerLabel: 'Hora',
  periods: [],
  columns: [],
  rows: [],
};

const column = (id, label, width = 180) => ({ id, label, width });
const row = (id, label, height = 56, gapAfterMinutes = 0) => ({ id, label, height, gapAfterMinutes });

export const createRowId = (prefix = 'row') => `${prefix}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10)}`;

export const getPeriodRows = (settings) => {
  let minute = settings.startMinute;
  let top = 0;
  return (settings.periods || []).map((period, index) => {
    const durationMinutes = Number(period.durationMinutes);
    const height = durationMinutes / settings.interval * settings.rowHeight;
    const result = {
      ...period,
      index,
      startMinute: minute,
      endMinute: minute + durationMinutes,
      top,
      height,
    };
    minute = result.endMinute + Number(period.gapAfterMinutes || 0);
    top += height;
    return result;
  });
};

export const cloneSettings = (settings) => ({
  ...baseSettings,
  ...settings,
  layoutMode: settings?.layoutMode || 'interval',
  days: [...(settings?.days || baseSettings.days)],
  periods: (settings?.periods || []).map((period) => ({ ...period })),
  columns: (settings?.columns || []).map((item) => ({ ...item })),
  rows: (settings?.rows || []).map((item) => ({ ...item })),
});

export const normalizeSchedule = (schedule) => ({
  ...schedule,
  settings: (() => {
    const settings = cloneSettings(schedule.settings || {});
    if (settings.layoutMode === 'interval') {
      const compatibleInterval = [settings.interval, 30, 15].find((interval) => (
        [15, 30, 60].includes(interval)
        && (settings.endMinute - settings.startMinute) % interval === 0
        && (schedule.blocks || []).every((block) => (
          Number.isInteger(block.startMinute) && Number.isInteger(block.endMinute)
          && (block.startMinute - settings.startMinute) % interval === 0
          && (block.endMinute - settings.startMinute) % interval === 0
        ))
      ));
      if (compatibleInterval) settings.interval = compatibleInterval;
    }
    return settings;
  })(),
  blocks: (schedule.blocks || []).map((item) => ({ ...item, days: [...(item.days || [])] })),
});

const block = (title, days, startMinute, endMinute, color, tone = 'soft') => ({
  title, days, startMinute, endMinute, color, tone,
});

export const SCHEDULE_PRESETS = [
  {
    id: 'blank',
    name: 'Desde cero',
    description: 'Una tabla semanal vacía con filas de 30 minutos.',
    title: 'Mi horario',
    settings: { ...baseSettings },
    blocks: [],
  },
  {
    id: 'interval-15',
    name: 'Filas de 15 minutos',
    description: 'Cada fila representa 15 minutos y los eventos encajan exactamente en la grilla.',
    title: 'Mi horario cada 15 min',
    settings: { ...baseSettings, days: weekdays, interval: 15, rowHeight: 32 },
    blocks: [],
  },
  {
    id: 'interval-30',
    name: 'Filas de 30 minutos',
    description: 'Cada fila representa 30 minutos y los eventos encajan exactamente en la grilla.',
    title: 'Mi horario cada 30 min',
    settings: { ...baseSettings, days: weekdays, interval: 30 },
    blocks: [],
  },
  {
    id: 'blocks',
    name: 'Bloques con pausas',
    description: 'Define períodos de distinta duración y pausas que se indican sin dejar huecos.',
    title: 'Mi horario por bloques',
    settings: {
      ...baseSettings,
      layoutMode: 'blocks',
      days: weekdays,
      startMinute: 635,
      endMinute: 705,
      interval: 15,
      rowHeight: 40,
      periods: [
        { id: 'period-1', label: 'Hora 1', durationMinutes: 35, gapAfterMinutes: 5 },
        { id: 'period-2', label: 'Hora 2', durationMinutes: 30, gapAfterMinutes: 0 },
      ],
    },
    blocks: [],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Crea una grilla libre: personaliza columnas, filas, tamaños y referencias.',
    title: 'Mi grilla personalizada',
    settings: {
      ...baseSettings,
      layoutMode: 'custom',
      cornerLabel: 'Referencia',
      columns: [column('column-1', 'Columna 1'), column('column-2', 'Columna 2')],
      rows: [row('row-1', 'Fila 1'), row('row-2', 'Fila 2')],
    },
    blocks: [],
  },
];

export const createPreset = (presetId) => {
  const preset = SCHEDULE_PRESETS.find((item) => item.id === presetId) || SCHEDULE_PRESETS[0];
  return {
    title: preset.title,
    settings: cloneSettings(preset.settings),
    blocks: preset.blocks.map((item) => ({ ...item, days: [...item.days] })),
  };
};

export const formatMinute = (minute) => {
  const hour = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
