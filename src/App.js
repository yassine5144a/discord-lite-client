import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Toast';
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

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={
          <PrivateRoute>
            <SocketProvider>
              <Home />
            </SocketProvider>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <InstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <LangProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </LangProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  );
}
