import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventRow from './EventRow';
import { DEFAULT_EVENT_COLOR, addDays, dayNum, fmt, textOn, todayNum, ymd } from '../lib/ui';

const WEEK_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEK_LONG = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

const MonthView = ({ events, onRange, onOpen, onAdd }) => {
  const [cursor, setCursor] = useState(() => { const t = new Date(todayNum()); return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1); });
  const [selected, setSelected] = useState(() => ymd(todayNum()));

  const { gridStart, cells } = useMemo(() => {
    const d = new Date(cursor);
    const offset = (d.getUTCDay() + 6) % 7; // semana desde el lunes
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    return { gridStart: addDays(cursor, -offset), cells: Math.ceil((offset + daysInMonth) / 7) * 7 };
  }, [cursor]);

  // Pide solo los eventos del mes visible (con los días de relleno de las semanas vecinas)
  useEffect(() => {
    onRange(new Date(gridStart).toISOString(), new Date(addDays(gridStart, cells)).toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart, cells]);

  const byDay = useMemo(() => {
    const map = {};
    for (const e of events) (map[ymd(dayNum(e.dueDate))] ||= []).push(e);
    return map;
  }, [events]);

  const move = (n) => { const d = new Date(cursor); setCursor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)); };
  const goToday = () => { const t = new Date(todayNum()); setCursor(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)); setSelected(ymd(todayNum())); };
  const month = new Date(cursor).getUTCMonth();
  const today = ymd(todayNum());
  const dayEvents = byDay[selected] || [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="mr-auto font-display text-2xl font-bold capitalize sm:text-3xl" aria-live="polite">{fmt(cursor, { month: 'long', year: 'numeric' })}</h2>
        <button type="button" onClick={goToday} className="btn btn-quiet btn-sm">Hoy</button>
        <button type="button" onClick={() => move(-1)} aria-label="Mes anterior" className="btn btn-quiet btn-sm w-10 px-0"><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" onClick={() => move(1)} aria-label="Mes siguiente" className="btn btn-quiet btn-sm w-10 px-0"><ChevronRight size={20} aria-hidden="true" /></button>
      </div>

      <div className="card p-2 sm:p-3">
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold text-muted" aria-hidden="true">
          {WEEK_SHORT.map((d, i) => <span key={d + i} className="py-2"><span className="sm:hidden">{d}</span><span className="hidden uppercase sm:inline">{WEEK_LONG[i]}</span></span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: cells }, (_, i) => {
            const ms = addDays(gridStart, i);
            const key = ymd(ms);
            const list = byDay[key] || [];
            const isToday = key === today;
            const isSel = key === selected;
            const inMonth = new Date(ms).getUTCMonth() === month;
            return (
              <button
                key={key} type="button" onClick={() => setSelected(key)} aria-pressed={isSel}
                aria-label={`${fmt(ms, { weekday: 'long', day: 'numeric', month: 'long' })}, ${list.length} ${list.length === 1 ? 'evento' : 'eventos'}`}
                className={`flex aspect-square flex-col items-start rounded-xl p-1 text-left transition sm:aspect-auto sm:min-h-[5.75rem] sm:p-1.5 ${isSel ? 'bg-accent-soft ring-2 ring-accent' : 'hover:bg-surface-2'} ${inMonth ? '' : 'opacity-40'}`}
              >
                <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 font-display text-sm font-bold ${isToday ? 'bg-accent text-accent-ink' : ''}`}>{new Date(ms).getUTCDate()}</span>
                <span className="mt-1 flex flex-wrap gap-1 px-0.5 sm:hidden" aria-hidden="true">
                  {list.slice(0, 3).map((e) => <span key={e._id} className="h-2 w-2 rounded-full" style={{ background: e.color || DEFAULT_EVENT_COLOR }} />)}
                </span>
                <span className="mt-1 hidden w-full space-y-1 sm:block" aria-hidden="true">
                  {list.slice(0, 2).map((e) => {
                    const c = e.color || DEFAULT_EVENT_COLOR;
                    return <span key={e._id} className="block truncate rounded-md px-1.5 py-0.5 text-xs font-semibold" style={{ background: c, color: textOn(c) }}>{e.title}</span>;
                  })}
                  {list.length > 2 && <span className="block px-1 text-xs font-semibold text-muted">+{list.length - 2} más</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6" aria-label="Eventos del día seleccionado">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-bold capitalize">{fmt(Date.parse(selected), { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <button type="button" onClick={() => onAdd(selected)} className="btn btn-primary btn-sm"><Plus size={16} aria-hidden="true" /> Agregar</button>
        </div>
        {dayEvents.length === 0 ? <p className="rounded-2xl bg-surface-2 p-5 text-center text-muted">Sin eventos este día.</p> : <ol className="space-y-3">{dayEvents.map((e) => <EventRow key={e._id} event={e} onOpen={onOpen} />)}</ol>}
      </section>
    </div>
  );
};

export default MonthView;
