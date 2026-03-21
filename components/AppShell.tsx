'use client';

import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/AppSidebar';
import { OmniBar } from '@/components/OmniBar';
import { Header } from '@/components/Header';

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
    return (
      <>
        <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          <Header session={session} showMenuButton={false} />
          {children}
        </main>
        <OmniBar />
      </>
    );
  }

  return (
    <>
    <div className="flex flex-1 relative p-3 md:p-6 gap-3 md:gap-6 overflow-hidden">
      {/* Background Animated Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

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
        className="sidebar-drawer glass-panel shadow-2xl"
        data-open={mobileMenuOpen}
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          minWidth: 280,
          border: '1px solid var(--studio-panel-border)',
          background: 'var(--studio-panel-bg)',
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
      <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
    <OmniBar />
    </>
  );
}
