const TONES = new Set(['soft', 'balanced', 'vivid']);
const INTERVALS = new Set([15, 30, 60]);

const isMinute = (value) => Number.isInteger(value) && value >= 0 && value <= 1440;
const normalizeDays = (days) => (
  Array.isArray(days)
  && days.length > 0
  && days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)
  ? [...new Set(days)].sort((a, b) => a - b)
  : null
);

const validateSchedule = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Datos del horario no válidos' };
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 80) return { error: 'El nombre debe tener entre 1 y 80 caracteres' };

  const settings = input.settings;
  const days = normalizeDays(settings?.days);
  const interval = settings?.interval;
  const startMinute = settings?.startMinute;
  const endMinute = settings?.endMinute;
  const columnWidth = settings?.columnWidth;
  const rowHeight = settings?.rowHeight;

  if (
    !days
    || !INTERVALS.has(interval)
    || !isMinute(startMinute)
    || !isMinute(endMinute)
    || startMinute >= endMinute
    || startMinute % 15
    || endMinute % 15
    || !Number.isInteger(columnWidth) || columnWidth < 100 || columnWidth > 320
    || !Number.isInteger(rowHeight) || rowHeight < 28 || rowHeight > 100
  ) return { error: 'La configuración de la tabla no es válida' };

  if (!Array.isArray(input.blocks) || input.blocks.length > 80) return { error: 'El horario admite hasta 80 bloques' };
  const blocks = [];
  for (const block of input.blocks) {
    const blockTitle = typeof block?.title === 'string' ? block.title.trim() : '';
    const rawDescription = block?.description;
    const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
    const blockDays = normalizeDays(block?.days);
    if (
      !blockTitle || blockTitle.length > 60 || !blockDays
      || (rawDescription != null && typeof rawDescription !== 'string') || description.length > 30
      || blockDays.some((day) => !days.includes(day))
      || !isMinute(block.startMinute) || !isMinute(block.endMinute)
      || block.startMinute >= block.endMinute
      || block.startMinute < startMinute || block.endMinute > endMinute
      || block.startMinute % 15 || block.endMinute % 15
      || typeof block.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(block.color)
      || !TONES.has(block.tone)
    ) return { error: 'Revisá el nombre, descripción, días, horario y color de cada bloque' };

    blocks.push({
      title: blockTitle,
      description,
      days: blockDays,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      color: block.color,
      tone: block.tone,
    });
  }

  return {
    value: {
      title,
      settings: { days, startMinute, endMinute, interval, columnWidth, rowHeight },
      blocks,
    },
  };
};

module.exports = { validateSchedule };
