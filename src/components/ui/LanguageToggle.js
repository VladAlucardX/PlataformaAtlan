"use client";

import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * LanguageToggle — Premium animated ES/EN toggle button with remolino.svg.
 *
 * Props:
 *   - variant: 'pill' (default) | 'minimal' | 'icon'
 *   - className: extra CSS classes
 */
export default function LanguageToggle({ variant = 'pill', className = '' }) {
  const { lang, setLang } = useTranslation();

  const toggle = () => {
    const nextLang = lang === 'es' ? 'en' : lang === 'en' ? 'zh' : 'es';
    setLang(nextLang);
  };

  const getFlagBadge = () => {
    if (lang === 'es') return '🇳🇮 ES';
    if (lang === 'en') return '🇬🇧 EN';
    return '🇨🇳 ZH';
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        className={className}
        title={lang === 'es' ? 'Cambiar idioma' : lang === 'en' ? 'Change language' : '切换语言'}
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
        <img src="/images/remolino.svg" alt="Language" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggle}
        className={`btn-ghost ${className}`}
        aria-label="Toggle language"
        style={{ fontSize: '13px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
      >
        <img src="/images/remolino.svg" alt="Language" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
        <span>{getFlagBadge()}</span>
      </button>
    );
  }

  // Default: pill variant (matching .nav-pill-link proportions)
  return (
    <button
      onClick={toggle}
      className={className}
      title={lang === 'es' ? 'Cambiar idioma' : lang === 'en' ? 'Change language' : '切换语言'}
      aria-label="Toggle language"
      id="language-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 5px 3px 9px',
        height: '34px',
        background: '#FFFFFF',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        borderRadius: 'var(--atlan-radius-full)',
        color: 'var(--atlan-text-primary)',
        fontSize: '12.5px',
        fontWeight: '650',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        letterSpacing: '0.01em',
        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.borderColor = 'rgba(20, 109, 158, 0.3)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 109, 158, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.04)';
      }}
    >
      <img src="/images/remolino.svg" alt="Language" style={{ width: '15px', height: '15px', objectFit: 'contain', flexShrink: 0 }} />
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 7px',
          height: '22px',
          borderRadius: 'var(--atlan-radius-full)',
          background: lang === 'zh'
            ? 'linear-gradient(135deg, #DE2910 0%, #B22222 100%)'
            : lang === 'en'
            ? 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)'
            : 'linear-gradient(135deg, #146D9E 0%, #0F5579 100%)',
          color: '#FFFFFF',
          fontWeight: '800',
          fontSize: '10.5px',
          letterSpacing: '0.04em',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
        }}
      >
        {getFlagBadge()}
      </span>
    </button>
  );
}
