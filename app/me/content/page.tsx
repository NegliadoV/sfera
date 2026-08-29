'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShareToSphereButton } from '@/components/ShareToSphereButton';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useTranslation } from '@/components/i18n/LanguageProvider';

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

export default function MeContentPage() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<UserContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const localeMap: Record<string, string> = {
    ru: 'ru', en: 'en', zh: 'zh', ja: 'ja', ko: 'ko', vi: 'vi', es: 'es', de: 'de', fr: 'fr'
  };
  const dateLocale = localeMap[locale] ?? 'ru';

  useEffect(() => {
    fetch('/api/me/content', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me">{t('nav.cabinet', 'Личный кабинет')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('nav.assembly', 'Сборка')}</span>
      </div>

      <div className="platform-card mb-6">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          {t('content.feedTitle', 'Лента контента')}
        </h1>
        <p className="platform-card-desc">
          {t('content.feedDesc', 'Агрегированный контент из ваших источников. Добавляйте источники в панели «Сборка» и делитесь постами в сферы.')}
        </p>
      </div>

      {loading ? (
        <p className="platform-card-desc">{t('common.loading', 'Загрузка…')}</p>
      ) : items.length === 0 ? (
        <p className="platform-card-desc">
          {t('content.feedEmpty', 'Пока нет контента. Добавьте источники в панели «Сборка» и запустите агрегацию.')}
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
                      {new Date(c.publishedAt || c.createdAt).toLocaleDateString(dateLocale, {
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
