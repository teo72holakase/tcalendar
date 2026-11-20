import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { user, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Si venía de un enlace de invitación, volver ahí después de entrar
  const from = location.state?.from || '/dashboard';

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, navigate, from]);
  useEffect(() => () => setError(''), [setError]);

  return (
    <AuthShell>
      <h2 className="font-display text-4xl font-extrabold">Creá tu cuenta</h2>
      <p className="mb-8 mt-2 text-muted">Un usuario y una contraseña, sin email.</p>
      <AuthForm submitLabel="Crear cuenta" onSubmit={register} error={error} loading={loading} isRegister />
      <p className="mt-6 text-center text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" state={location.state} className="font-bold text-accent-text underline-offset-4 hover:underline">Iniciá sesión</Link>
      </p>
    </AuthShell>
  );
};

export default Register;
