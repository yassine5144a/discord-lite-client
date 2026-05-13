import React, { createContext, useContext, useState, useEffect } from 'react';
import { t, LANGUAGES } from '../i18n';
import api from '../api';
import { useAuth } from './AuthContext';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const { user, setUser } = useAuth();
  const [lang, setLangState] = useState(() => localStorage.getItem('dl_lang') || 'en');

  useEffect(() => {
    const langObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', langObj.dir);
    localStorage.setItem('dl_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (user?.language && user.language !== lang) setLangState(user.language);
  }, [user?.language]);

  const setLang = async (newLang) => {
    setLangState(newLang);
    try {
      const { data } = await api.patch('/api/users/me', { language: newLang });
      if (setUser) setUser(data);
    } catch (e) {}
  };

  const translate = (key) => t(key, lang);

  return (
    <LangContext.Provider value={{ lang, setLang, t: translate, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
