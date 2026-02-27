'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type DigestItem = {
  id: string;
  title: string;
  universeSlug: string;
  universeName: string;
  createdAt: string;
};

type DigestResponse = {
  items: DigestItem[];
  total: number;
  byUniverse: Array<{ name: string; slug: string; count: number }>;
};

export function DigestPreview() {
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/digest', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { items: [], total: 0, byUniverse: [] }))
      .then(setData)
      .catch(() => setData({ items: [], total: 0, byUniverse: [] }))
      .finally(() => setLoading(false));
  }, []);

  const previewItems = data?.items?.slice(0, 5) ?? [];
  const total = data?.total ?? 0;

  if (loading) {
    return (
      <div className="cabinet-digest-placeholder">
        <p style={{ color: 'var(--text-muted)' }}>Загрузка…</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <>
        <div className="cabinet-digest-placeholder">
          <i className="fa-regular fa-messages" style={{ fontSize: '2.2rem', opacity: 0.5, marginBottom: '14px', display: 'block' }} aria-hidden />
          <p style={{ marginBottom: '8px' }}>Новый контент за 24 часа</p>
          <span style={{ fontSize: '0.85rem' }}>Пока пусто</span>
        </div>
        <div className="cabinet-digest-links">
          <Link href="/digest" style={{ color: 'inherit', textDecoration: 'none' }}>
            <i className="fa-regular fa-newspaper" aria-hidden /> Читать дайджест
          </Link>
          <Link href="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
            <i className="fa-regular fa-bell" aria-hidden /> Настроить рассылку
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          За последние 24 часа: <strong>{total}</strong> {total === 1 ? 'пост' : total < 5 ? 'поста' : 'постов'}
        </p>
        <ul className="list-none p-0 m-0 space-y-2">
          {previewItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`/universes/${encodeURIComponent(item.universeSlug)}/content/${item.id}`}
                className="cabinet-digest-item-link"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 12,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.title.slice(0, 60)}{item.title.length > 60 ? '…' : ''}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginTop: 4 }}>
                  {item.universeName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="cabinet-digest-links">
        <Link href="/digest" style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}>
          Читать дайджест
        </Link>
        <Link href="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
          <i className="fa-regular fa-bell" aria-hidden /> Настроить рассылку
        </Link>
      </div>
    </>
  );
}
