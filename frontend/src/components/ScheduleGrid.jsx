import { formatMinute, WEEK_DAYS } from '../lib/schedulePresets';
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

const layoutOverlaps = (blocks) => {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  const clusters = [];

  sorted.forEach((block) => {
    const cluster = clusters[clusters.length - 1];
    if (!cluster || block.startMinute >= cluster.endMinute) {
      clusters.push({ endMinute: block.endMinute, blocks: [block] });
    } else {
      cluster.blocks.push(block);
      cluster.endMinute = Math.max(cluster.endMinute, block.endMinute);
    }
  });

  return clusters.flatMap(({ blocks: clusterBlocks }) => {
    const laneEnds = [];
    const placed = clusterBlocks.map((block) => {
      let lane = laneEnds.findIndex((endMinute) => endMinute <= block.startMinute);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = block.endMinute;
      return { block, lane };
    });
    return placed.map((item) => ({ ...item, laneCount: laneEnds.length }));
  });
};

const ScheduleGrid = ({ schedule, canEdit, onEditBlock, onAddBlock, gridRef }) => {
  const { isDark, skin } = useTheme();
  const { settings, blocks } = schedule;
  const days = WEEK_DAYS.filter((day) => settings.days.includes(day.value));
  const slotCount = Math.ceil((settings.endMinute - settings.startMinute) / settings.interval);
  const boardHeight = slotCount * settings.rowHeight;
  const slotMinutes = Array.from({ length: slotCount }, (_, index) => settings.startMinute + index * settings.interval);
  const surface = THEME_SURFACES[skin]?.[isDark ? 'dark' : 'light'] || [255, 255, 255];

  return (
    <div className="schedule-export">
      <div className="schedule-scroll">
        <div
          className="schedule-board"
          id="schedule-print"
          ref={gridRef}
          style={{
            gridTemplateColumns: `76px repeat(${days.length}, minmax(${settings.columnWidth}px, 1fr))`,
            '--schedule-column-width': `${settings.columnWidth}px`,
            '--schedule-row-height': `${settings.rowHeight}px`,
            '--schedule-days': days.length,
            '--schedule-slot-count': slotCount,
          }}
          data-schedule-slots={slotCount}
        >
          <h2 className="schedule-board-title">{schedule.title}</h2>
          <div className="schedule-corner">Hora</div>
          {days.map((day) => <div key={day.value} className="schedule-day-heading">{day.label}</div>)}

          <div className="schedule-time-axis" style={{ height: boardHeight }}>
            {slotMinutes.filter((minute, index) => (minute - settings.startMinute) % 60 === 0 || index === 0).map((minute) => (
              <span key={minute} className="schedule-time-tick" style={{ top: (minute - settings.startMinute) / settings.interval * settings.rowHeight }}>
                {formatMinute(minute)}
              </span>
            ))}
            <span className="schedule-time-tick schedule-time-end" style={{ top: boardHeight }}>{formatMinute(settings.endMinute)}</span>
          </div>

          {days.map((day) => (
            <div
              key={day.value}
              role="group"
              className={`schedule-day-column ${canEdit ? 'schedule-day-editable' : ''}`}
              style={{ height: boardHeight }}
              onClick={(event) => {
                if (!canEdit || event.target.closest('.schedule-block')) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const offset = Math.max(0, Math.min(boardHeight - 1, event.clientY - bounds.top));
                const slot = Math.floor(offset / settings.rowHeight);
                onAddBlock(day.value, slotMinutes[slot]);
              }}
              aria-label={day.label}
            >
              {layoutOverlaps(blocks.filter((block) => block.days.includes(day.value))).map(({ block, lane, laneCount }) => {
                const top = (block.startMinute - settings.startMinute) / settings.interval * settings.rowHeight;
                const height = Math.max(24, (block.endMinute - block.startMinute) / settings.interval * settings.rowHeight);
                const fill = block.tone === 'soft' ? 0.2 : block.tone === 'balanced' ? 0.38 : 0.58;
                const foreground = blockForeground(block.color, fill, surface);
                const description = block.description?.trim();
                return (
                  <button
                    key={block._id || `${block.title}-${day.value}`}
                    type="button"
                    className="schedule-block"
                    data-tone={block.tone}
                    data-overlap={laneCount > 1}
                    data-short={height < 48}
                    onClick={() => canEdit && onEditBlock(block)}
                    aria-label={`${block.title}${description ? `, ${description}` : ''}, ${day.label}, ${formatMinute(block.startMinute)} a ${formatMinute(block.endMinute)}${canEdit ? ', editar' : ''}`}
                    title={`${block.title}${description ? ` · ${description}` : ''} · ${formatMinute(block.startMinute)}–${formatMinute(block.endMinute)}${canEdit ? ' · Editar' : ''}`}
                    tabIndex={canEdit ? 0 : -1}
                    style={{
                      top,
                      height,
                      left: `calc(${lane * 100 / laneCount}% + 2px)`,
                      width: `calc(${100 / laneCount}% - 4px)`,
                      '--block-color': block.color,
                      '--block-fill': `${fill * 100}%`,
                      '--block-screen-ink': foreground.screen,
                      '--block-print-ink': foreground.print,
                    }}
                  >
                    <span className="schedule-block-title">{block.title}</span>
                    {description && <span className="schedule-block-description">{description}</span>}
                    <span className="schedule-block-time">{formatMinute(block.startMinute)}–{formatMinute(block.endMinute)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
