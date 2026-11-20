import { Link } from 'react-router-dom';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import AppearanceButton from './AppearanceModal';
import { AccountButton } from './AccountModal';

const Header = () => (
  <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/75 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
      <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="TCalendar, ir al inicio">
        <Logo size={34} />
        <span className="font-display text-xl font-extrabold tracking-tight">tcalendar</span>
      </Link>
      <div className="flex items-center gap-0.5">
        <NotificationBell />
        <AppearanceButton />
        <AccountButton />
      </div>
    </div>
  </header>
);

export default Header;
