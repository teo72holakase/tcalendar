import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex flex-col gap-4 bg-white px-6 py-5 shadow-sm dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-500">TCALENDAR</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-2xl border border-slate-300 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title={isDark ? 'Tema claro' : 'Tema oscuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Conectado como</p>
            <p className="font-medium text-slate-900 dark:text-white">{user?.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <LogOut size={16} /> Salir
        </button>
      </div>
    </header>
  );
};

export default Header;
