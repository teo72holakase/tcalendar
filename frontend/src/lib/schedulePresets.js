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

const weekday = [1, 2, 3, 4, 5];
const baseSettings = {
  days: [1, 2, 3, 4, 5, 6, 7],
  startMinute: 480,
  endMinute: 1080,
  interval: 30,
  columnWidth: 152,
  rowHeight: 36,
};

const block = (title, days, startMinute, endMinute, color, tone = 'soft') => ({
  title, days, startMinute, endMinute, color, tone,
});

export const SCHEDULE_PRESETS = [
  {
    id: 'blank',
    name: 'Desde cero',
    description: 'Una tabla vacía para armar a tu manera',
    title: 'Mi horario',
    settings: baseSettings,
    blocks: [],
  },
  {
    id: 'study',
    name: 'Semana de estudio',
    description: 'Clases y bloques para estudiar',
    title: 'Semana de estudio',
    settings: { ...baseSettings, days: weekday },
    blocks: [
      block('Clases', [1, 3, 5], 540, 660, '#397fbd'),
      block('Estudio', [2, 4], 600, 720, '#755db3'),
      block('Repaso', [1, 3, 5], 780, 840, '#247a70'),
    ],
  },
  {
    id: 'work',
    name: 'Semana laboral',
    description: 'Una base sencilla para organizar el trabajo',
    title: 'Semana laboral',
    settings: { ...baseSettings, days: weekday, startMinute: 540, endMinute: 1020 },
    blocks: [
      block('Planificación', weekday, 540, 600, '#247a70'),
      block('Trabajo enfocado', weekday, 600, 720, '#397fbd'),
      block('Pausa', weekday, 720, 780, '#bd6b36'),
      block('Proyectos', weekday, 780, 960, '#755db3'),
    ],
  },
  {
    id: 'classes',
    name: 'Clases semanales',
    description: 'Espacios para clases, talleres o reuniones',
    title: 'Clases semanales',
    settings: { ...baseSettings, days: weekday },
    blocks: [
      block('Clase', [1, 3], 540, 630, '#397fbd'),
      block('Taller', [2, 4], 660, 750, '#b84f69'),
      block('Consulta', [5], 840, 900, '#5a8554'),
    ],
  },
  {
    id: 'training',
    name: 'Actividad y descanso',
    description: 'Alterná tus actividades durante la semana',
    title: 'Actividad y descanso',
    settings: baseSettings,
    blocks: [
      block('Entrenamiento', [1, 3, 5], 1020, 1080, '#5a8554'),
      block('Tiempo personal', [2, 4, 6], 960, 1020, '#bd6b36'),
    ],
  },
];

export const createPreset = (presetId) => {
  const preset = SCHEDULE_PRESETS.find((item) => item.id === presetId) || SCHEDULE_PRESETS[0];
  return {
    title: preset.title,
    settings: { ...preset.settings, days: [...preset.settings.days] },
    blocks: preset.blocks.map((item) => ({ ...item, days: [...item.days] })),
  };
};

export const formatMinute = (minute) => {
  const hour = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
