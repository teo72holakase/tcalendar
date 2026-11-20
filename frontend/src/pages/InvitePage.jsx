import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../contexts/AuthContext';
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
    api.get(`/invites/validate/${token}`)
      .then(({ data }) => setInviteData(data))
      .catch((err) => setError(err.response?.data?.message || 'Invitación no válida'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!user) return navigate('/login', { state: { from: `/invite/${token}` } });
    try {
      setJoining(true);
      const { data } = await api.post(`/invites/join/${token}`, {});
      navigate(`/group/${data.group._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse al grupo');
      setJoining(false);
    }
  };

  return (
    <AuthShell>
      {loading ? (
        <p role="status" className="text-lg text-muted">Verificando invitación…</p>
      ) : error ? (
        <div role="alert">
          <h2 className="font-display text-4xl font-extrabold">Invitación no válida</h2>
          <p className="mb-8 mt-2 text-muted">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full">Ir al inicio</button>
        </div>
      ) : (
        <div>
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text"><Users size={26} aria-hidden="true" /></span>
          <p className="text-muted">Te invitaron a unirte a</p>
          <h2 className="font-display text-4xl font-extrabold">{inviteData?.group?.name}</h2>
          {inviteData?.group?.description && <p className="mt-2 text-muted">{inviteData.group.description}</p>}
          <button onClick={handleJoin} disabled={joining} className="btn btn-primary mt-8 h-14 w-full text-lg">
            {joining ? 'Uniéndote…' : user ? 'Unirme al grupo' : 'Iniciar sesión para unirme'}
          </button>
          {!user && (
            <p className="mt-5 text-center text-muted">
              ¿Todavía no tenés cuenta?{' '}
              <Link to="/register" state={{ from: `/invite/${token}` }} className="font-bold text-accent-text underline-offset-4 hover:underline">Registrate</Link>
            </p>
          )}
        </div>
      )}
    </AuthShell>
  );
};

export default InvitePage;
