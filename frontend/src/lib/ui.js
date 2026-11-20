// Ayudantes de presentación: avatares, colores de evento y fechas.
// Las fechas de los eventos se guardan a las 12:00 UTC; todo se calcula en UTC para que no se corran de día.
const DAY = 86400000;

export const initials = (name = '') => {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
};

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Fondos claros con texto oscuro fijo: contraste alto en cualquier tema.
const AVATAR_COLORS = ['#F4A58A', '#F2CF72', '#8AD1B8', '#8EC5FC', '#F2A7B8', '#B5D99C', '#9FD3E8', '#F0B88A'];
export const avatarColor = (name) => AVATAR_COLORS[hash(name) % AVATAR_COLORS.length];
export const hashIndex = (s, n) => hash(s) % n;

export const EVENT_COLORS = [
  { hex: '#FF8A75', name: 'Coral' },
  { hex: '#FFC247', name: 'Miel' },
  { hex: '#7FD1A5', name: 'Menta' },
  { hex: '#6FB7FF', name: 'Cielo' },
  { hex: '#F59DC0', name: 'Rosa' },
  { hex: '#B7D86A', name: 'Lima' },
  { hex: '#5CC9D6', name: 'Turquesa' },
  { hex: '#C9C3B8', name: 'Piedra' },
];
export const DEFAULT_EVENT_COLOR = '#6FB7FF';

export const textOn = (hex = DEFAULT_EVENT_COLOR) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a1a' : '#ffffff';
};

export const todayNum = () => { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); };
export const dayNum = (iso) => { const d = new Date(iso); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
export const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);
export const noon = (ymdStr) => `${ymdStr}T12:00:00.000Z`;
export const daysUntil = (iso) => Math.round((dayNum(iso) - todayNum()) / DAY);
export const addDays = (ms, n) => ms + n * DAY;
export const fmt = (ms, opts) => new Date(ms).toLocaleDateString('es', { timeZone: 'UTC', ...opts });

export const relative = (n) => {
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  return n > 1 ? `En ${n} días` : `Hace ${-n} días`;
};
export const relClass = (n) => (n === 0 ? 'chip-strong' : n === 1 ? 'chip-accent' : n < 0 ? 'chip' : 'chip');
