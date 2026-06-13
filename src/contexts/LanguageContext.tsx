import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (idText: string | ReactNode, enText: string | ReactNode) => ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Check local storage for saved language or default to 'id'
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language') as Language;
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {}
  };

  const t = (idText: string | ReactNode, enText: string | ReactNode) => {
    return language === 'id' ? idText : enText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
