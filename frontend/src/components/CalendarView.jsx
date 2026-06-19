import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const CalendarView = ({ events, onDateClick, onEventClick }) => {
  const calendarEvents = events.map((event) => ({
    id: event._id,
    title: event.title,
    start: event.dueDate,
    end: event.dueDate,
    extendedProps: event,
  }));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
        events={calendarEvents}
        eventClick={(info) => onEventClick(info.event.extendedProps)}
        dateClick={(info) => onDateClick(info.dateStr)}
        height="auto"
      />
    </div>
  );
};

export default CalendarView;
