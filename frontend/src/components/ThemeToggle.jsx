import AppearanceButton from './AppearanceModal';

// Botón flotante de apariencia para las pantallas sin encabezado (login, registro, invitación).
const ThemeToggle = () => (
  <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-40">
    <AppearanceButton />
  </div>
);

export default ThemeToggle;
