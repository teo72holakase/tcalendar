import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Check, LogOut } from 'lucide-react';
import Modal from './Modal';
import Field from './Field';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { AVATARS, AVATAR_LABELS, avatarSrc } from '../lib/profile';
import { changePassword, adminResetPassword } from '../services/api';
import { disablePush, enablePush, getPushStatus } from '../services/push';

const Notice = ({ notice }) =>
  notice && (
    <p role={notice.ok ? 'status' : 'alert'} className={`mt-3 rounded-2xl p-3.5 text-sm font-medium ${notice.ok ? 'bg-accent-soft text-accent-text' : 'bg-danger-soft text-danger'}`}>{notice.text}</p>
  );

const Section = ({ title, hint, children }) => (
  <section className="border-t border-line pt-5 first:border-0 first:pt-0">
    <h3 className="text-lg font-bold">{title}</h3>
    {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
    {children}
  </section>
);

const AccountModal = ({ open, onClose }) => {
  const { user, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [avatarNotice, setAvatarNotice] = useState(null);
  const [pwNotice, setPwNotice] = useState(null);
  const [reset, setReset] = useState({ username: '', password: '' });
  const [resetNotice, setResetNotice] = useState(null);
  const [push, setPush] = useState('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPw({ currentPassword: '', newPassword: '' });
    setReset({ username: '', password: '' });
    setAvatarNotice(null);
    setPwNotice(null);
    setResetNotice(null);
    getPushStatus().then(setPush).catch(() => setPush('unsupported'));
  }, [open]);

  const chooseAvatar = async (id) => {
    if (id === user?.avatar) return;
    setAvatarNotice(null);
    if (!(await updateAvatar(id))) setAvatarNotice({ ok: false, text: 'No se pudo guardar la foto. Probá de nuevo.' });
  };

  const submit = (request, setNotice, clear) => async (e) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const { data } = await request();
      setNotice({ ok: true, text: data.message });
      clear();
    } catch (err) {
      setNotice({ ok: false, text: err.response?.data?.message || 'No se pudo completar la acción' });
    } finally {
      setBusy(false);
    }
  };

  const togglePush = async () => {
    setBusy(true);
    try { if (push === 'on') await disablePush(); else await enablePush(); } catch { /* se relee el estado real abajo */ }
    setPush(await getPushStatus());
    setBusy(false);
  };

  const pushText = {
    unsupported: 'Tu navegador no admite notificaciones. En iPhone hay que instalar la app (Compartir → Añadir a pantalla de inicio).',
    unavailable: 'El servidor todavía no tiene los recordatorios configurados.',
    denied: 'Bloqueaste las notificaciones en este navegador. Activalas desde los ajustes del sitio.',
  }[push];

  return (
    <Modal open={open} onClose={onClose} title="Mi cuenta" titleId="account-title">
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
          <Avatar name={user?.username || '?'} avatar={user?.avatar} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{user?.username}</p>
            {user?.isAdmin && <span className="chip chip-accent">Administrador</span>}
          </div>
          <button type="button" onClick={() => { logout(); navigate('/login'); }} className="btn btn-quiet btn-sm"><LogOut size={16} aria-hidden="true" /> Salir</button>
        </div>

        <Section title="Foto de perfil" hint="Elegí la que te represente. La ven los miembros de tus grupos.">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {AVATARS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseAvatar(id)}
                aria-pressed={user?.avatar === id}
                aria-label={`Foto de perfil: ${AVATAR_LABELS[id]}`}
                className={`relative aspect-square overflow-hidden rounded-2xl border-[1.5px] transition ${user?.avatar === id ? 'border-accent ring-4 ring-accent/20' : 'border-line hover:border-muted/50'}`}
              >
                <img src={avatarSrc(id)} alt="" loading="lazy" className="h-full w-full object-cover" />
                {user?.avatar === id && <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink"><Check size={13} aria-hidden="true" /></span>}
              </button>
            ))}
          </div>
          <Notice notice={avatarNotice} />
        </Section>

        <Section title="Cambiar contraseña">
          <form className="space-y-3.5" onSubmit={submit(() => changePassword(pw), setPwNotice, () => setPw({ currentPassword: '', newPassword: '' }))}>
            <Field label="Contraseña actual" type="password" autoComplete="current-password" maxLength={64} required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <Field label="Contraseña nueva" type="password" autoComplete="new-password" maxLength={64} required hint="Entre 6 y 64 caracteres." value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <button disabled={busy || !pw.currentPassword || pw.newPassword.length < 6} className="btn btn-primary">Guardar contraseña</button>
          </form>
          <Notice notice={pwNotice} />
        </Section>

        <Section title="Recordatorios" hint="Te avisamos el día antes de cada evento de tus grupos.">
          {pushText ? <p className="text-sm text-muted">{pushText}</p> : (
            <button type="button" onClick={togglePush} disabled={busy || push === 'loading'} className="btn btn-quiet">
              {push === 'on' ? <BellOff size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
              {push === 'on' ? 'Desactivar en este dispositivo' : 'Activar en este dispositivo'}
            </button>
          )}
        </Section>

        {user?.isAdmin && (
          <Section title="Administración" hint="Restablecer la contraseña de un usuario que la olvidó.">
            <form className="space-y-3.5" onSubmit={submit(() => adminResetPassword(reset), setResetNotice, () => setReset({ username: '', password: '' }))}>
              <Field label="Usuario" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={reset.username} onChange={(e) => setReset({ ...reset, username: e.target.value })} />
              <Field label="Contraseña nueva" type="password" autoComplete="new-password" maxLength={64} required value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
              <button disabled={busy || !reset.username.trim() || reset.password.length < 6} className="btn btn-primary">Restablecer contraseña</button>
            </form>
            <Notice notice={resetNotice} />
          </Section>
        )}
      </div>
    </Modal>
  );
};

export const AccountButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Mi cuenta" title="Mi cuenta" className="ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2">
        <Avatar name={user?.username || '?'} avatar={user?.avatar} size={34} />
      </button>
      <AccountModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AccountModal;
