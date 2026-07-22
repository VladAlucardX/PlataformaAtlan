"use client";

import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * LanguageToggle — Premium animated ES/EN toggle button.
 *
 * Props:
 *   - variant: 'pill' (default) | 'minimal' | 'icon'
 *   - className: extra CSS classes
 */
export default function LanguageToggle({ variant = 'pill', className = '' }) {
  const { lang, setLang } = useTranslation();

  const toggle = () => setLang(lang === 'es' ? 'en' : 'es');

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        className={className}
        title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        aria-label="Toggle language"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          background: 'var(--atlan-glass)',
          border: '1px solid var(--atlan-glass-border)',
          borderRadius: 'var(--atlan-radius-full)',
          color: 'var(--atlan-text-primary)',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'all var(--atlan-transition-normal)',
          backdropFilter: 'blur(8px)',
        }}
      >
        🌐
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggle}
        className={`btn-ghost ${className}`}
        aria-label="Toggle language"
        style={{ fontSize: '13px', gap: '4px' }}
      >
        🌐 {lang === 'es' ? 'EN' : 'ES'}
      </button>
    );
  }

  // Default: pill variant
  return (
    <button
      onClick={toggle}
      className={className}
      aria-label="Toggle language"
      id="language-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 6px 6px 14px',
        background: 'var(--atlan-glass)',
        border: '1px solid var(--atlan-glass-border)',
        borderRadius: 'var(--atlan-radius-full)',
        color: 'var(--atlan-text-primary)',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all var(--atlan-transition-normal)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
      }}
    >
      <span style={{ fontSize: '15px' }}>🌐</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '28px',
          borderRadius: 'var(--atlan-radius-full)',
          background: 'var(--atlan-gold)',
          color: '#1A1A2E',
          fontWeight: '800',
          fontSize: '11px',
          letterSpacing: '0.05em',
          transition: 'all var(--atlan-transition-normal)',
        }}
      >
        {lang.toUpperCase()}
      </span>
    </button>
  );
}
