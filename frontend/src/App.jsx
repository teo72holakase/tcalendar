import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GroupProvider } from './contexts/GroupContext';
import AnimatedBackground from './components/AnimatedBackground';
import Favicon from './components/Favicon'; // ← IMPORTAR
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import InvitePage from './pages/InvitePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  const { isAnimatedBg, isDark } = useTheme();

  return (
    <div
      className="min-h-screen text-slate-900 dark:text-white"
      style={{ background: isAnimatedBg ? 'transparent' : undefined }}
    >
      {/* ✅ AGREGAR FAVICON AQUÍ (se renderiza en todas las páginas) */}
      <Favicon />
      
      {isAnimatedBg && <AnimatedBackground darkMode={isDark} />}
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group/:groupId"
            element={
              <ProtectedRoute>
                <GroupPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GroupProvider>
          <AppShell />
        </GroupProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;