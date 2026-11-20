import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';

// Pantalla única mientras llegan los grupos: ni cabecera ni tarjetas a medias.
// La cuenta queda visible para saber quién está activa y poder salir si no es la esperada.
const LoadingScreen = ({ error, onRetry }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 text-center" role={error ? 'alert' : 'status'} aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Logo size={44} />
        <span className="load-ring" aria-hidden="true" />
        <div>
          <p className="font-display text-xl font-bold">Tus grupos</p>
          <p className="mt-1 text-sm text-muted">{error || 'Cargando tus grupos'}</p>
        </div>
        {error && <button type="button" onClick={onRetry} className="btn btn-quiet btn-sm">Reintentar</button>}
      </div>
      {user && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left">
          <Avatar name={user.username} avatar={user.avatar} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.username}</p>
            <p className="text-xs text-muted">Cuenta activa</p>
          </div>
          <button type="button" onClick={signOut} className="btn btn-quiet btn-sm" aria-label="Salir de esta cuenta">
            <LogOut size={16} aria-hidden="true" /> Salir
          </button>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
