import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { user, register, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    return () => setError('');
  }, [setError]);

  const handleRegister = async (values) => {
    const success = await register(values);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8"> {/* ← CONTENEDOR PARA CENTRAR EL TÍTULO */}
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Registro
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Crea tu cuenta para empezar a usar TCalendar
          </p>
        </div>
        <AuthForm 
          title="Registro" 
          submitLabel="Crear cuenta" 
          onSubmit={handleRegister} 
          error={error} 
          loading={loading} 
          fields={['username', 'password']} 
        />
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;