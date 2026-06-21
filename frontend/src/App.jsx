import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GroupProvider } from './contexts/GroupContext';
import AnimatedBackground from './components/AnimatedBackground';
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
    <>
      {isAnimatedBg
        ? <AnimatedBackground />
        : <div className={`fixed inset-0 -z-10 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} />
      }
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/group/:groupId" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
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