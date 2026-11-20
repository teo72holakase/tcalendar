import { formatMinute, getPeriodRows, WEEK_DAYS } from '../lib/schedulePresets';
import { THEME_SURFACES, useTheme } from '../contexts/ThemeContext';

const luminance = (channels) => channels.map((channel) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);

const contrast = (first, second) => {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

const blockForeground = (hex, fill, surface) => {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16));
  const background = channels.map((channel, index) => channel * fill + surface[index] * (1 - fill));
  const dark = [23, 33, 31];
  const light = [255, 255, 255];
  return {
    screen: contrast(background, dark) >= contrast(background, light) ? '#17211f' : '#ffffff',
    print: contrast(channels.map((channel) => channel * fill + 255 * (1 - fill)), dark)
      >= contrast(channels.map((channel) => channel * fill + 255 * (1 - fill)), light) ? '#17211f' : '#ffffff',
  };
};

const layoutOverlaps = (blocks, getRange) => {
  const sorted = blocks.map((block) => ({ block, range: getRange(block) }))
    .filter(({ range }) => range)
    .sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end);
  const clusters = [];

  sorted.forEach((item) => {
    const cluster = clusters[clusters.length - 1];
    if (!cluster || item.range.start >= cluster.end) {
      clusters.push({ end: item.range.end, blocks: [item] });
    } else {
      cluster.blocks.push(item);
      cluster.end = Math.max(cluster.end, item.range.end);
    }
  });

  return clusters.flatMap(({ blocks: clusterBlocks }) => {
    const laneEnds = [];
    const placed = clusterBlocks.map(({ block, range }) => {
      let lane = laneEnds.findIndex((end) => end <= range.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = range.end;
      return { block, range, lane };
    });
    return placed.map((item) => ({ ...item, laneCount: laneEnds.length }));
  });
};

const ScheduleGrid = ({ schedule, canEdit, onEditBlock, onAddBlock, gridRef }) => {
  const { isDark, skin } = useTheme();
  const { settings, blocks } = schedule;
  const mode = settings.layoutMode || 'interval';
  const columns = mode === 'custom'
    ? settings.columns.map((item) => ({ id: item.id, label: item.label, width: item.width }))
    : WEEK_DAYS.filter((day) => settings.days.includes(day.value)).map((day) => ({
      id: String(day.value),
      label: day.label,
      width: settings.columnWidth,
      day: day.value,
    }));

  let rows;
  if (mode === 'blocks') {
    rows = getPeriodRows(settings).map((period) => ({
      ...period,
      label: period.label,
      detail: `${formatMinute(period.startMinute)}–${formatMinute(period.endMinute)}`,
      gapAfterMinutes: Number(period.gapAfterMinutes || 0),
    }));
  } else if (mode === 'custom') {
    let top = 0;
    rows = settings.rows.map((row) => {
      const current = { ...row, top, height: row.height, detail: '' };
      top += row.height;
      return current;
    });
  } else {
    const slotCount = Math.ceil((settings.endMinute - settings.startMinute) / settings.interval);
    rows = Array.from({ length: slotCount }, (_, index) => ({
      id: `slot-${index}`,
      index,
      startMinute: settings.startMinute + index * settings.interval,
      endMinute: Math.min(settings.endMinute, settings.startMinute + (index + 1) * settings.interval),
      top: index * settings.rowHeight,
      height: settings.rowHeight,
      gapAfterMinutes: 0,
    }));
  }

  const boardHeight = rows.reduce((height, row) => Math.max(height, row.top + row.height), 0);
  const slotCount = rows.length;
  const columnTracks = columns.map((column) => `minmax(${column.width}px, 1fr)`).join(' ');
  const gridTemplateColumns = `76px ${columnTracks}`;
  const surface = THEME_SURFACES[skin]?.[isDark ? 'dark' : 'light'] || [255, 255, 255];
  const regularTicks = mode === 'interval'
    ? rows.filter((row, index) => (row.startMinute - settings.startMinute) % 60 === 0 || index === 0)
    : [];
  const placeBlock = (block) => {
    if (mode === 'interval') {
      if (block.startMinute == null || block.endMinute == null) return null;
      const scale = settings.rowHeight / settings.interval;
      const top = (block.startMinute - settings.startMinute) * scale;
      const height = (block.endMinute - block.startMinute) * scale;
      return { top, height, start: block.startMinute, end: block.endMinute };
    }
    if (mode === 'blocks') {
      const row = rows.find((item) => item.id === block.rowId)
        || rows.find((item) => item.startMinute === block.startMinute && item.endMinute === block.endMinute);
      return row ? { top: row.top, height: row.height, start: row.index, end: row.index + 1, row } : null;
    }
    const rowIndex = rows.findIndex((item) => item.id === block.rowId);
    const row = rows[rowIndex];
    return row ? { top: row.top, height: row.height, start: rowIndex, end: rowIndex + 1, row } : null;
  };

  return (
    <div className="schedule-export">
      <div className="schedule-scroll">
        <div
          className="schedule-board"
          id="schedule-print"
          ref={gridRef}
          data-layout-mode={mode}
          data-schedule-slots={slotCount}
          data-schedule-days={columns.length}
          data-schedule-board-height={boardHeight}
          style={{
            gridTemplateColumns,
            '--schedule-column-width': `${settings.columnWidth}px`,
            '--schedule-row-height': `${settings.rowHeight}px`,
            '--schedule-days': columns.length,
            '--schedule-slot-count': slotCount,
          }}
        >
          <h2 className="schedule-board-title">{schedule.title}</h2>
          <div className="schedule-corner">{settings.cornerLabel || 'Hora'}</div>
          {columns.map((column) => <div key={column.id} className="schedule-day-heading">{column.label}</div>)}

          <div className="schedule-time-axis" style={{ height: boardHeight }}>
            {mode === 'interval' && regularTicks.map((row) => (
              <span key={row.id} className="schedule-time-tick" style={{ top: row.top }}>
                {formatMinute(row.startMinute)}
              </span>
            ))}
            {mode === 'interval' && <span className="schedule-time-tick schedule-time-end" style={{ top: boardHeight }}>{formatMinute(settings.endMinute)}</span>}
            {mode !== 'interval' && rows.map((row, index) => (
              <div key={row.id} className="schedule-row-reference" style={{ top: row.top, height: row.height }}>
                <span className="schedule-row-reference-title">{row.label}</span>
                {row.detail && <span className="schedule-row-reference-detail">{row.detail}</span>}
                {row.gapAfterMinutes > 0 && index < rows.length - 1 && (
                  <span className="schedule-gap-marker" style={{ top: row.height }} aria-label={`${row.gapAfterMinutes} minutos de pausa`}><b>+</b> {row.gapAfterMinutes} min</span>
                )}
              </div>
            ))}
          </div>

          {columns.map((column) => {
            const columnBlocks = blocks.filter((block) => (
              mode === 'custom'
                ? block.columnId === column.id
                : block.days.includes(column.day)
            ));
            const placedBlocks = layoutOverlaps(columnBlocks, placeBlock);
            return (
              <div
                key={column.id}
                role="group"
                className={`schedule-day-column ${canEdit ? 'schedule-day-editable' : ''}`}
                style={{ height: boardHeight, '--schedule-column-width': `${column.width}px` }}
                onClick={(event) => {
                  if (!canEdit || event.target.closest('.schedule-block')) return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const offset = Math.max(0, Math.min(boardHeight, event.clientY - bounds.top));
                  if (mode === 'interval') {
                    const rowIndex = Math.min(rows.length - 1, Math.floor(offset / settings.rowHeight));
                    onAddBlock(column.day, rows[rowIndex]?.startMinute);
                  } else {
                    const row = rows.find((item) => offset >= item.top && offset < item.top + item.height);
                    if (row) onAddBlock(mode === 'custom' ? null : column.day, row.startMinute, row.id, mode === 'custom' ? column.id : '');
                  }
                }}
                aria-label={column.label}
              >
                {mode !== 'interval' && rows.slice(0, -1).map((row) => (
                  <span key={`${row.id}-rule`} className="schedule-grid-rule" style={{ top: row.top + row.height }} />
                ))}
                {placedBlocks.map(({ block, range, lane, laneCount }) => {
                  const fill = block.tone === 'soft' ? 0.2 : block.tone === 'balanced' ? 0.38 : 0.58;
                  const foreground = blockForeground(block.color, fill, surface);
                  const description = block.description?.trim();
                  const rowLabel = range.row?.label;
                  const timeLabel = mode === 'custom'
                    ? `${column.label}, ${rowLabel}`
                    : mode === 'blocks'
                      ? `${column.label}, ${rowLabel}, ${formatMinute(range.row.startMinute)} a ${formatMinute(range.row.endMinute)}`
                      : `${column.label}, ${formatMinute(block.startMinute)} a ${formatMinute(block.endMinute)}`;
                  return (
                    <button
                      key={block._id || `${block.title}-${column.id}-${block.rowId || block.startMinute}`}
                      type="button"
                      className="schedule-block"
                      data-layout-mode={mode}
                      data-tone={block.tone}
                      data-overlap={laneCount > 1}
                      data-short={range.height < (mode === 'interval' ? settings.rowHeight * 1.5 : 48)}
                      onClick={() => canEdit && onEditBlock(block)}
                      aria-label={`${block.title}${description ? `, ${description}` : ''}, ${timeLabel}${canEdit ? ', editar' : ''}`}
                      title={`${block.title}${description ? ` · ${description}` : ''} · ${timeLabel}${canEdit ? ' · Editar' : ''}`}
                      tabIndex={canEdit ? 0 : -1}
                      style={{
                        top: range.top,
                        height: range.height,
                        left: `calc(${lane * 100 / laneCount}% + 2px)`,
                        width: `calc(${100 / laneCount}% - 4px)`,
                        '--block-color': block.color,
                        '--block-fill': `${fill * 100}%`,
                        '--block-screen-ink': foreground.screen,
                        '--block-print-ink': foreground.print,
                        '--block-row-height': `${settings.rowHeight}px`,
                      }}
                    >
                      <span className="schedule-block-title">{block.title}</span>
                      {description && <span className="schedule-block-description">{description}</span>}
                      {mode === 'interval' && <span className="schedule-block-time">{formatMinute(block.startMinute)}–{formatMinute(block.endMinute)}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
