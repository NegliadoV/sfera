import React, { useState } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { CrystalBalance } from '@/components/CrystalBalance';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { MiniAppModal } from '@/components/MiniAppModal';

export function MobileMenuSheet({
  session,
  open,
  onClose,
}: {
  session?: Session | null;
  open: boolean;
  onClose: () => void;
}) {
  const [miniAppOpen, setMiniAppOpen] = useState(false);

  return (
    <>
      {/* Black transparent overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[200] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Bottom Sheet Container */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[201] glass-panel rounded-t-[32px] border-t border-[var(--studio-panel-border)] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{
          background: 'color-mix(in srgb, var(--studio-panel-bg) 95%, transparent)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Pull Indicator */}
        <div className="w-full flex justify-center pt-3 pb-3 shrink-0" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-[var(--border-color)] opacity-60" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 sm:px-6">
          
          {/* Header Identity */}
          {session?.user && (
            <div className="flex items-center gap-4 mb-8 shrink-0 pb-6 border-b border-[var(--studio-panel-border)]">
              <Link href="/me" onClick={onClose} className="rounded-[18px] overflow-hidden shadow-lg border border-[var(--border-color)] shrink-0 w-[56px] h-[56px] bg-[var(--bg-accent)] flex items-center justify-center font-bold text-xl relative group">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="Avatar" width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <span>{(session.user.name ?? session.user.email ?? '?').charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-active:bg-black/20 transition-colors" />
              </Link>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {session.user.name ?? 'Guest'}
                </span>
                <span className="text-[13px] truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {/* @ts-ignore - custom session property */}
                  @{session.user.userTag ?? 'user'}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <CrystalBalance />
                <div onClick={(e) => e.stopPropagation()} className="relative transform active:scale-95 transition-transform">
                  <NotificationsDropdown />
                </div>
              </div>
            </div>
          )}

          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6 shrink-0 relative">
            {/* Navigational Links */}
            <Link href="/me/content" onClick={onClose} className="mobile-sheet-btn group">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-[color-mix(in_srgb,var(--accent-primary)_15%,transparent)] group-active:bg-[color-mix(in_srgb,var(--accent-primary)_25%,transparent)] transition-colors">
                <i className="fas fa-rss text-xl text-[var(--accent-primary)] drop-shadow-[0_0_8px_var(--accent-primary)]" />
              </div>
              <span className="text-[15px] font-semibold tracking-wide">Сборка</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">RSS и авторы</span>
            </Link>

            <Link href="/me/mind-maps" onClick={onClose} className="mobile-sheet-btn group">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-[color-mix(in_srgb,var(--accent-purple)_15%,transparent)] group-active:bg-[color-mix(in_srgb,var(--accent-purple)_25%,transparent)] transition-colors">
                <i className="fas fa-project-diagram text-xl text-[var(--accent-purple)] drop-shadow-[0_0_8px_var(--accent-purple)]" />
              </div>
              <span className="text-[15px] font-semibold tracking-wide">Карты</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">База знаний</span>
            </Link>

            <Link href="/digest" onClick={onClose} className="mobile-sheet-btn group">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-[color-mix(in_srgb,#10b981_15%,transparent)] group-active:bg-[color-mix(in_srgb,#10b981_25%,transparent)] transition-colors">
                <i className="fas fa-newspaper text-xl text-[#10b981] drop-shadow-[0_0_8px_#10b981]" />
              </div>
              <span className="text-[15px] font-semibold tracking-wide">Дайджест</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">Главное за день</span>
            </Link>

            <button type="button" onClick={() => { setMiniAppOpen(true); }} className="mobile-sheet-btn group">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-[color-mix(in_srgb,#f43f5e_15%,transparent)] group-active:bg-[color-mix(in_srgb,#f43f5e_25%,transparent)] transition-colors">
                <i className="fas fa-layer-group text-xl text-[#f43f5e] drop-shadow-[0_0_8px_#f43f5e]" />
              </div>
              <span className="text-[15px] font-semibold tracking-wide">Приложения</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">Полезные утилиты</span>
            </button>

            <Link href="/contacts" onClick={onClose} className="mobile-sheet-btn group">
              <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-[color-mix(in_srgb,#3b82f6_15%,transparent)] group-active:bg-[color-mix(in_srgb,#3b82f6_25%,transparent)] transition-colors">
                <i className="fas fa-users text-xl text-[#3b82f6] drop-shadow-[0_0_8px_#3b82f6]" />
              </div>
              <span className="text-[15px] font-semibold tracking-wide">Контакты</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">Поиск друзей</span>
            </Link>
            
            <Link href="/settings" onClick={onClose} className="mobile-sheet-btn col-span-2 flex-row justify-start py-4 px-5 gap-4 h-auto mt-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--text-secondary)_15%,transparent)]">
                <i className="fas fa-gear text-[17px] text-[var(--text-secondary)]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[15px] font-semibold tracking-wide">Настройки аккаунта</span>
                <span className="text-[12px] text-[var(--text-secondary)] mt-0.5">Тема, приватность, токены</span>
              </div>
              <i className="fas fa-chevron-right ml-auto text-[var(--border-color)] text-sm" />
            </Link>
          </div>

          <style jsx>{`
            .mobile-sheet-btn {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px 10px;
              background: var(--bg-accent);
              border: 1px solid color-mix(in srgb, var(--border-color) 40%, transparent);
              border-radius: 24px;
              text-decoration: none;
              color: var(--text-primary);
              transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
              box-shadow: inset 0 1px 1px rgba(255,255,255,0.03);
            }
            .mobile-sheet-btn:active {
              transform: scale(0.96);
              background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-accent) 95%);
            }
          `}</style>
        </div>
      </div>

      {miniAppOpen && (
        <div className="z-[250] relative">
          <MiniAppModal 
            url="https://pomofocus.io" 
            title="Таймер Фокуса" 
            onClose={() => setMiniAppOpen(false)} 
          />
        </div>
      )}
    </>
  );
}
