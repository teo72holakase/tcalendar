// Genera un archivo .ics (RFC 5545) con eventos de día completo, importable en Google Calendar, Apple Calendar, Outlook, etc.
const esc = (s = '') =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Las líneas no pueden pasar de 75 bytes: se parten con CRLF + espacio.
const fold = (line) => {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 75) {
      out.push(cur);
      cur = ' ' + ch;
      bytes = 1 + b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  out.push(cur);
  return out.join('\r\n');
};

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const buildIcs = (events, calendarName, now = new Date()) => {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TCalendar//ES', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(calendarName)}`];
  for (const e of events) {
    const start = new Date(e.dueDate); // guardado a las 12:00 UTC: su fecha UTC es el día elegido
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const description = [e.topics && `Temas: ${e.topics}`, e.description].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e._id}@tcalendar`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${ymd(start)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(description ? [`DESCRIPTION:${esc(description)}`] : []),
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
};

module.exports = { buildIcs };
