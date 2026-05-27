"use client";

import { useContext } from 'react';
import { LanguageContext } from '../lib/i18n/LanguageContext';

/**
 * useTranslation — Hook for accessing i18n in any component.
 *
 * Returns:
 *   - t(key, params?)  → Translated string
 *   - lang             → Current language ('es' | 'en')
 *   - setLang(lang)    → Change language and persist to localStorage
 *
 * Example:
 *   const { t, lang, setLang } = useTranslation();
 *   <h1>{t('landing.hero.title')}</h1>
 *   <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>🌐</button>
 */
export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a <LanguageProvider>');
  }

  return context;
}
