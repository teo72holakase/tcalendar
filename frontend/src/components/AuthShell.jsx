import Logo from './Logo';
import AppearanceButton from './AppearanceModal';

// Ejemplo ilustrativo de la agenda (no son datos reales)
const SAMPLE = [
  { t: 'Entrega del informe', chip: 'En 2 días', c: '#FF8A75', strong: false },
  { t: 'Reunión de equipo', chip: 'Mañana', c: '#7FD1A5', strong: true },
  { t: 'Presentación final', chip: 'En 6 días', c: '#6FB7FF', strong: false },
];

// Pantalla de acceso: a la izquierda, qué es la app (solo en pantallas grandes); a la derecha, el formulario.
const AuthShell = ({ children }) => (
  <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
    <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40"><AppearanceButton /></div>
    <aside className="hidden flex-col justify-between p-12 lg:flex">
      <div className="flex items-center gap-2.5">
        <Logo size={38} />
        <span className="font-display text-2xl font-extrabold tracking-tight">tcalendar</span>
      </div>
      <div className="max-w-xl">
        <h1 className="font-display text-6xl font-extrabold leading-[1.02]">Cada entrega, a la vista de todo el grupo.</h1>
        <p className="mt-5 max-w-md text-lg text-muted">Creá un grupo, invitá a tu gente y mirá qué se viene: hoy, mañana y esta semana.</p>
        <ul aria-hidden="true" className="card mt-10 max-w-md space-y-1 p-3 shadow-xl">
          {SAMPLE.map((s) => (
            <li key={s.t} className="flex items-center gap-3 rounded-2xl p-3">
              <span className="h-9 w-1.5 rounded-full" style={{ background: s.c }} />
              <span className="flex-1 font-semibold">{s.t}</span>
              <span className={`chip ${s.strong ? 'chip-strong' : ''}`}>{s.chip}</span>
            </li>
          ))}
        </ul>
      </div>
      <span />
    </aside>
    <main className="flex items-center justify-center px-4 py-14 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Logo size={40} />
          <span className="font-display text-2xl font-extrabold tracking-tight">tcalendar</span>
        </div>
        {children}
      </div>
    </main>
  </div>
);

export default AuthShell;
