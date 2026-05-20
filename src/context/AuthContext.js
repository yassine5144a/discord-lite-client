import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { subscribeToPush } from '../serviceWorkerRegistration';

// Register FCM token from Android WebView bridge
async function registerFCMToken() {
  try {
    if (!window.AndroidFCM) return;

    // Retry up to 5 times waiting for token to be ready
    let fcmToken = '';
    for (let i = 0; i < 5; i++) {
      fcmToken = window.AndroidFCM.getFcmToken();
      if (fcmToken) break;
      await new Promise(r => setTimeout(r, 2000)); // wait 2s
    }

    if (!fcmToken) return;
    const dlToken = localStorage.getItem('dl_token');
    if (!dlToken) return;
    const serverUrl = process.env.REACT_APP_SERVER_URL || '';
    await fetch(`${serverUrl}/api/fcm/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dlToken}`
      },
      body: JSON.stringify({ token: fcmToken })
    });
    console.log('✅ FCM token registered:', fcmToken.slice(0, 20) + '...');
  } catch (err) {
    console.error('FCM token registration failed:', err);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('dl_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchMe();
    else setLoading(false);
  }, [token]);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
      // Subscribe to push if not already subscribed
      setTimeout(() => { subscribeToPush(); registerFCMToken(); }, 2000);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('dl_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setTimeout(() => { subscribeToPush(); registerFCMToken(); }, 1000);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password });
    localStorage.setItem('dl_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setTimeout(() => { subscribeToPush(); registerFCMToken(); }, 1000);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('dl_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
