import React, { createContext, useContext, useState, ReactNode } from "react";
import { useEffect } from "react";
import { translations, Language, TranslationKey } from "@/i18n/translations";
 
 export type { TranslationKey };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load from localStorage or default to Bangla
    const saved = localStorage.getItem("app_language");
    return (saved as Language) || "bn";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  useEffect(() => {
    // Update document lang attribute
    document.documentElement.lang = language === "bn" ? "bn-BD" : "en";
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};