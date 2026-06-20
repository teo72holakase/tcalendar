import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('tcalendar_theme');
    return saved ? saved === 'dark' : false;
  });

  const [isAnimatedBg, setIsAnimatedBg] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('tcalendar_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(v => !v);
  const toggleBg    = () => setIsAnimatedBg(v => !v);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isAnimatedBg, toggleBg }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);