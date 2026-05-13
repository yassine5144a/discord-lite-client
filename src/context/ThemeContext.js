import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, setUser } = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem('dl_theme') || 'dark');
  const [accentColor, setAccentColorState] = useState(() => localStorage.getItem('dl_accent') || '#7c6af7');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dl_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply accent color as CSS variable
    document.documentElement.style.setProperty('--accent', accentColor);
    // Generate hover color (10% darker using opacity trick)
    document.documentElement.style.setProperty('--accent-hover', accentColor);
    document.documentElement.style.setProperty('--accent-glow', accentColor + '40');
    // Apply filter for hover effect via CSS
    document.documentElement.style.setProperty('--accent-filter', 'brightness(0.85)');
    localStorage.setItem('dl_accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (user?.theme && user.theme !== theme) setThemeState(user.theme);
    if (user?.accentColor && user.accentColor !== accentColor) setAccentColorState(user.accentColor);
  }, [user?.theme, user?.accentColor]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    try {
      const { data } = await api.patch('/api/users/me', { theme: newTheme });
      if (setUser) setUser(data);
    } catch (e) {}
  };

  const setAccentColor = async (color) => {
    setAccentColorState(color);
    try {
      const { data } = await api.patch('/api/users/me', { accentColor: color });
      if (setUser) setUser(data);
    } catch (e) {}
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
