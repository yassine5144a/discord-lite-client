import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Auth from './pages/Auth';
import Home from './pages/Home';
import InstallPrompt from './components/InstallPrompt';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: 18, background: 'var(--bg-primary)', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32 }}>⚡</div>
      <div>Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={
        <PrivateRoute>
          <SocketProvider>
            <ThemeProvider>
              <Home />
            </ThemeProvider>
          </SocketProvider>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
        <InstallPrompt />
      </AuthProvider>
    </HashRouter>
  );
}
