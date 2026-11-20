import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const SKINS = [
  { id: 'oceano', preview: ['#F2F8F7', '#0F766E', '#9FE3D8'], name: 'Océano' },
  { id: 'coral', preview: ['#FBF5F2', '#C2391C', '#FFC8B5'], name: 'Coral' },
  { id: 'bosque', preview: ['#F4F7F1', '#2F7A1F', '#C5E8A8'], name: 'Bosque' },
  { id: 'cobalto', preview: ['#F3F6FD', '#2450E0', '#B5C9FF'], name: 'Cobalto' },
  { id: 'miel', preview: ['#FBF7EE', '#A85A00', '#FFE29A'], name: 'Miel' },
  { id: 'grafito', preview: ['#F4F4F2', '#1F1F1F', '#E2E2DC'], name: 'Grafito' },
];

export const THEME_SURFACES = {
  oceano: { light: [255, 255, 255], dark: [16, 29, 28] },
  coral: { light: [255, 255, 255], dark: [33, 20, 16] },
  bosque: { light: [255, 255, 255], dark: [19, 29, 17] },
  cobalto: { light: [255, 255, 255], dark: [15, 23, 48] },
  miel: { light: [255, 255, 255], dark: [29, 22, 10] },
  grafito: { light: [255, 255, 255], dark: [23, 23, 23] },
};

const MODE_KEY = 'tcalendar_theme'; // 'light' | 'dark' | 'system'
const SKIN_KEY = 'tcalendar_skin';
const BG_KEY = 'tcalendar_bg'; // 'gradient' | 'aurora' | 'plain'
const DARK_QUERY = '(prefers-color-scheme: dark)';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => (['light', 'dark'].includes(read(MODE_KEY)) ? read(MODE_KEY) : 'system'));
  const [skin, setSkinState] = useState(() => (SKINS.some((s) => s.id === read(SKIN_KEY)) ? read(SKIN_KEY) : 'oceano'));
  const [bg, setBgState] = useState(() => (['gradient', 'aurora', 'plain'].includes(read(BG_KEY)) ? read(BG_KEY) : 'gradient'));
  const [systemDark, setSystemDark] = useState(() => matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const mq = matchMedia(DARK_QUERY);
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.dataset.skin = skin;
    // El color de la barra del navegador sigue al fondo del tema elegido
    const [r, g, b] = getComputedStyle(root).getPropertyValue('--bg').trim().split(/\s+/).map(Number);
    if (!Number.isNaN(r)) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${r}, ${g}, ${b})`);
  }, [isDark, skin]);

  const value = useMemo(() => ({
    mode, skin, bg, isDark,
    setMode: (m) => { setModeState(m); write(MODE_KEY, m); },
    setSkin: (s) => { setSkinState(s); write(SKIN_KEY, s); },
    setBg: (b) => { setBgState(b); write(BG_KEY, b); },
  }), [mode, skin, bg, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
