'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import type { Locale } from '@/lib/i18n/types';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function LanguageSelector({ compact = false, className = '', style }: LanguageSelectorProps) {
  const { locale, setLocale, locales, currentLocaleMeta, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="glass-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: compact ? '4px 8px' : '6px 12px',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'var(--text-primary, #fff)',
          cursor: 'pointer',
          fontSize: compact ? '0.8rem' : '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        title={t('settings.language', 'Язык')}
      >
        <span style={{ fontSize: '1rem' }}>{currentLocaleMeta.flag}</span>
        {!compact && <span>{currentLocaleMeta.nativeName}</span>}
        <i
          className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}
          style={{ fontSize: '0.65rem', opacity: 0.6 }}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            zIndex: 999,
            minWidth: 200,
            background: 'var(--dropdown-bg, rgba(18, 20, 32, 0.95))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
            padding: 6,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-secondary, rgba(255, 255, 255, 0.5))',
              letterSpacing: '0.05em',
            }}
          >
            {t('settings.selectLanguage', 'Выберите язык')}
          </div>
          {locales.map((loc) => {
            const isSelected = loc.code === locale;
            return (
              <button
                key={loc.code}
                type="button"
                onClick={() => handleSelect(loc.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isSelected ? '#818cf8' : 'var(--text-primary, #fff)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{loc.flag}</span>
                <span style={{ flex: 1 }}>{loc.nativeName}</span>
                {isSelected && (
                  <i className="fa-solid fa-check" style={{ fontSize: '0.8rem', color: '#818cf8' }} aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
