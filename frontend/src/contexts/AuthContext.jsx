import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, updateAvatar as updateAvatarRequest } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tcalendar_user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('tcalendar_user'); // dato corrupto: empezar de cero en vez de dejar la pantalla en blanco
    }
    setInitialized(true); // listo — ahora sí sabemos si hay sesión o no
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

  const updateAvatar = async (avatar) => {
    try {
      const { data } = await updateAvatarRequest(avatar);
      const next = { ...user, avatar: data.avatar };
      localStorage.setItem('tcalendar_user', JSON.stringify(next));
      setUser(next);
      return true;
    } catch {
      setError('No se pudo guardar la foto de perfil');
      return false;
    }
  };

  const login = async (values) => {
    setLoading(true); setError('');
    try {
      const { data } = await loginUser(values);
      saveUser(data.user, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || (err.response ? 'Error al iniciar sesión' : 'No se pudo conectar con el servidor. Probá de nuevo en un momento.'));
      return false;
    } finally { setLoading(false); }
  };

  const register = async (values) => {
    setLoading(true); setError('');
    try {
      const { data } = await registerUser(values);
      saveUser(data.user, data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || (err.response ? 'Error al registrar usuario' : 'No se pudo conectar con el servidor. Probá de nuevo en un momento.'));
      return false;
    } finally { setLoading(false); }
  };

  return (
    <AuthContext.Provider value={{ user, initialized, loading, error, login, register, logout, updateAvatar, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);