"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import es from './es.json';
import en from './en.json';
import zh from './zh.json';

const translations = { es, en, zh };

export const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
  tr: (es, en, zh) => es,
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

    const resolve = (obj) => {
      let current = obj;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return undefined;
        }
      }
      return current;
    };

    let value = resolve(translations[lang]);
    if (value === undefined && lang !== 'en') {
      value = resolve(translations['en']);
    }
    if (value === undefined && lang !== 'es') {
      value = resolve(translations['es']);
    }

    if (value === undefined) {
      console.warn(`[i18n] Missing key: "${key}" for lang "${lang}"`);
      return key;
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

  /**
   * tr('Texto en Español', 'English Text', '中文文本')
   * Ergonomic inline helper for 3-language titles, headers, and UI strings.
   */
  const tr = useCallback((esText, enText, zhText) => {
    if (lang === 'zh') {
      return zhText !== undefined ? zhText : (enText !== undefined ? enText : esText);
    }
    if (lang === 'en') {
      return enText !== undefined ? enText : esText;
    }
    return esText;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}
