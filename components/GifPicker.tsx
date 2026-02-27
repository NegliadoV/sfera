'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

type GifItem = { id: string; url: string };

export function GifPicker({ onPick, children }: { onPick: (url: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (open && btnRef.current && typeof document !== 'undefined') {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.min(rect.left, window.innerWidth - 336),
      });
    }
  }, [open]);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/me/gif-search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      const data = await res.json();
      const list = Array.isArray(data?.gifs) ? data.gifs : Array.isArray(data) ? data : [];
      setResults(list);
      setNotConfigured(data && 'configured' in data && data.configured === false);
    } catch {
      setResults([]);
      setNotConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Поиск GIF"
        className="gif-picker-trigger"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid var(--border-color)',
          background: open ? 'var(--bg-accent)' : 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
        }}
      >
        <span className="gif-icon-label">GIF</span>
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: pos.bottom,
            left: pos.left,
            padding: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            width: 320,
            maxHeight: Math.min(320, window.innerHeight - 120),
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск GIF по ключевым словам…"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
          <div
            style={{
              overflowY: 'auto',
              maxHeight: 240,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              scrollbarWidth: 'thin',
            }}
          >
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Поиск…
              </div>
            ) : results.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {notConfigured
                  ? 'Добавьте GIPHY_API_KEY в .env для поиска GIF (developers.giphy.com)'
                  : query.trim()
                    ? 'Ничего не найдено. Попробуйте другой запрос.'
                    : 'Введите ключевые слова (например: привет, кот)'}
              </div>
            ) : (
              results.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    onPick(g.url);
                    setOpen(false);
                  }}
                  style={{
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    aspectRatio: 1,
                  }}
                  className="hover:opacity-90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
