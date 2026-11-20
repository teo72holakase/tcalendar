import { Avatar } from './Avatar';
import { DEFAULT_EVENT_COLOR, dayNum, daysUntil, fmt, relative, relClass } from '../lib/ui';

// Una fila de la agenda: fecha grande, título, quién lo creó y cuánto falta.
// "line" añade el punto de color sobre la línea de tiempo de la agenda.
const EventRow = ({ event, onOpen, line = false }) => {
  const n = daysUntil(event.dueDate);
  const ms = dayNum(event.dueDate);
  const color = event.color || DEFAULT_EVENT_COLOR;
  return (
    <li className="relative">
      {line && <span aria-hidden="true" className="absolute -left-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full ring-4 ring-bg" style={{ background: color }} />}
      <button type="button" onClick={() => onOpen(event)} className={`card card-lift flex w-full items-center gap-4 p-4 text-left ${n < 0 ? 'opacity-70' : ''}`}>
        <span className="w-12 shrink-0 text-center" aria-hidden="true">
          <span className="block text-xs font-bold uppercase tracking-wide text-muted">{fmt(ms, { weekday: 'short' }).replace('.', '')}</span>
          <span className="block font-display text-3xl font-extrabold leading-none">{new Date(ms).getUTCDate()}</span>
        </span>
        <span aria-hidden="true" className="h-12 w-1 shrink-0 rounded-full" style={{ background: color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold">{event.title}</span>
          {event.topics && <span className="block truncate text-sm text-muted">{event.topics}</span>}
          <span className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <Avatar name={event.createdBy?.username || '?'} size={20} /> {event.createdBy?.username || 'Usuario'}
          </span>
        </span>
        <span className={`chip ${relClass(n)} shrink-0`}>{relative(n)}</span>
      </button>
    </li>
  );
};

export default EventRow;
