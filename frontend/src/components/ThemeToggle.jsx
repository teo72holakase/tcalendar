import { Moon, Sun, Sparkles, Square } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme, isAnimatedBg, toggleBg } = useTheme();

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <button
        onClick={toggleBg}
        className="rounded-2xl border border-slate-300 bg-white/80 p-2 text-slate-700 backdrop-blur-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
        title={isAnimatedBg ? 'Fondo simple' : 'Fondo animado'}
      >
        {isAnimatedBg ? <Square size={18} /> : <Sparkles size={18} />}
      </button>
      <button
        onClick={toggleTheme}
        className="rounded-2xl border border-slate-300 bg-white/80 p-2 text-slate-700 backdrop-blur-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
        title={isDark ? 'Tema claro' : 'Tema oscuro'}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
};

export default ThemeToggle;