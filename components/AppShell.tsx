'use client';

import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/AppSidebar';
import { OmniBar } from '@/components/OmniBar';
import { Header } from '@/components/Header';
import { MobileTabBar } from '@/components/MobileTabBar';

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
        <MobileTabBar />
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
      <div
        className="sidebar-drawer glass-panel shadow-2xl hidden md:flex"
        data-open={mobileMenuOpen}
        style={{
          flexDirection: 'row',
          flexShrink: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          minWidth: 280,
          border: '1px solid var(--studio-panel-border)',
          background: 'var(--studio-panel-bg)',
        }}
      >
        <AppSidebar session={session} />
      </div>
      <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <Header 
          session={session} 
          showMenuButton={false} 
        />
        {children}
        {/* Надежный нижний отступ для мобильных, чтобы таб-бар не перекрывал контент */}
        <div className="h-[100px] shrink-0 w-full block md:hidden pointer-events-none"></div>
      </main>
    </div>
    <MobileTabBar />
    <OmniBar />
    </>
  );
}
