'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-4 right-4 z-[200] max-w-[400px] mx-auto pointer-events-none">
      <nav className="mobile-tab-bar pointer-events-auto flex items-center justify-between h-[64px] px-4 rounded-full glass-panel border border-[rgba(255,255,255,0.1)] bg-[color-mix(in_srgb,var(--bg-secondary)_40%,transparent)] shadow-[0_10px_20px_rgba(0,0,0,0.5)] backdrop-blur-[32px]">
        <Link href="/" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <i className={`fas fa-house text-[22px] transition-colors duration-200 ${isActive('/') ? 'text-[var(--accent-primary)]' : 'text-[#a1a1aa]'}`}></i>
          {isActive('/') && <div className="absolute bottom-[8px] w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]"></div>}
        </Link>
        
        <Link href="/explore" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <i className={`fas fa-globe text-[22px] transition-colors duration-200 ${isActive('/explore') ? 'text-[var(--accent-primary)]' : 'text-[#a1a1aa]'}`}></i>
          {isActive('/explore') && <div className="absolute bottom-[8px] w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]"></div>}
        </Link>

        {/* Центральная кнопка Плюс */}
        <Link href="/universes/create" className="flex flex-col items-center justify-center flex-1 h-full shrink-0 px-2">
          <div className="flex items-center justify-center w-[40px] h-[40px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-full shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-primary)_40%,transparent)] transform active:scale-90 transition-all">
            <i className="fas fa-plus text-lg"></i>
          </div>
        </Link>

        <Link href="/rooms" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <i className={`fas fa-microphone text-[22px] transition-colors duration-200 ${isActive('/rooms') ? 'text-[var(--accent-primary)]' : 'text-[#a1a1aa]'}`}></i>
          {isActive('/rooms') && <div className="absolute bottom-[8px] w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]"></div>}
        </Link>

        <Link href="/messages" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <i className={`fas fa-comment-dots text-[22px] transition-colors duration-200 ${isActive('/messages') ? 'text-[var(--accent-primary)]' : 'text-[#a1a1aa]'}`}></i>
          {isActive('/messages') && <div className="absolute bottom-[8px] w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]"></div>}
        </Link>

        <Link href="/me" className="relative flex flex-col items-center justify-center flex-1 h-full">
          <i className={`fas fa-user text-[22px] transition-colors duration-200 ${isActive('/me') ? 'text-[var(--accent-primary)]' : 'text-[#a1a1aa]'}`}></i>
          {isActive('/me') && <div className="absolute bottom-[8px] w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--accent-primary)]"></div>}
        </Link>
      </nav>
    </div>
  );
}
