"use client";

import { useContext } from 'react';
import { LanguageContext } from '../lib/i18n/LanguageContext';

/**
 * useTranslation — Hook for accessing i18n in any component.
 *
 * Returns:
 *   - t(key, params?)    → Translated string by JSON key
 *   - tr(es, en, zh)     → Direct 3-language inline translator
 *   - lang               → Current language ('es' | 'en' | 'zh')
 *   - setLang(lang)      → Change language and persist to localStorage
 *
 * Example:
 *   const { t, tr, lang } = useTranslation();
 *   <h1>{tr('Destinos', 'Destinations', '目的地')}</h1>
 *   <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')}>🌐</button>
 */
export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a <LanguageProvider>');
  }

  return context;
}
