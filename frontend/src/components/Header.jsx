import { Link, NavLink } from 'react-router-dom';
import { Clock3, UsersRound } from 'lucide-react';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import AppearanceButton from './AppearanceModal';
import { AccountButton } from './AccountModal';

const Header = () => (
  <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/75 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-5">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="TCalendar, ir a grupos">
          <Logo size={34} />
          <span className="hidden font-display text-xl font-extrabold tracking-tight sm:inline">tcalendar</span>
        </Link>
        <nav aria-label="Secciones principales" className="flex shrink-0 items-center gap-1">
          <NavLink
            to="/dashboard"
            aria-label="Grupos"
            className={({ isActive }) => `flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors sm:px-3 ${isActive ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}
          >
            <UsersRound size={17} aria-hidden="true" /><span className="hidden sm:inline">Grupos</span>
          </NavLink>
          <NavLink
            to="/schedules"
            aria-label="Horarios"
            className={({ isActive }) => `flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors sm:px-3 ${isActive ? 'bg-accent-soft text-accent-text' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}
          >
            <Clock3 size={17} aria-hidden="true" /><span className="hidden sm:inline">Horarios</span>
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-0.5">
        <NotificationBell />
        <AppearanceButton />
        <AccountButton />
      </div>
    </div>
  </header>
);

export default Header;
