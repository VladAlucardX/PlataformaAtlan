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
        <span>{lang === 'es' ? 'EN' : 'ES'}</span>
      </button>
    );
  }

  // Default: pill variant (Claymorphism 3D style)
  return (
    <button
      onClick={toggle}
      className={className}
      aria-label="Toggle language"
      id="language-toggle"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px 6px 12px',
        background: '#FFFFFF',
        border: '2px solid rgba(255, 255, 255, 0.9)',
        borderRadius: 'var(--atlan-radius-full)',
        color: 'var(--atlan-text-primary)',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: `
          inset 2px 2px 5px rgba(255, 255, 255, 1),
          inset -3px -3px 6px rgba(20, 109, 158, 0.08),
          0 8px 20px -4px rgba(20, 109, 158, 0.12)
        `,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-outfit), system-ui, sans-serif',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
    >
      <img src="/images/remolino.svg" alt="Language" style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} />
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '28px',
          borderRadius: 'var(--atlan-radius-full)',
          background: 'linear-gradient(145deg, #FFE033 0%, #FFD700 70%, #E6C200 100%)',
          color: '#1A1A2E',
          fontWeight: '800',
          fontSize: '11px',
          letterSpacing: '0.05em',
          boxShadow: `
            inset 2px 2px 4px rgba(255, 255, 255, 0.7),
            inset -2px -2px 4px rgba(180, 140, 0, 0.35),
            0 4px 10px rgba(255, 215, 0, 0.3)
          `,
        }}
      >
        {lang.toUpperCase()}
      </span>
    </button>
  );
}
