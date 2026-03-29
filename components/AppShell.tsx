'use client';

import type { Session } from 'next-auth';
import { DesktopLayout } from '@/components/DesktopLayout';
import { MobileLayout } from '@/components/MobileLayout';

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
  return (
    <>
      <DesktopLayout 
        session={session} 
        showSidebar={showSidebar}
      >
        {children}
      </DesktopLayout>

      <MobileLayout 
        session={session} 
        showSidebar={showSidebar}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      >
        {children}
      </MobileLayout>
    </>
  );
}
