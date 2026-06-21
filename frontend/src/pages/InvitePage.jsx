import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ← QUITAR authToken de aquí
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/invites/validate/${token}`
        );
        setInviteData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Invitación no válida');
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
      setLoading(true);
      
      // ✅ OBTENER TOKEN DIRECTAMENTE DE LOCALSTORAGE
      const authToken = localStorage.getItem('tcalendar_token');
      console.log('🔑 Token enviado al unirse:', authToken);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/invites/join/${token}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      navigate(`/group/${response.data.group._id}`);
    } catch (err) {
      console.error('❌ Error al unirse:', err.response?.data);
      setError(err.response?.data?.message || 'Error al unirse al grupo');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Verificando invitación...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h1 className="mb-2 text-2xl font-bold text-red-600">Invitación no válida</h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-xl bg-brand-600 px-6 py-2 text-white hover:bg-brand-700"
          >
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">📅</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          Invitación a {inviteData?.group?.name}
        </h1>
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          {user ? (
            `Haz clic en "Unirse" para formar parte del grupo`
          ) : (
            `Inicia sesión para unirte al grupo`
          )}
        </p>
        <div className="rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
          <p>👤 Creado por: {inviteData?.createdBy?.username}</p>
        </div>
        <button
          onClick={handleJoin}
          className="mt-6 w-full rounded-xl bg-brand-600 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-700"
        >
          {user ? '🚀 Unirse al grupo' : '🔑 Iniciar sesión'}
        </button>
      </div>
    </div>
  );
};

export default InvitePage;