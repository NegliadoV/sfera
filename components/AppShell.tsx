'use client';

import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/AppSidebar';

export function AppShell({
  children,
  session = null,
  showSidebar,
  mobileMenuOpen = false,
  setMobileMenuOpen,
}: {
  children: React.ReactNode;
  session?: Session | null;
  showSidebar: boolean;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}) {
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
      {/* Оверлей на мобильном: закрывает меню по тапу */}
      <div
        className="sidebar-overlay"
        data-visible={mobileMenuOpen}
        onClick={() => setMobileMenuOpen?.(false)}
        onKeyDown={(e) => e.key === 'Escape' && setMobileMenuOpen?.(false)}
        role="button"
        tabIndex={0}
        aria-label="Закрыть меню"
        style={{ cursor: 'pointer' }}
      />
      {/* Сайдбар: навигация + панель контактов (выдвижная) */}
      <div
        className="sidebar-drawer"
        data-open={mobileMenuOpen}
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          backgroundColor: 'var(--studio-panel-bg)',
          borderRight: '1px solid var(--studio-panel-border)',
          minWidth: 280,
        }}
      >
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={() => setMobileMenuOpen?.(false)}
          aria-label="Закрыть меню"
          style={{
            display: 'none',
            alignSelf: 'flex-end',
            margin: '12px 12px 0 0',
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-accent)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="fas fa-times"></i>
        </button>
        <AppSidebar session={session} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
