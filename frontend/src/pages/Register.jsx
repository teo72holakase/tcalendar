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
        <AuthForm title="Registro" submitLabel="Crear cuenta" onSubmit={handleRegister} error={error} loading={loading} fields={['username', 'password']} />
        <p className="mt-4 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
