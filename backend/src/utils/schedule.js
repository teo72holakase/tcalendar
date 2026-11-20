const TONES = new Set(['soft', 'balanced', 'vivid']);
const LAYOUT_MODES = new Set(['interval', 'blocks', 'custom']);
const INTERVALS = new Set([15, 30, 60]);

const isMinute = (value) => Number.isInteger(value) && value >= 0 && value <= 1440;
const isId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const normalizeDays = (days, allowEmpty = false) => (
  Array.isArray(days)
  && (allowEmpty || days.length > 0)
  && days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)
  ? [...new Set(days)].sort((a, b) => a - b)
  : null
);
const validIdList = (items) => items.every((item) => item && typeof item === 'object' && isId(item.id))
  && new Set(items.map((item) => item.id)).size === items.length;

const validateSchedule = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Datos del horario no válidos' };
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 80) return { error: 'El nombre debe tener entre 1 y 80 caracteres' };

  const rawSettings = input.settings;
  const layoutMode = rawSettings?.layoutMode || 'interval';
  const allowCustom = layoutMode === 'custom';
  const days = normalizeDays(rawSettings?.days, allowCustom);
  const interval = rawSettings?.interval;
  const startMinute = rawSettings?.startMinute;
  const endMinute = rawSettings?.endMinute;
  const columnWidth = rawSettings?.columnWidth;
  const rowHeight = rawSettings?.rowHeight;

  if (
    !LAYOUT_MODES.has(layoutMode)
    || !days
    || !INTERVALS.has(interval)
    || !isMinute(startMinute)
    || !isMinute(endMinute)
    || startMinute >= endMinute
    || !Number.isInteger(columnWidth) || columnWidth < 100 || columnWidth > 320
    || !Number.isInteger(rowHeight) || rowHeight < 28 || rowHeight > 100
    || typeof (rawSettings?.cornerLabel ?? 'Hora') !== 'string'
    || (rawSettings?.cornerLabel ?? 'Hora').trim().length > 40
  ) return { error: 'La configuración de la tabla no es válida' };

  const periods = rawSettings.periods ?? [];
  const columns = rawSettings.columns ?? [];
  const rows = rawSettings.rows ?? [];
  if (!Array.isArray(periods) || !Array.isArray(columns) || !Array.isArray(rows)) {
    return { error: 'La configuración de la tabla no es válida' };
  }

  if (layoutMode === 'blocks') {
    if (!days.length || periods.length < 1 || periods.length > 60 || !validIdList(periods)) {
      return { error: 'La secuencia debe tener entre 1 y 60 períodos con identificadores únicos' };
    }
    let totalMinutes = 0;
    for (const period of periods) {
      const label = typeof period.label === 'string' ? period.label.trim() : '';
      if (
        !label || label.length > 40
        || !Number.isInteger(period.durationMinutes) || period.durationMinutes < 15 || period.durationMinutes > 360
        || !Number.isInteger(period.gapAfterMinutes) || period.gapAfterMinutes < 0 || period.gapAfterMinutes > 240
      ) return { error: 'Revisá el nombre, la duración y la pausa de cada período' };
      totalMinutes += period.durationMinutes + period.gapAfterMinutes;
    }
    if (startMinute + totalMinutes - periods.at(-1).gapAfterMinutes > 1440) {
      return { error: 'La secuencia de períodos supera el final del día' };
    }
  }

  if (layoutMode === 'custom') {
    if (
      days.length
      || columns.length < 1 || columns.length > 14 || !validIdList(columns)
      || rows.length < 1 || rows.length > 60 || !validIdList(rows)
    ) return { error: 'La grilla Custom necesita columnas y filas con identificadores únicos' };
    if (columns.some((item) => (
      typeof item.label !== 'string' || !item.label.trim() || item.label.trim().length > 40
      || !Number.isInteger(item.width) || item.width < 100 || item.width > 320
    ))) return { error: 'Revisá los títulos y anchos de las columnas Custom' };
    if (rows.some((item) => (
      typeof item.label !== 'string' || !item.label.trim() || item.label.trim().length > 50
      || !Number.isInteger(item.height) || item.height < 28 || item.height > 240
      || !Number.isInteger(item.gapAfterMinutes) || item.gapAfterMinutes < 0 || item.gapAfterMinutes > 240
    ))) return { error: 'Revisá las referencias, alturas y pausas de las filas Custom' };
  }

  if (!Array.isArray(input.blocks) || input.blocks.length > 80) return { error: 'El horario admite hasta 80 bloques' };
  const blocks = [];
  for (const block of input.blocks) {
    const blockTitle = typeof block?.title === 'string' ? block.title.trim() : '';
    const rawDescription = block?.description;
    const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';
    const blockDays = normalizeDays(block?.days, layoutMode === 'custom');
    const rowId = block?.rowId ?? '';
    const columnId = block?.columnId ?? '';
    const validBase = blockTitle && blockTitle.length <= 60
      && blockDays
      && (rawDescription == null || typeof rawDescription === 'string') && description.length <= 30
      && typeof block.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(block.color)
      && TONES.has(block.tone);
    if (!validBase) return { error: 'Revisá el nombre, descripción, días y color de cada bloque' };

    if (layoutMode === 'interval') {
      if (
        !blockDays.length || blockDays.some((day) => !days.includes(day))
        || !isMinute(block.startMinute) || !isMinute(block.endMinute)
        || block.startMinute >= block.endMinute
        || block.startMinute < startMinute || block.endMinute > endMinute
        || (block.startMinute - startMinute) % interval || (block.endMinute - startMinute) % interval
      ) return { error: 'Los bloques deben ajustarse a las filas y horas de la tabla' };
    } else if (layoutMode === 'blocks') {
      const periodIndex = periods.findIndex((period) => period.id === rowId);
      if (
        periodIndex < 0 || !blockDays.length || blockDays.some((day) => !days.includes(day))
      ) return { error: 'Cada evento debe pertenecer a un período y día válido' };
      let periodStart = startMinute;
      for (let index = 0; index < periodIndex; index += 1) {
        periodStart += periods[index].durationMinutes + periods[index].gapAfterMinutes;
      }
      const periodEnd = periodStart + periods[periodIndex].durationMinutes;
      if (block.startMinute !== periodStart || block.endMinute !== periodEnd) {
        return { error: 'El horario del evento no coincide con su período' };
      }
    } else if (
      !isId(rowId) || !rows.some((item) => item.id === rowId)
      || !isId(columnId) || !columns.some((item) => item.id === columnId)
    ) return { error: 'Cada evento debe pertenecer a una fila y columna Custom válidas' };

    blocks.push({
      title: blockTitle,
      description,
      days: blockDays,
      startMinute: Number.isInteger(block.startMinute) ? block.startMinute : null,
      endMinute: Number.isInteger(block.endMinute) ? block.endMinute : null,
      rowId: isId(rowId) ? rowId : '',
      columnId: isId(columnId) ? columnId : '',
      color: block.color,
      tone: block.tone,
    });
  }

  return {
    value: {
      title,
      settings: {
        layoutMode,
        days,
        startMinute,
        endMinute,
        interval,
        columnWidth,
        rowHeight,
        cornerLabel: (rawSettings.cornerLabel ?? 'Hora').trim() || 'Hora',
        periods: layoutMode === 'blocks' ? periods.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          durationMinutes: item.durationMinutes,
          gapAfterMinutes: item.gapAfterMinutes,
        })) : [],
        columns: layoutMode === 'custom' ? columns.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          width: item.width,
        })) : [],
        rows: layoutMode === 'custom' ? rows.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          height: item.height,
          gapAfterMinutes: item.gapAfterMinutes,
        })) : [],
      },
      blocks,
    },
  };
};

module.exports = { validateSchedule };
