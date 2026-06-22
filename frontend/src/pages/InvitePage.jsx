import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import api from '../services/api';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const { data } = await api.get(`/invites/validate/${token}`);
        setInviteData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invitación no válida');
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/invite/${token}` } });
      return;
    }
    try {
      setJoining(true);
      const { data } = await api.post(`/invites/join/${token}`, {});
      navigate(`/group/${data.group._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse al grupo');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ThemeToggle />
        <p className="text-xl text-slate-700 dark:text-slate-300">Verificando invitación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ThemeToggle />
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h1 className="mb-2 text-2xl font-bold text-rose-600">Invitación no válida</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 rounded-xl bg-brand-600 px-6 py-2 text-white hover:bg-brand-700">
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle />
      <div className="max-w-md w-full text-center">
        <div className="mb-4 text-6xl">📅</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          Invitación a <span className="text-brand-600">{inviteData?.group?.name}</span>
        </h1>
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          {user ? 'Haz clic en "Unirse" para formar parte del grupo' : 'Inicia sesión para unirte al grupo'}
        </p>
        <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-sm dark:bg-slate-800 text-left space-y-1">
          <p className="text-slate-700 dark:text-slate-300">👤 Creado por: <strong>{inviteData?.createdBy?.username}</strong></p>
          <p className="text-slate-700 dark:text-slate-300">
            🔁 Usos disponibles: <strong>{inviteData?.usesLeft ?? '—'} / {inviteData?.maxUses ?? '—'}</strong>
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            ⏱ Expira: <strong>{inviteData?.expiresAt ? new Date(inviteData.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Nunca'}</strong>
          </p>
        </div>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full rounded-xl bg-brand-600 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? 'Uniéndose...' : user ? '🚀 Unirse al grupo' : '🔑 Iniciar sesión'}
        </button>
      </div>
    </div>
  );
};

export default InvitePage;