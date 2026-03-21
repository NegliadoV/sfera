'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export function OmniBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-md flex justify-center items-start pt-[15vh] sm:pt-[20vh] animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="bg-[var(--studio-panel-bg)]/80 glass-panel shadow-2xl rounded-2xl w-[90%] sm:w-full max-w-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{ borderColor: 'var(--studio-panel-border)' }}>
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b" style={{ borderColor: 'var(--studio-panel-border)' }}>
          <i className="fas fa-search text-xl text-[var(--accent-primary)] opacity-80 mr-3"></i>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-xl placeholder-white/30 text-[var(--text-primary)]"
            placeholder="Что ищем или куда отправимся? (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="text-sm opacity-50 hover:opacity-100 bg-white/10 px-2 rounded-md ml-2 border border-white/10">
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          
          <div className="text-xs font-semibold uppercase tracking-wider opacity-40 px-3 py-2 mt-2">
            Быстрые действия
          </div>
          
          <ul className="flex flex-col gap-1">
            <li>
              <button onClick={() => handleAction('/universes')} className="w-full text-left px-4 py-3 hover:bg-[var(--accent-primary)]/20 rounded-xl transition flex items-center group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-[var(--accent-primary)]/50 transition">
                  <i className="fas fa-globe text-[var(--text-primary)]"></i>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--text-primary)]">Сферы Знаний (Universes)</span>
                  <span className="text-xs text-[var(--text-secondary)]">Перейти к списку всех пространств</span>
                </div>
              </button>
            </li>
            <li>
              <button onClick={() => handleAction('/shorts')} className="w-full text-left px-4 py-3 hover:bg-[var(--accent-primary)]/20 rounded-xl transition flex items-center group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-[var(--accent-primary)]/50 transition">
                  <i className="fas fa-play text-[var(--text-primary)]"></i>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--text-primary)]">Шортсы (TikTok feed)</span>
                  <span className="text-xs text-[var(--text-secondary)]">Образовательные вертикальные видео</span>
                </div>
              </button>
            </li>
            <li>
              <button onClick={() => handleAction('/digest')} className="w-full text-left px-4 py-3 hover:bg-[var(--accent-primary)]/20 rounded-xl transition flex items-center group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-[var(--accent-primary)]/50 transition">
                  <i className="fas fa-newspaper text-[var(--text-primary)]"></i>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[var(--text-primary)]">Дайджест ИИ</span>
                  <span className="text-xs text-[var(--text-secondary)]">Умная суммаризация событий</span>
                </div>
              </button>
            </li>
          </ul>

          {query.trim().length > 0 && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider opacity-40 px-3 py-2 mt-4 border-t border-white/10 pt-4">
                Поиск " {query} "
              </div>
              <div className="p-4 text-center text-[var(--text-secondary)]">
                Поиск интегрируется с базой данных Drizzle...
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
