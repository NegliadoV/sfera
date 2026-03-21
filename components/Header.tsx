'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { useHygiene } from '@/components/HygieneProvider';
import { SessionTimer } from '@/components/SessionTimer';
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
    <header className="w-full flex items-center justify-between px-6 py-4 sticky top-0 z-50 pointer-events-none">
      <div className="max-w-[1440px] w-full mx-auto flex justify-between items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-3 min-w-0">
          {showMenuButton && (
            <button
              type="button"
              className={buttonVariants({ variant: 'glass', size: 'icon', className: 'md:hidden h-10 w-10 shrink-0' })}
              onClick={onMenuClick}
              aria-label="Открыть меню"
            >
              <i className="fas fa-bars text-[1.1rem]"></i>
            </button>
          )}
          {!showMenuButton && <SferaLogo compact href="/" />}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {session?.user ? (
            <>
              {hygiene.focusMode && (
                <div
                  className="glass-icon-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[var(--text-secondary)]"
                  title="Режим фокуса включён"
                >
                  <i className="fas fa-circle text-[#22c55e] text-[0.7rem]"></i>
                  Фокус
                </div>
              )}
              <SessionTimer />
            </>
          ) : (
            <Link
              href="/auth/signin"
              className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}
            >
              <i className="fas fa-sign-in-alt mr-1.5"></i>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
