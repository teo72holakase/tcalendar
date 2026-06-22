import { LogOut, Moon, Sun, Sparkles, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LOGO_BASE64 } from '../logo';
import NotificationBell from './NotificationBell';

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, isAnimatedBg, toggleBg } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="relative z-10 flex flex-col gap-4 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <img src={LOGO_BASE64} alt="TCalendar logo" className="h-10 w-10 object-contain" />
        <div>
          <p className="text-lg font-black uppercase tracking-widest text-brand-600 dark:text-brand-400"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", letterSpacing: '0.18em' }}>
            TCALENDAR
          </p>
          <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <button onClick={toggleBg} className="rounded-2xl border border-slate-300 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title={isAnimatedBg ? 'Fondo simple' : 'Fondo animado'}>
          {isAnimatedBg ? <Square size={20} /> : <Sparkles size={20} />}
        </button>
        <button onClick={toggleTheme} className="rounded-2xl border border-slate-300 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title={isDark ? 'Tema claro' : 'Tema oscuro'}>
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-600 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Conectado como</p>
          <p className="font-medium text-slate-900 dark:text-white">{user?.username}</p>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </header>
  );
};

export default Header;