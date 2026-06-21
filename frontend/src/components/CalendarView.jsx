import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const CalendarView = ({ events, onDateClick, onEventClick }) => {
  const calendarEvents = events.map((event) => {
    // ✅ FORZAR FECHA SIN ZONA HORARIA
    let startDate = event.dueDate;
    
    // Si la fecha es string, asegurar que sea ISO con mediodía
    if (typeof startDate === 'string' && startDate.length === 10) {
      startDate = `${startDate}T12:00:00.000Z`;
    }
    
    return {
      id: event._id,
      title: event.title,
      start: startDate,
      // ✅ FORZAR ALLDAY
      allDay: true,
      extendedProps: event,
    };
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
        events={calendarEvents}
        eventClick={(info) => onEventClick(info.event.extendedProps)}
        dateClick={(info) => onDateClick(info.dateStr)}
        height="auto"
        // ✅ CONFIGURACIONES PARA IGNORAR ZONA HORARIA
        timeZone="UTC"
        displayEventTime={false}
        allDayText="Todo el día"
      />
    </div>
  );
};

export default CalendarView;