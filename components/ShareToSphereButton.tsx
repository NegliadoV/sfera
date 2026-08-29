'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/components/i18n/LanguageProvider';

type Universe = { id: string; slug: string; name: string };

export function ShareToSphereButton({ userContentId }: { userContentId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/me/universes', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUniverses(data.map((u: { id?: string; slug: string; name: string }) => ({ id: u.id ?? '', slug: u.slug, name: u.name })));
        }
      })
      .catch(() => setUniverses([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current && typeof document !== 'undefined') {
      const updateRect = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownRect({ top: rect.bottom + 4, left: rect.left });
        }
      };
      updateRect();
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
      return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
      };
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  const q = searchQuery.trim().toLowerCase();
  const filtered = universes.filter((u) => u.name.toLowerCase().includes(q) || u.slug.toLowerCase().includes(q));

  const handleShare = async (universeId: string, slug: string) => {
    setSharing(universeId);
    try {
      const res = await fetch('/api/me/content/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userContentId, universeId }),
      });
      if (res.ok) {
        setOpen(false);
        router.push(`/universes/${slug}/content`);
      }
    } finally {
      setSharing(null);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <i className="fas fa-share" />
        {t('common.share', 'Поделиться в комнату')}
      </button>
      {open &&
        dropdownRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-label={t('rooms.title', 'Выберите комнату')}
              style={{
                position: 'fixed',
                top: dropdownRect.top,
                left: dropdownRect.left,
                minWidth: 220,
                padding: 12,
                background: 'var(--studio-panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                zIndex: 9999,
              }}
            >
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                {t('rooms.title', 'Выберите комнату')}
              </p>
              <input
                type="search"
                placeholder={t('rooms.search', 'Поиск комнаты…')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: 10,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--studio-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              {loading ? (
                <p style={{ fontSize: '0.85rem' }}>{t('common.loading', 'Загрузка…')}</p>
              ) : universes.length === 0 ? (
                <p style={{ fontSize: '0.85rem' }}>{t('rooms.noRooms', 'Нет доступных комнат')}</p>
              ) : filtered.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('sources.nothingFound', 'Ничего не найдено')}</p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  {filtered.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => handleShare(u.id, u.slug)}
                        disabled={!!sharing}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          textAlign: 'left',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          cursor: sharing ? 'wait' : 'pointer',
                          borderRadius: 8,
                        }}
                        className="hover:bg-[var(--studio-participant-bg)]"
                      >
                        {sharing === u.id ? '…' : u.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
