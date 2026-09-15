import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { user } = useAuth();

  // Helper to construct isolated per-user storage key
  const getLanguageStorageKey = (u) => {
    return u?.id ? `qpgen_language_${u.id}` : 'qpgen_language_guest';
  };

  const [language, setLanguageState] = useState(() => {
    const key = getLanguageStorageKey(user);
    return localStorage.getItem(key) || 'en';
  });

  // Automatically switch language to active user's preference when account changes
  useEffect(() => {
    const key = getLanguageStorageKey(user);
    const savedLang = localStorage.getItem(key) || 'en';
    setLanguageState(savedLang);
  }, [user?.id]);

  const setLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguageState(lang);
      const key = getLanguageStorageKey(user);
      localStorage.setItem(key, lang);
    }
  };

  const t = (key, fallbackText = '', params = {}) => {
    const langDict = translations[language] || translations['en'];
    let text = langDict[key] || translations['en'][key] || fallbackText || key;

    // Replace dynamic placeholders like {{name}}
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
