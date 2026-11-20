import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Field from './Field';

const AuthForm = ({ submitLabel, onSubmit, error, loading, isRegister = false }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = form.username.trim();
    if (!username || !form.password) return setLocalError('Usuario y contraseña son requeridos');
    if (isRegister && form.password.length < 6) return setLocalError('La contraseña debe tener al menos 6 caracteres');
    setLocalError('');
    onSubmit({ username, password: form.password });
  };

  const message = localError || error;

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field
        label="Usuario" name="username" value={form.username} placeholder="ej. miguel123"
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" maxLength={20} required
      />
      <div>
        <label htmlFor="password" className="field-label">Contraseña</label>
        <div className="relative">
          <input
            id="password" name="password" className="field pr-14" type={show ? 'text' : 'password'} value={form.password} maxLength={64} required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete={isRegister ? 'new-password' : 'current-password'} enterKeyHint="done"
            aria-describedby={isRegister ? 'password-help' : undefined}
          />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={show} className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink">
            {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        </div>
        {isRegister && <p id="password-help" className="field-hint">Mínimo 6 caracteres. No hay recuperación por email: si la olvidás, quien administra la app puede restablecerla.</p>}
      </div>
      {message && <div role="alert" className="rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{message}</div>}
      <button type="submit" disabled={loading} className="btn btn-primary h-14 w-full text-lg">{loading ? 'Entrando…' : submitLabel}</button>
    </form>
  );
};

export default AuthForm;
