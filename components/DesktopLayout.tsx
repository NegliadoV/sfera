'use client';

import type { Session } from 'next-auth';
import { AppSidebar } from '@/components/AppSidebar';
import { OmniBar } from '@/components/OmniBar';
import { Header } from '@/components/Header';

export function DesktopLayout({
  children,
  session,
  showSidebar,
}: {
  children: React.ReactNode;
  session?: Session | null;
  showSidebar: boolean;
}) {
  if (!showSidebar) {
    return (
      <div className="hidden md:flex flex-col flex-1 relative min-h-0 w-full overflow-hidden">
        <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          <Header session={session} showMenuButton={false} />
          {children}
        </main>
        <OmniBar />
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-1 relative p-6 gap-6 overflow-hidden min-h-0 w-full">
      {/* Background Animated Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      {/* Main Sidebar (Desktop) */}
      <div
        className="sidebar-drawer glass-panel shadow-2xl relative flex"
        style={{
          flexDirection: 'row',
          flexShrink: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          minWidth: 'auto',
          border: '1px solid var(--studio-panel-border)',
          background: 'var(--studio-panel-bg)',
        }}
      >
        <AppSidebar session={session} />
      </div>

      <main className="app-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <Header session={session} showMenuButton={false} />
        {children}
      </main>

      <OmniBar />
    </div>
  );
}
