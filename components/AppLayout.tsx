'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { DMBadgeListener } from '@/components/DMBadgeListener';

function useShowSidebar(isAuthenticated: boolean) {
  const pathname = usePathname();
  if (!isAuthenticated) return false;
  if (!pathname) return false;
  if (pathname === '/about') return false;
  if (pathname.startsWith('/auth')) return false;
  if (pathname === '/not-found') return false;
  return true;
}

export function AppLayout({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = useShowSidebar(!!session?.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'z') {
        setZenMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (zenMode && showSidebar) {
      document.body.setAttribute('data-zen', 'true');
    } else {
      document.body.removeAttribute('data-zen');
    }
    return () => document.body.removeAttribute('data-zen');
  }, [zenMode, showSidebar]);

  useEffect(() => {
    const id = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  return (
    <div className="app-shell-unified">
      <DMBadgeListener enabled={!!session?.user?.id} />
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
