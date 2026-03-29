'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Logo } from '@/components/Logo'; // (Оставляем, если вдруг понадобится, но можно и удалить)
import { SferaSphereIcon } from '@/components/SferaSphereIcon';
import { ExploreIcon, CreateIcon, MessagesIcon, ProfileIcon, MenuIcon } from '@/components/MobileNavIcons';

export function MobileTabBar({ onMenuClick, isMenuOpen }: { onMenuClick?: () => void; isMenuOpen?: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="mobile-tab-bar-container md:hidden">
      <nav className="mobile-tab-bar">

        <Link href="/explore" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <div className={`nav-icon-wrapper ${isActive('/explore') ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
            <ExploreIcon size={26} />
          </div>
          {isActive('/explore') && <div className="nav-indicator"></div>}
        </Link>

        <Link href="/rooms" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <div className={`nav-icon-wrapper ${isActive('/rooms') ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
            <SferaSphereIcon size="sm" />
          </div>
          {isActive('/rooms') && <div className="nav-indicator"></div>}
        </Link>

        {/* Центральная кнопка Создать (Шортсы) - Ровно посередине (3-я из 5) */}
        <Link href="/shorts/upload" className="flex flex-col items-center justify-center flex-1 h-full shrink-0 px-2">
          <div className={`nav-icon-wrapper w-[44px] h-[44px] rounded-full transform active:scale-90 ${isActive('/shorts/upload') ? 'bg-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] shadow-[0_0_15px_var(--accent-primary)]' : ''}`}>
            <CreateIcon size={34} />
          </div>
        </Link>

        <Link href="/messages" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <div className={`nav-icon-wrapper ${isActive('/messages') ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
            <MessagesIcon size={26} />
          </div>
          {isActive('/messages') && <div className="nav-indicator"></div>}
        </Link>

        {onMenuClick ? (
          <button type="button" onClick={onMenuClick} className="relative flex flex-col items-center justify-center flex-1 h-full bg-transparent border-none cursor-pointer p-0 m-0">
            <div className={`nav-icon-wrapper ${isMenuOpen ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
              <MenuIcon size={26} />
            </div>
            {isMenuOpen && <div className="nav-indicator"></div>}
          </button>
        ) : (
          <Link href="/me" className="relative flex flex-col items-center justify-center flex-1 h-full">
            <div className={`nav-icon-wrapper ${isActive('/me') ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
              <ProfileIcon size={26} avatarUrl={session?.user?.image} />
            </div>
            {isActive('/me') && <div className="nav-indicator"></div>}
          </Link>
        )}
      </nav>
    </div>
  );
}
