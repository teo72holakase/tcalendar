import { useState } from 'react';
import { Blend, Check, Monitor, Moon, Palette, Sparkles, Square, Sun } from 'lucide-react';
import Modal from './Modal';
import { SKINS, useTheme } from '../contexts/ThemeContext';

const Segment = ({ name, value, current, onChange, icon: Icon, children }) => (
  <label className="cursor-pointer">
    <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="peer sr-only" />
    <span className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface px-3 text-sm font-semibold transition hover:border-muted/50 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent">
      <Icon size={17} aria-hidden="true" /> {children}
    </span>
  </label>
);

export const AppearanceModal = ({ open, onClose }) => {
  const { mode, setMode, skin, setSkin, bg, setBg, isDark } = useTheme();
  return (
    <Modal open={open} onClose={onClose} title="Apariencia" subtitle="Se guarda en este dispositivo." titleId="appearance-title" size="max-w-lg">
      <div className="space-y-6">
        <fieldset>
          <legend className="field-label">Tema de color</legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {SKINS.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input type="radio" name="skin" value={s.id} checked={skin === s.id} onChange={() => setSkin(s.id)} className="peer sr-only" />
                <span className="block rounded-2xl border-[1.5px] border-line p-2 transition hover:border-muted/50 peer-checked:border-accent peer-checked:ring-4 peer-checked:ring-accent/20 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-accent">
                  <span aria-hidden="true" className="flex h-12 overflow-hidden rounded-xl">
                    <span className="flex-1" style={{ background: s.preview[0] }} />
                    <span className="flex-1" style={{ background: s.preview[2] }} />
                    <span className="w-1/3" style={{ background: s.preview[1] }} />
                  </span>
                  <span className="mt-2 flex items-center justify-between px-1 text-sm font-semibold">
                    {s.name} {skin === s.id && <Check size={16} className="text-accent-text" aria-hidden="true" />}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">Modo</legend>
          <div className="grid grid-cols-3 gap-2">
            <Segment name="mode" value="light" current={mode} onChange={setMode} icon={Sun}>Claro</Segment>
            <Segment name="mode" value="dark" current={mode} onChange={setMode} icon={Moon}>Oscuro</Segment>
            <Segment name="mode" value="system" current={mode} onChange={setMode} icon={Monitor}>Sistema</Segment>
          </div>
          {mode === 'system' && <p className="field-hint">Sigue a tu dispositivo (ahora: {isDark ? 'oscuro' : 'claro'}).</p>}
        </fieldset>

        <fieldset>
          <legend className="field-label">Fondo</legend>
          <div className="grid grid-cols-3 gap-2">
            <Segment name="bg" value="gradient" current={bg} onChange={setBg} icon={Blend}>Degradado</Segment>
            <Segment name="bg" value="aurora" current={bg} onChange={setBg} icon={Sparkles}>Aurora</Segment>
            <Segment name="bg" value="plain" current={bg} onChange={setBg} icon={Square}>Liso</Segment>
          </div>
          <p className="field-hint">Aurora se mueve despacio y gasta más batería; se detiene si tu dispositivo pide menos movimiento.</p>
        </fieldset>
      </div>
    </Modal>
  );
};

const AppearanceButton = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Apariencia" title="Apariencia" className={`flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-2 ${className}`}>
        <Palette size={21} aria-hidden="true" />
      </button>
      <AppearanceModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AppearanceButton;
