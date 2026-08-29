'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { useLanguage } from '@/components/i18n/LanguageProvider';

type DigestItem = {
  id: string;
  title: string;
  universeSlug: string;
  universeName: string;
  publishedAt: string | null;
  createdAt: string;
};

type DigestResponse = {
  items: DigestItem[];
  total: number;
  byUniverse: Array<{ name: string; slug: string; count: number }>;
};

export function DigestContent() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/digest', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { items: [], total: 0, byUniverse: [] }))
      .then(setData)
      .catch(() => setData({ items: [], total: 0, byUniverse: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="digest-content">
        <p style={{ color: 'var(--text-muted)' }}>{t('digest.loading', 'Загрузка дайджеста…')}</p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const byUniverse = data?.byUniverse ?? [];

  // Map locale to BCP 47 language tag for date formatting
  const localeMap: Record<string, string> = {
    ru: 'ru', en: 'en', zh: 'zh', ja: 'ja', ko: 'ko', vi: 'vi', es: 'es', de: 'de', fr: 'fr'
  };
  const dateLocale = localeMap[locale] ?? 'ru';

  if (items.length === 0) {
    return (
      <div className="digest-content">
        <div className="digest-card">
          <div className="digest-icon">
            <i className="fa-regular fa-sun" aria-hidden />
          </div>
          <h2>{t('digest.noContent', 'Нет нового контента за последние 24 часа')}</h2>
          <div className="digest-description">
            {t('digest.noContentDesc', 'Подпишитесь на комнаты или добавьте источники в Сборку — как только появится новый контент, он отобразится здесь.')}
          </div>
          <div className="digest-actions">
            <Link href="/rooms" className="digest-action-btn">
              <i className="fa-solid fa-shapes" aria-hidden /> {t('digest.toSpheres', 'К комнатам')}
            </Link>
            <Link href="/me/content" className="digest-action-btn">
              <i className="fa-solid fa-layer-group" aria-hidden /> {t('nav.assembly', 'Сборка')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="digest-content">
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          {t('digest.bySpheres', 'Сводка по комнатам')}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {byUniverse.map((u) => (
            <Link
              key={u.slug}
              href={`/universes/${u.slug}/content`}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                background: 'var(--studio-participant-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              {u.name} <strong style={{ color: 'var(--accent-primary-muted)' }}>+{u.count}</strong>
            </Link>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
        {t('digest.newContent', 'Новый контент')} ({items.length})
      </h3>
      <ul className="list-none p-0 m-0" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/universes/${encodeURIComponent(item.universeSlug)}/content/${item.id}`}
              style={{
                display: 'block',
                padding: '16px 20px',
                borderRadius: 16,
                background: 'var(--studio-participant-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              className="hover:border-[var(--studio-participant-border-hover)]"
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {item.universeName}
                {' · '}
                <time dateTime={new Date(item.publishedAt ?? item.createdAt).toISOString()}>
                  {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString(dateLocale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
