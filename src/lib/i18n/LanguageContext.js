"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import es from './es.json';
import en from './en.json';

const translations = { es, en };

export const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

/**
 * LanguageProvider — Wraps the app to provide i18n context.
 *
 * Usage:
 *   <LanguageProvider>
 *     <App />
 *   </LanguageProvider>
 *
 * Then inside any component:
 *   const { t, lang, setLang } = useTranslation();
 *   <h1>{t('landing.hero.title')}</h1>
 */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('es');

  // Load persisted language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('atlan-lang');
      if (saved && translations[saved]) {
        setLangState(saved);
      }
    } catch {
      // localStorage might not be available (SSR)
    }
  }, []);

  // Persist language changes
  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      try {
        localStorage.setItem('atlan-lang', newLang);
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  /**
   * t('landing.hero.title') → resolves nested keys like "Descubre Nicaragua."
   * t('reviews.timeAgo.minutesAgo', { n: 5 }) → "hace 5 minutos"
   */
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[lang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found — return the key itself as fallback
        console.warn(`[i18n] Missing key: "${key}" for lang "${lang}"`);
        return key;
      }
    }

    // Replace interpolation tokens like {n}
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramVal]) => str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal),
        value
      );
    }

    return value;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
