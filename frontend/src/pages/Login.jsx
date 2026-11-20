import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { user, login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Si venía de un enlace de invitación, volver ahí después de entrar
  const from = location.state?.from || '/dashboard';

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, navigate, from]);
  useEffect(() => () => setError(''), [setError]);

  return (
    <AuthShell>
      <h2 className="font-display text-4xl font-extrabold">Entrá a tu grupo</h2>
      <p className="mb-8 mt-2 text-muted">Usá tu usuario y tu contraseña.</p>
      <AuthForm submitLabel="Entrar" onSubmit={login} error={error} loading={loading} />
      <p className="mt-6 text-center text-muted">
        ¿No tenés cuenta?{' '}
        <Link to="/register" state={location.state} className="font-bold text-accent-text underline-offset-4 hover:underline">Registrate</Link>
      </p>
    </AuthShell>
  );
};

export default Login;
