import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('tcalendar_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const saveUser = (userData, token) => {
    localStorage.setItem('tcalendar_token', token);
    localStorage.setItem('tcalendar_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tcalendar_token');
    localStorage.removeItem('tcalendar_user');
    setUser(null);
  };

  const login = async (values) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await loginUser(values);
      saveUser(data.user, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (values) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await registerUser(values);
      saveUser(data.user, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
