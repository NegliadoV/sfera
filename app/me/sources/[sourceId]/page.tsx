'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShareToSphereButton } from '@/components/ShareToSphereButton';
import { ImageLightbox } from '@/components/ImageLightbox';

type UserContentItem = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  externalAuthor?: string | null;
  publishedAt?: string | null;
  createdAt: string;
};

type SourceInfo = {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  url?: string | null;
};

export default function MeSourcePage() {
  const params = useParams();
  const sourceId = params?.sourceId as string | undefined;
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [items, setItems] = useState<UserContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(true);

  useEffect(() => {
    if (!sourceId) return;
    fetch(`/api/me/sources/${sourceId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) setSource(data);
        else setSource(null);
      })
      .catch(() => setSource(null))
      .finally(() => setSourceLoading(false));
  }, [sourceId]);

  useEffect(() => {
    if (!sourceId) return;
    setLoading(true);
    fetch(`/api/me/content?sourceId=${encodeURIComponent(sourceId)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [sourceId]);

  if (!sourceId) {
    return (
      <div className="platform-page">
        <p className="platform-card-desc">Источник не указан.</p>
      </div>
    );
  }

  if (sourceLoading) {
    return (
      <div className="platform-page">
        <p className="platform-card-desc">Загрузка…</p>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="platform-page">
        <p className="platform-card-desc">Источник не найден.</p>
        <Link href="/me/content" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          К ленте контента
        </Link>
      </div>
    );
  }

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me">Личный кабинет</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me/content">Сборка</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{source.name}</span>
      </div>

      <div className="platform-card mb-6">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          {source.name}
        </h1>
        <p className="platform-card-desc">
          Контент из источника «{source.name}». Добавляйте в сферы через кнопку «Поделиться».
        </p>
        <Link
          href="/me/content"
          style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontSize: '0.9rem' }}
        >
          <i className="fas fa-layer-group" style={{ marginRight: 6 }} />
          Вся лента Сборки
        </Link>
      </div>

      {loading ? (
        <p className="platform-card-desc">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="platform-card-desc">
          Пока нет контента из этого источника. Запустите агрегацию в панели «Сборка».
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((c) => (
            <div
              key={c.id}
              className="content-card content-card-feed"
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--studio-panel-bg)',
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {c.title}
                    </a>
                  ) : (
                    c.title
                  )}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {c.externalAuthor && <span>{c.externalAuthor}</span>}
                  {(c.publishedAt || c.createdAt) && (
                    <time dateTime={new Date(c.publishedAt || c.createdAt).toISOString()} style={{ marginLeft: c.externalAuthor ? 8 : 0 }}>
                      {new Date(c.publishedAt || c.createdAt).toLocaleDateString('ru', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  )}
                </div>
              </div>
              {c.body && (
                <div style={{ marginBottom: 12, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  {c.body.length > 300 ? `${c.body.slice(0, 300)}…` : c.body}
                </div>
              )}
              {c.imageUrl && (
                <div style={{ marginBottom: 12 }}>
                  <ImageLightbox
                    src={c.imageUrl}
                    alt={c.title}
                    style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }}
                  />
                </div>
              )}
              <ShareToSphereButton userContentId={c.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
