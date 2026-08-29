'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { UniverseCard } from '@/components/universe/UniverseCard';
import { CreateUniverseDialog } from '@/app/universes/CreateUniverseDialog';
import { useTranslation } from '@/components/i18n/LanguageProvider';

export interface UniverseItem {
  id?: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sphereColor?: string | null;
  ownerId?: string | null;
  isPrivate?: boolean;
}

interface UniversesHubClientProps {
  universes: UniverseItem[];
  session: Session | null;
  trackedUniverseSlugs?: string[];
}

export function UniversesHubClient({
  universes,
  session,
  trackedUniverseSlugs = [],
}: UniversesHubClientProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tracked' | 'owned'>('all');

  const trackedSet = useMemo(() => new Set(trackedUniverseSlugs), [trackedUniverseSlugs]);
  const currentUserId = session?.user?.id;

  // Отслеживаемые и остальные комнаты для раздельного отображения
  const trackedUniverses = useMemo(
    () => universes.filter((u) => trackedSet.has(u.slug)),
    [universes, trackedSet]
  );

  const filteredUniverses = useMemo(() => {
    let list = universes;

    // Фильтрация по табам
    if (activeTab === 'tracked' && currentUserId) {
      list = list.filter((u) => trackedSet.has(u.slug));
    } else if (activeTab === 'owned' && currentUserId) {
      list = list.filter((u) => u.ownerId === currentUserId);
    }

    // Фильтрация по поисковой строке
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.description && u.description.toLowerCase().includes(q)) ||
          u.slug.toLowerCase().includes(q)
      );
    }

    return list;
  }, [universes, activeTab, currentUserId, trackedSet, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;
  const showSeparatedSections = activeTab === 'all' && !hasSearch && currentUserId && trackedUniverses.length > 0;

  return (
    <div className="platform-page">
      {/* Хлебные крошки */}
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-shapes" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('rooms.allKnowledgeRooms', 'Все комнаты')}</span>
      </div>

      <div className="platform-card mb-8">
        {/* Шапка карточки */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="platform-card-title flex items-center gap-2 mb-2">
              <i className="fa-solid fa-shapes text-[var(--accent-primary)]" aria-hidden />
              {t('rooms.allKnowledgeRooms', 'Все комнаты знаний')}
            </div>
            <p className="platform-card-desc" style={{ margin: 0 }}>
              {t(
                'rooms.allKnowledgeRoomsDesc',
                'Здесь собраны все доступные пространства (Комнаты). Выберите интересующую вас тему, чтобы присоединиться к обсуждению.'
              )}
            </p>
          </div>

          {session?.user && (
            <div className="flex-shrink-0">
              <CreateUniverseDialog compact />
            </div>
          )}
        </div>

        {/* Панель поиска и фильтров */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Поле поиска */}
          <div className="relative flex-1 max-w-lg">
            <i
              className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('rooms.searchRoomsPlaceholder', 'Поиск комнаты по названию или описанию...')}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--studio-panel-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-all shadow-sm"
            />
            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 transition-colors cursor-pointer"
                title={t('rooms.resetSearch', 'Сбросить поиск')}
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            )}
          </div>

          {/* Вкладки / Табы */}
          {session?.user && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--studio-panel-bg)] border border-[var(--border-color)] self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'all'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('common.all', 'Все')} ({universes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tracked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'tracked'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <i className="fa-solid fa-bell mr-1 text-[10px]" />
                {t('rooms.following', 'Отслеживаемые')} ({trackedSet.size})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('owned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'owned'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <i className="fa-solid fa-star mr-1 text-[10px]" />
                {t('common.owner', 'Мои')} ({universes.filter((u) => u.ownerId === currentUserId).length})
              </button>
            </div>
          )}
        </div>

        {/* Счетчик результатов */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-6 font-medium">
          <span>
            {t('rooms.roomsFound', 'Найдено')}:{' '}
            <strong className="text-[var(--text-primary)] font-semibold">{filteredUniverses.length}</strong>{' '}
            из {universes.length}
          </span>
          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-rotate-left text-[10px]" />
              {t('rooms.resetSearch', 'Сбросить поиск')}
            </button>
          )}
        </div>

        {/* Рендеринг списков комнат */}
        {filteredUniverses.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--studio-panel-bg)]/40 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center text-2xl mb-4">
              <i className="fa-solid fa-magnifying-glass" />
            </div>
            <h4 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {hasSearch
                ? `${t('rooms.search', 'Ничего не найдено')}: «${searchQuery}»`
                : t('rooms.noRooms', 'Пока нет комнат')}
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mb-5">
              {hasSearch
                ? 'Попробуйте изменить формулировку запроса или проверьте правильность написания названия.'
                : 'Создайте первую комнату знаний на платформе прямо сейчас!'}
            </p>
            {hasSearch ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="platform-btn platform-btn-sm cursor-pointer"
              >
                <i className="fa-solid fa-rotate-left" /> {t('rooms.resetSearch', 'Сбросить поиск')}
              </button>
            ) : session?.user ? (
              <CreateUniverseDialog compact />
            ) : null}
          </div>
        ) : showSeparatedSections ? (
          <div className="flex flex-col gap-10">
            {/* 1. Отдельный список: Отслеживаемые комнаты */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-bell text-[var(--accent-primary)] text-sm" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] m-0">
                  {t('rooms.trackedSection', 'Отслеживаемые комнаты')}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold ml-1">
                  {trackedUniverses.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-5 p-5 rounded-2xl bg-[var(--studio-panel-bg)]/60 border border-[var(--border-color)]">
                {trackedUniverses.map((u) => (
                  <UniverseCard
                    key={u.slug}
                    slug={u.slug}
                    name={u.name}
                    description={u.description}
                    icon={u.icon}
                    sphereColor={u.sphereColor}
                  />
                ))}
              </div>
            </div>

            {/* 2. Отдельный список: Все остальные комнаты */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <i className="fa-solid fa-shapes text-[var(--text-muted)] text-sm" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] m-0">
                  {t('rooms.allRoomsSection', 'Все комнаты')}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-muted)] font-semibold ml-1">
                  {universes.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-5">
                {universes.map((u) => (
                  <UniverseCard
                    key={u.slug}
                    slug={u.slug}
                    name={u.name}
                    description={u.description}
                    icon={u.icon}
                    sphereColor={u.sphereColor}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
            {filteredUniverses.map((u) => (
              <UniverseCard
                key={u.slug}
                slug={u.slug}
                name={u.name}
                description={u.description}
                icon={u.icon}
                sphereColor={u.sphereColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
