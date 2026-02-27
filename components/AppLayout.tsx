'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { DMBadgeListener } from '@/components/DMBadgeListener';

function useShowSidebar() {
  const pathname = usePathname();
  if (!pathname) return false;
  if (pathname === '/about') return false;
  if (pathname.startsWith('/auth')) return false;
  if (pathname === '/not-found') return false;
  return true;
}

export function AppLayout({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = useShowSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  return (
    <div className="app-shell-unified">
      <DMBadgeListener enabled={!!session?.user?.id} />
      <Header
        session={session}
        showMenuButton={showSidebar}
        onMenuClick={showSidebar ? () => setMobileMenuOpen(true) : undefined}
      />
      <div className="app-shell-content">
        <AppShell
          session={session}
          showSidebar={showSidebar}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        >
          {children}
        </AppShell>
      </div>
    </div>
  );
}
