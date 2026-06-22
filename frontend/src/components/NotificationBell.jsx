import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from 'lucide-react';
import { fetchUpcomingEvents } from '../services/api';

const getDaysLeft = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
};

const getStyle = (days) => {
  if (days < -1) return null; // más de 1 día pasado — no mostrar
  if (days === -1) return { bg: 'bg-slate-400 dark:bg-slate-600', text: 'text-white', label: 'Ayer', past: true };
  if (days === 0)  return { bg: 'bg-red-400',    text: 'text-white', label: 'Hoy',   past: false };
  if (days === 1)  return { bg: 'bg-orange-400', text: 'text-white', label: 'Mañana', past: false };
  if (days === 2)  return { bg: 'bg-yellow-400', text: 'text-slate-900', label: 'En 2 días', past: false };
  if (days === 3)  return { bg: 'bg-green-400',  text: 'text-white', label: 'En 3 días', past: false };
  return null;
};

const SEEN_KEY = 'tcalendar_seen_events';

const getSeenIds = () => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); }
  catch { return []; }
};

const markAsSeen = (ids) => {
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchUpcomingEvents();
        // Filtrar: solo mostrar hasta 1 día pasado, y máximo 10 eventos
        const filtered = data
          .filter(e => getDaysLeft(e.dueDate) >= -1)
          .slice(0, 10);
        setEvents(filtered);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cerrar al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const seenIds = getSeenIds();
  const unseenCount = events.filter(e => {
    const days = getDaysLeft(e.dueDate);
    return days >= 0 && !seenIds.includes(e._id);
  }).length;

  const handleOpen = () => {
    setOpen(v => !v);
    // Marcar todos los actuales como vistos
    const ids = [...new Set([...seenIds, ...events.map(e => e._id)])];
    markAsSeen(ids);
  };

  const handleGoToGroup = (groupId) => {
    navigate(`/group/${groupId}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* BOTÓN CAMPANA */}
      <button
        onClick={handleOpen}
        className="relative rounded-2xl border border-slate-300 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        title="Notificaciones"
      >
        <Bell size={20} />
        {unseenCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {/* PANEL */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Próximos eventos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tus eventos de los próximos 3 días</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
            ) : events.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                🎉 Sin eventos próximos
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {events.map((event) => {
                  const days = getDaysLeft(event.dueDate);
                  const style = getStyle(days);
                  if (!style) return null;

                  return (
                    <li
                      key={event._id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${style.past ? 'opacity-50' : ''}`}
                    >
                      {/* COLOR BADGE */}
                      <div className={`flex-shrink-0 rounded-xl px-2 py-1 text-center ${style.bg} ${style.text}`} style={{ minWidth: '60px' }}>
                        <p className="text-[10px] font-bold leading-tight">{style.label}</p>
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold text-slate-900 dark:text-white ${style.past ? 'line-through' : ''}`}>
                          {event.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {event.group?.name || 'Grupo'}
                        </p>
                      </div>

                      {/* SHORTCUT */}
                      <button
                        onClick={() => handleGoToGroup(event.group?._id)}
                        className="flex-shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-400"
                        title="Ir al grupo"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {events.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700">
              <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                Mostrando hasta 10 eventos · Pasados se ocultan tras 1 día
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;