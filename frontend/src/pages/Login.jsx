import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { LOGO_BASE64 } from '../logo';

const Login = () => {
  const { user, login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  useEffect(() => { return () => setError(''); }, [setError]);

  const handleLogin = async (values) => {
    const success = await login(values);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <ThemeToggle />
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <img src={LOGO_BASE64} alt="TCalendar" className="mx-auto mb-4 h-14 w-14 object-contain" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Iniciar sesión</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Ingresa tus credenciales para acceder a tu cuenta</p>
        </div>
        <AuthForm title="Iniciar sesión" submitLabel="Entrar" onSubmit={handleLogin} error={error} loading={loading} fields={['username', 'password']} />
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿No tienes cuenta?{' '}<Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;