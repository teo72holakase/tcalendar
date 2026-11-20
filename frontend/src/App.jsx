import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GroupProvider, useGroup } from './contexts/GroupContext';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import InvitePage from './pages/InvitePage';

const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));

function ProtectedRoute({ children }) {
  const { user, initialized } = useAuth();
  const { groupsLoaded, error, loadGroups } = useGroup();
  if (!initialized) return null; // esperar a leer el localStorage antes de decidir
  if (!user) return <Navigate to="/login" replace />;
  // Una sola pantalla de carga para cualquier ruta privada: nunca se ve una página a medias.
  if (!groupsLoaded) return <LoadingScreen error={error} onRetry={() => loadGroups()} />;
  return children;
}

function AppShell() {
  const { bg } = useTheme();
  return (
    <>
      <div className="bg-layer" data-bg={bg} aria-hidden="true">{bg === 'aurora' && <><i /><i /><i /></>}</div>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/group/:groupId" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
        <Route path="/schedules" element={<ProtectedRoute><Suspense fallback={<div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-muted"><span className="load-ring" aria-hidden="true" /> Cargando horarios</div>}><SchedulesPage /></Suspense></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
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
