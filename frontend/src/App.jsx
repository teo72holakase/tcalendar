import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GroupProvider } from './contexts/GroupContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GroupProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
        </GroupProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
