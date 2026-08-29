'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { MindMapCreateButton } from './MindMapCreateButton';
import { DeleteMindMapButton } from '@/components/mind-maps/DeleteMindMapButton';

interface MindMap {
  id: string;
  title: string;
  universeId: string | null;
  updatedAt: Date;
}

interface MindMapsPageClientProps {
  mapsList: MindMap[];
}

export function MindMapsPageClient({ mapsList }: MindMapsPageClientProps) {
  const { t, locale } = useTranslation();

  const localeMap: Record<string, string> = {
    ru: 'ru', en: 'en', zh: 'zh', ja: 'ja', ko: 'ko', vi: 'vi', es: 'es', de: 'de', fr: 'fr'
  };
  const dateLocale = localeMap[locale] ?? 'ru';

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/rooms">{t('nav.rooms', 'Комнаты')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me/content">{t('nav.myContent', 'Мой контент')}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('nav.mindMaps', 'Ментальные карты')}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-white m-0">{t('mindMaps.title', 'Мои Карты')}</h1>
        <MindMapCreateButton />
      </div>

      {mapsList.length === 0 ? (
        <div className="platform-card flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/20 bg-white/5">
          <i className="fa-solid fa-project-diagram text-4xl mb-4 opacity-50 text-[var(--studio-ctrl-icon)]" aria-hidden />
          <h2 className="text-xl font-semibold mb-2 text-white">{t('mindMaps.empty', 'У вас пока нет ментальных карт')}</h2>
          <p className="text-sm opacity-70 mb-6">
            {t('mindMaps.emptyDesc', 'Создайте свою первую карту для мозгового штурма и планирования. Вы сможете добавлять текстовые узлы и вставлять полноценные публикации из ленты.')}
          </p>
          <MindMapCreateButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapsList.map((map) => (
            <div key={map.id} className="relative group">
              <Link
                href={`/me/mind-maps/${map.id}`}
                className="no-underline block h-full"
              >
                <div className="platform-card h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/10 hover:border-white/20 bg-[var(--studio-panel-bg)] flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-[var(--accent-primary)]/20">
                          <i className="fa-solid fa-network-wired" aria-hidden />
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight break-words m-0 group-hover:text-[var(--accent-primary)] transition-colors truncate">
                          {map.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-white/50 font-medium">
                    {map.universeId ? (
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-globe" /> {t('mindMaps.universe', 'Вселенная')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-lock" /> {t('mindMaps.private', 'Приватная')}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <time dateTime={map.updatedAt.toISOString()}>
                        {map.updatedAt.toLocaleDateString(dateLocale)}
                      </time>
                      <DeleteMindMapButton mapId={map.id} mapTitle={map.title} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
