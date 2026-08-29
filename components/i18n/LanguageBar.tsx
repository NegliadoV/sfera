'use client';

import { useTranslation } from '@/components/i18n/LanguageProvider';

export function LanguageBar({ className = '' }: { className?: string }) {
  const { locale, setLocale, locales, t } = useTranslation();

  return (
    <div className={`language-bar-container ${className}`} style={{ width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px',
          width: '100%',
        }}
      >
        {locales.map((loc) => {
          const isSelected = loc.code === locale;
          return (
            <button
              key={loc.code}
              type="button"
              onClick={() => setLocale(loc.code)}
              className={`language-bar-pill ${isSelected ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isSelected
                  ? '1.5px solid #818cf8'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#ffffff' : 'var(--text-primary, #e2e8f0)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 0 16px rgba(99, 102, 241, 0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{loc.flag}</span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {loc.nativeName}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: isSelected ? 0.9 : 0.5,
                    color: isSelected ? '#c7d2fe' : 'inherit',
                  }}
                >
                  {loc.name}
                </span>
              </div>
              {isSelected && (
                <i
                  className="fa-solid fa-check"
                  style={{ fontSize: '0.75rem', color: '#a5b4fc', marginLeft: 'auto' }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
