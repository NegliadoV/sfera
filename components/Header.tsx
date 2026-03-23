'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { useHygiene } from '@/components/HygieneProvider';
import { SessionTimer } from '@/components/SessionTimer';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { SferaLogo } from '@/components/SferaLogo';
import { buttonVariants } from '@/components/ui/button';

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
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 pointer-events-none">
      <div className="max-w-[1440px] w-full mx-auto flex justify-between items-center gap-2 sm:gap-3 pointer-events-auto">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-3 min-w-0 flex-1 justify-between">
          <div className="flex items-center gap-3">
            {!showMenuButton && <SferaLogo compact href="/" />}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {session?.user ? (
              <>
                {hygiene.focusMode && (
                  <div className="glass-icon-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)]" title="Режим фокуса включён">
                    <i className="fas fa-circle text-[#22c55e] text-[0.7rem]"></i>
                    Фокус
                  </div>
                )}
                <SessionTimer />
              </>
            ) : (
              <Link href="/auth/signin" className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}>
                <i className="fas fa-sign-in-alt mr-1.5"></i>
                Войти
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Header (replicates React Native app top bar styles) */}
        <div className="flex md:hidden items-center w-full justify-between mt-1">
          <div className="flex items-center gap-2">
             <SferaLogo compact href="/" />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/explore" aria-label="Поиск" className="flex items-center justify-center w-[40px] h-[40px] relative shrink-0 active:scale-95 transition-transform" style={{ background: 'var(--bg-accent)', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              <i className="fas fa-search text-[1.1rem]"></i>
            </Link>
            <NotificationsDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
