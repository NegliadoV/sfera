'use client';

import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileTabBar } from '@/components/MobileTabBar';
import { MobileMenuSheet } from '@/components/MobileMenuSheet';
import { OmniBar } from '@/components/OmniBar';
import { Header } from '@/components/Header';

export function MobileLayout({
  children,
  session,
  showSidebar,
  mobileMenuOpen,
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
      <div className="flex md:hidden flex-col flex-1 relative min-h-0 w-full overflow-hidden">
        <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          <Header session={session} showMenuButton={false} />
          {children}
        </main>
        <MobileTabBar onMenuClick={() => setMobileMenuOpen?.(true)} isMenuOpen={mobileMenuOpen} />
        <OmniBar />
      </div>
    );
  }

  return (
    <div className="flex md:hidden flex-1 relative p-3 gap-3 overflow-hidden min-h-0 w-full">
      {/* Background Animated Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* Mobile Bottom Sheet Menu (Replaces old sidebar) */}
      <MobileMenuSheet 
        session={session} 
        open={Boolean(mobileMenuOpen)} 
        onClose={() => setMobileMenuOpen?.(false)} 
      />

      <main className="app-main flex-1 w-full relative" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <Header session={session} showMenuButton={false} />
        {children}
        {/* Надежный нижний отступ для мобильных, чтобы таб-бар не перекрывал контент */}
        <div className="h-[100px] mobile-safe-bottom shrink-0 w-full pointer-events-none"></div>
      </main>

      <MobileTabBar onMenuClick={() => setMobileMenuOpen?.(true)} isMenuOpen={mobileMenuOpen} />
      <OmniBar />
    </div>
  );
}
