'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { useHygiene } from '@/components/HygieneProvider';
import { SessionTimer } from '@/components/SessionTimer';
import { SferaLogo } from '@/components/SferaLogo';

export function Header({
  session = null,
  showMenuButton = false,
  onMenuClick,
}: {
  session?: Session | null;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}) {
  const { hygiene } = useHygiene();

  return (
    <header
      className="header-glass header-mobile-padding border-b"
      style={{
        borderColor: 'var(--studio-header-border, rgba(255,255,255,0.06))',
        padding: '14px 24px',
        background: 'var(--studio-header-bg)',
      }}
    >
      <div className="max-w-[1440px] mx-auto flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showMenuButton && (
            <button
              type="button"
              className="mobile-menu-btn glass-icon-btn"
              onClick={onMenuClick}
              aria-label="Открыть меню"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                color: 'var(--studio-meta-color)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-bars" style={{ fontSize: '1.1rem' }}></i>
            </button>
          )}
          <SferaLogo compact href="/" />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {session?.user ? (
            <>
              {hygiene.focusMode && (
                <div
                  className="glass-icon-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '30px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                  title="Режим фокуса включён"
                >
                  <i className="fas fa-circle" style={{ color: '#22c55e', fontSize: '0.7rem' }}></i>
                  Фокус
                </div>
              )}
              <SessionTimer />
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="header-auth-link"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 18px',
                borderRadius: '30px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <i className="fas fa-sign-in-alt" style={{ marginRight: '6px' }}></i>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
