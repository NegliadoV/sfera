'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { AddContentForm } from '../AddContentForm';
import { ContentFeedGrid } from '../ContentFeedGrid';
import { TrackUniverseButton } from '@/components/content/TrackUniverseButton';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <div style={{ marginTop: 16 }}>
          <EmptyState
            icon="fa-newspaper"
            variant="feed"
            title={t('content.emptyTitle', 'В этой комнате пока нет материалов')}
            description={
              hasSession
                ? t('content.emptyDescAuth', 'Станьте первым автором! Поделитесь ссылкой, мыслью или запустите агрегацию источников.')
                : t('content.emptyDescGuest', 'Здесь скоро появятся материалы. Войдите, чтобы добавить первый пост в эту комнату.')
            }
            primaryAction={hasSession ? {
              label: t('content.emptyAction', 'Добавить первый материал'),
              icon: 'fa-plus',
              onClick: () => {
                const form = document.getElementById('add-content-form');
                form?.scrollIntoView({ behavior: 'smooth' });
                (form?.querySelector('input,textarea') as HTMLElement)?.focus();
              },
            } : {
              label: t('auth.signIn', 'Войти'),
              href: '/auth/signin',
              icon: 'fa-sign-in-alt',
            }}
            secondaryAction={{
              label: t('rooms.knowledgeRooms', 'Все комнаты'),
              href: '/rooms',
            }}
          />
        </div>
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
