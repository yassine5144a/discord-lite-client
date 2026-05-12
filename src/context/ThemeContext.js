import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, setUser } = useAuth();
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('dl_theme') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dl_theme', theme);
  }, [theme]);

  // Sync with user preference from server
  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setThemeState(user.theme);
    }
  }, [user?.theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    // Save to server
    try {
      const { data } = await axios.patch('/api/users/me', { theme: newTheme });
      if (setUser) setUser(data);
    } catch (e) { /* ignore */ }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
