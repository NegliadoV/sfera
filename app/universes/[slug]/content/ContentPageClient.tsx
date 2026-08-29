'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { AddContentForm } from '../AddContentForm';
import { ContentFeedGrid } from '../ContentFeedGrid';
import { TrackUniverseButton } from '@/components/content/TrackUniverseButton';

import type { Session } from 'next-auth';

interface ContentPageClientProps {
  slug: string;
  name: string;
  universeId: string;
  hasSession: boolean;
  contentList: any[];
  canDelete: boolean;
  session?: Session | null;
}

export function ContentPageClient({ slug, name, universeId, hasSession, contentList, canDelete, session }: ContentPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-shapes" style={{ marginRight: 4 }} /> Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/rooms">{t('rooms.knowledgeRooms', 'Комнаты')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('rooms.feed', 'Лента')}</span>
      </div>

      <div className="platform-card mb-6">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          {t('rooms.feed', 'Лента')}: {name}
        </h1>
        <p className="platform-card-desc">
          {t('rooms.feedDesc', 'Материалы из источников и добавленные вручную.')}
        </p>
        {hasSession && (
          <div className="mt-4">
            <TrackUniverseButton universeSlug={slug} />
          </div>
        )}
      </div>

      {hasSession && (
        <div style={{ marginBottom: '16px' }}>
          <AddContentForm universeId={universeId} slug={slug} />
        </div>
      )}

      {contentList.length === 0 ? (
        <p className="platform-card-desc">
          {t('content.feedEmpty', 'Пока нет материалов. Добавьте контент выше или запустите агрегацию в Сборке.')}
        </p>
      ) : (
        <ContentFeedGrid
          items={contentList}
          slug={slug}
          canDelete={canDelete}
          canEdit={canDelete}
          canPin={canDelete}
          session={session}
        />
      )}
    </div>
  );
}
