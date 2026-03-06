'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Извлекает contentId из URL (абсолютного или относительного /universes/.../content/...) */
function getContentIdFromUrl(url: string): string | null {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
    const m = path.match(/\/universes\/[^/]+\/content\/([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Извлекает slug вселенной из URL */
function getSlugFromUrl(url: string): string | null {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];
    const m = path.match(/\/universes\/([^/]+)\/content\//);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Нормализует URL для href (относительный -> абсолютный) */
function toHref(url: string): string {
  if (url.startsWith('http')) return url;
  if (typeof window !== 'undefined') return window.location.origin + (url.startsWith('/') ? url : `/${url}`);
  return url.startsWith('/') ? url : `/${url}`;
}

interface SharedContentLinkPreviewProps {
  url: string;
  contentId: string | null;
}

/** Превью пересланного материала: запрашивает заголовок и показывает карточку со ссылкой */
export function SharedContentLinkPreview({ url, contentId }: SharedContentLinkPreviewProps) {
  const [title, setTitle] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const slug = getSlugFromUrl(url);
  const href = toHref(url);

  useEffect(() => {
    if (!contentId) return;
    let cancelled = false;
    fetch(`/api/content/${contentId}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: { title?: string }) => {
        if (!cancelled && data?.title) setTitle(data.title);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [contentId]);

  if (!contentId || !slug) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>
        {url}
      </a>
    );
  }

  return (
    <div
      style={{
        margin: '8px 0',
        padding: 12,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-accent)',
        border: '1px solid var(--border-subtle)',
        maxWidth: 360,
      }}
    >
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
        Пересланный материал
      </div>
      <Link
        href={href}
        style={{
          fontWeight: 600,
          color: 'var(--accent-primary)',
          textDecoration: 'none',
          wordBreak: 'break-word',
          display: 'block',
        }}
      >
        {failed ? 'Материал' : (title || 'Загрузка…')}
      </Link>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, display: 'inline-block' }}
      >
        Открыть
      </a>
    </div>
  );
}

/** Проверяет, является ли URL ссылкой на контент в приложении */
export function isContentUrl(url: string): boolean {
  return getContentIdFromUrl(url) !== null;
}

/** Извлекает contentId из URL для использования в MessageBody */
export function getContentId(url: string): string | null {
  return getContentIdFromUrl(url);
}
