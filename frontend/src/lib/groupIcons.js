import { BookOpen, Briefcase, CalendarDays, GraduationCap, Home, Music, Plane, Users } from 'lucide-react';

// Sello del grupo: un glifo de línea sobre el degradado del tema, en lugar de la inicial del nombre.
export const GROUP_ICONS = [
  { id: 'calendar', label: 'Calendario', Icon: CalendarDays },
  { id: 'equipo', label: 'Equipo', Icon: Users },
  { id: 'estudio', label: 'Estudio', Icon: BookOpen },
  { id: 'trabajo', label: 'Trabajo', Icon: Briefcase },
  { id: 'clase', label: 'Clase', Icon: GraduationCap },
  { id: 'familia', label: 'Familia', Icon: Home },
  { id: 'viaje', label: 'Viaje', Icon: Plane },
  { id: 'musica', label: 'Música', Icon: Music },
];

export const groupIcon = (id) => GROUP_ICONS.find((item) => item.id === id) || GROUP_ICONS[0];
