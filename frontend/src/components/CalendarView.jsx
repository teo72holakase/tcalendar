import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const getTextColor = (hex) => {
  if (!hex) return '#1e293b';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
};

const CalendarView = ({ events, onDateClick, onEventClick, onRangeChange, onEventMove, canManage }) => {
  const calendarEvents = useMemo(() => events.map((event) => {
    let startDate = event.dueDate;
    if (typeof startDate === 'string' && startDate.length === 10) {
      startDate = `${startDate}T12:00:00.000Z`;
    }
    const bg = event.color || '#A2CFFE';
    return {
      id: event._id,
      title: event.title,
      start: startDate,
      allDay: true,
      backgroundColor: bg,
      borderColor: bg,
      textColor: getTextColor(bg),
      editable: Boolean(canManage?.(event)), // solo se pueden arrastrar los eventos que el usuario puede modificar
      extendedProps: event,
    };
  }), [events, canManage]);

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800 sm:p-6">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
        events={calendarEvents}
        eventClick={(info) => onEventClick(info.event.extendedProps)}
        dateClick={(info) => onDateClick(info.dateStr)}
        datesSet={(info) => onRangeChange?.(info.start, info.end)}
        eventDrop={async (info) => {
          // Si el servidor rechaza el cambio, el evento vuelve a su día
          if (!(await onEventMove(info.event.extendedProps, info.event.startStr.slice(0, 10)))) info.revert();
        }}
        eventLongPressDelay={350} /* en celular, mantené presionado un evento para arrastrarlo */
        height="auto"
        timeZone="UTC"
        displayEventTime={false}
        fixedWeekCount={false}
        dayMaxEvents={3} /* con muchos eventos el día muestra "+N más" en vez de estirar la fila */
        moreLinkText={(n) => `+${n} más`}
      />
    </div>
  );
};

export default CalendarView;
