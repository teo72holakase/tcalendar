import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import EventRow from './EventRow';
import { dayNum, daysUntil, fmt, todayNum } from '../lib/ui';

const bucketOf = (n, ms) => (n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n <= 7 ? 'Próximos 7 días' : fmt(ms, { month: 'long', year: 'numeric' }));

// Agenda: una línea de tiempo con el marcador de "Hoy". Lo que ya pasó queda plegado arriba; lo que viene, agrupado.
const AgendaView = ({ events, onOpen, onAdd, loading, highlightedEventId }) => {
  const [showPast, setShowPast] = useState(false);
  const { past, groups } = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const groups = [];
    for (const e of sorted.filter((x) => daysUntil(x.dueDate) >= 0)) {
      const label = bucketOf(daysUntil(e.dueDate), dayNum(e.dueDate));
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(e);
      else groups.push({ label, items: [e] });
    }
    return { past: sorted.filter((x) => daysUntil(x.dueDate) < 0), groups };
  }, [events]);

  useEffect(() => {
    if (highlightedEventId && past.some((event) => String(event._id) === String(highlightedEventId))) setShowPast(true);
  }, [highlightedEventId, past]);

  if (loading && events.length === 0) {
    return <div aria-busy="true" className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>;
  }

  const hasToday = groups[0]?.label === 'Hoy';

  return (
    <div>
      {past.length > 0 && (
        <div className="mb-5">
          <button type="button" onClick={() => setShowPast((v) => !v)} aria-expanded={showPast} className="btn btn-quiet btn-sm">
            {showPast ? 'Ocultar anteriores' : `Ver anteriores (${past.length})`}
          </button>
          {showPast && <ol className="mt-3 space-y-3">{past.map((e) => <EventRow key={e._id} event={e} onOpen={onOpen} highlighted={String(e._id) === String(highlightedEventId)} />)}</ol>}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-accent ring-4 ring-accent/25" />
        <h2 className="font-display text-xl font-bold">Hoy · <span className="capitalize">{fmt(todayNum(), { weekday: 'long', day: 'numeric', month: 'long' })}</span></h2>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      {groups.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text"><CalendarPlus size={26} aria-hidden="true" /></span>
          <p className="text-xl font-bold">No hay nada por venir</p>
          <p className="max-w-sm text-muted">Cuando alguien del grupo cree un evento, va a aparecer acá con cuánto falta.</p>
          <button type="button" onClick={onAdd} className="btn btn-primary mt-2">Crear un evento</button>
        </div>
      ) : (
        <div className="space-y-7">
          {!hasToday && <p className="ml-2 border-l-2 border-line pl-6 text-muted">Nada para hoy.</p>}
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h3 className="mb-3 ml-2 pl-6 text-sm font-bold uppercase tracking-wide text-muted">{g.label}</h3>
              <ol className="relative ml-2 space-y-3 border-l-2 border-line pl-6">
                {g.items.map((e) => <EventRow key={e._id} event={e} onOpen={onOpen} line highlighted={String(e._id) === String(highlightedEventId)} />)}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaView;
