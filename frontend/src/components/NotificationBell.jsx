import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Modal from './Modal';
import { fetchUpcomingEvents } from '../services/api';
import { daysUntil, relative, relClass } from '../lib/ui';

const SEEN_KEY = 'tcalendar_seen_events';
const getSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [seen, setSeen] = useState(getSeen);

  useEffect(() => {
    fetchUpcomingEvents()
      .then(({ data }) => setEvents(data.filter((e) => daysUntil(e.dueDate) >= -1).slice(0, 10)))
      .catch(() => {});
  }, []);

  const unseen = events.filter((e) => daysUntil(e.dueDate) >= 0 && !seen.includes(e._id)).length;

  const openPanel = () => {
    setOpen(true);
    const ids = [...new Set([...seen, ...events.map((e) => e._id)])];
    setSeen(ids);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)); } catch { /* sin almacenamiento */ }
  };

  return (
    <>
      <button type="button" onClick={openPanel} aria-label={unseen ? `Avisos, ${unseen} nuevos` : 'Avisos'} title="Avisos" className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-2">
        <Bell size={21} aria-hidden="true" />
        {unseen > 0 && <span aria-hidden="true" className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink ring-2 ring-bg">{unseen}</span>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Lo que se viene" subtitle="Eventos de todos tus grupos." titleId="bell-title">
        {events.length === 0 ? (
          <p className="rounded-2xl bg-surface-2 p-5 text-center text-muted">No hay eventos en los próximos días.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => {
              const n = daysUntil(e.dueDate);
              return (
                <li key={e._id}>
                  <button type="button" onClick={() => { setOpen(false); navigate(`/group/${e.group?._id}`); }} className="card card-lift flex w-full items-center gap-3 p-3.5 text-left">
                    <span aria-hidden="true" className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: e.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{e.title}</span>
                      <span className="block truncate text-sm text-muted">{e.group?.name || 'Grupo'}</span>
                    </span>
                    <span className={`chip ${relClass(n)} shrink-0`}>{relative(n)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
};

export default NotificationBell;
