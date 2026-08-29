'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/i18n/LanguageProvider';
import { EditableAvatar } from '@/components/profile/EditableAvatar';
import { LogoutButton } from '@/components/LogoutButton';
import { DigestPreview } from '@/components/DigestPreview';
import { CabinetUniverseItem } from '@/components/universe/CabinetUniverseItem';
import { CabinetTrackedUniverseItem } from '@/components/universe/CabinetTrackedUniverseItem';

type UniverseRow = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sphereColor: string | null;
  updatedAt: Date;
};

type TrackedUniverseRow = UniverseRow & { unreadCount: number };

type CommentRow = {
  commentId: string;
  commentBody: string;
  commentType: string;
  commentCreatedAt: Date;
  contentId: string;
  contentTitle: string;
  universeSlug: string;
  universeName: string;
};

interface CabinetPageClientProps {
  displayName: string;
  initials: string;
  displayEmail: string | null;
  userImage: string | null | undefined;
  userTag: string | null | undefined;
  ownedUniverses: UniverseRow[];
  memberUniverses: UniverseRow[];
  trackedUniverses: TrackedUniverseRow[];
  recentComments: CommentRow[];
}

export function CabinetPageClient({
  displayName,
  initials,
  displayEmail,
  userImage,
  userTag,
  ownedUniverses,
  memberUniverses,
  trackedUniverses,
  recentComments,
}: CabinetPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{t('nav.cabinet', 'Личный кабинет')}</span>
      </div>

      <div className="platform-card platform-card--cabinet mb-8">
        <div className="platform-card-title cabinet-page-title">
          <i className="fa-solid fa-user" aria-hidden />
          {t('nav.cabinet', 'Личный кабинет')}
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>
            {t('common.profile', 'Профиль')}
          </span>
        </div>
        <p className="platform-card-desc cabinet-page-desc">
          {t('common.profileDesc', 'Ваш профиль, вселенные и активность.')}
        </p>

        <div className="cabinet-main-content">
          {/* Left column */}
          <div className="cabinet-left-column">
            <div className="cabinet-profile-card">
              <div className="cabinet-profile-header">
                <EditableAvatar currentImage={userImage} initials={initials} />
                <div className="cabinet-name-email">
                  <h2>{displayName}</h2>
                  {userTag && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      @{userTag}
                    </div>
                  )}
                  {displayEmail && (
                    <div className="email">
                      <i className="fa-regular fa-envelope" aria-hidden /> {displayEmail}
                    </div>
                  )}
                  {!userTag && (
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                      <Link href="/settings" style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}>
                        {t('settings.setTag', 'Задайте тег, чтобы вас могли найти')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="cabinet-profile-actions">
                <Link href="/messages" className="cabinet-action-btn">
                  <i className="fa-regular fa-message" aria-hidden /> {t('nav.messages', 'Сообщения')}
                </Link>
                <Link href="/" className="cabinet-action-btn">
                  <i className="fa-regular fa-address-book" aria-hidden /> {t('nav.contacts', 'Контакты')}
                </Link>
                <Link href="/settings" className="cabinet-action-btn">
                  <i className="fas fa-gear" aria-hidden /> {t('nav.settings', 'Настройки')}
                </Link>
                <Link href="/digest" className="cabinet-action-btn">
                  <i className="fa-regular fa-calendar" aria-hidden /> {t('nav.digest', 'Дайджест')}
                </Link>
                <LogoutButton />
              </div>
            </div>

            {/* My Spheres */}
            <div className="cabinet-section">
              <div className="cabinet-section-title">
                <i className="fa-regular fa-star" aria-hidden /> {t('rooms.mySpheres', 'Мои сферы')}
              </div>

              {ownedUniverses.length > 0 && (
                <>
                  <div className="cabinet-subsection-label">{t('common.owner', 'Владелец')}</div>
                  <div className="cabinet-universe-list cabinet-subsection-list">
                    {ownedUniverses.map((u) => (
                      <CabinetUniverseItem
                        key={u.slug}
                        slug={u.slug}
                        name={u.name}
                        description={u.description}
                        icon={u.icon}
                        sphereColor={u.sphereColor}
                        updatedAt={u.updatedAt}
                        isOwner={true}
                        showDelete={true}
                      />
                    ))}
                  </div>
                </>
              )}

              {memberUniverses.length > 0 && (
                <>
                  {ownedUniverses.length > 0 && (
                    <div className="cabinet-subsection-label">{t('common.member', 'Участник')}</div>
                  )}
                  <div className={`cabinet-universe-list ${ownedUniverses.length > 0 ? 'cabinet-subsection-list' : ''}`}>
                    {memberUniverses.map((u) => (
                      <CabinetUniverseItem
                        key={u.slug}
                        slug={u.slug}
                        name={u.name}
                        description={u.description}
                        icon={u.icon}
                        sphereColor={u.sphereColor}
                        updatedAt={u.updatedAt}
                        isOwner={false}
                        showDelete={false}
                      />
                    ))}
                  </div>
                </>
              )}

              {trackedUniverses.length > 0 && (
                <>
                  {(ownedUniverses.length > 0 || memberUniverses.length > 0) && (
                    <div className="cabinet-subsection-label">{t('common.tracking', 'Отслеживаю')}</div>
                  )}
                  <div className={`cabinet-universe-list ${ownedUniverses.length > 0 || memberUniverses.length > 0 ? 'cabinet-subsection-list' : ''}`}>
                    {trackedUniverses.map((u) => (
                      <CabinetTrackedUniverseItem
                        key={u.slug}
                        slug={u.slug}
                        name={u.name}
                        description={u.description}
                        icon={u.icon}
                        sphereColor={u.sphereColor}
                        updatedAt={u.updatedAt}
                        unreadCount={u.unreadCount}
                      />
                    ))}
                  </div>
                </>
              )}

              {ownedUniverses.length === 0 && memberUniverses.length === 0 && trackedUniverses.length === 0 && (
                <div className="cabinet-universe-list">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {t('rooms.noSpheres', 'Вы пока не состоите ни в одной сфере.')}{' '}
                    <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      {t('rooms.chooseOrCreate', 'Выбрать или создать')}
                    </Link>
                  </p>
                </div>
              )}

              <div className="cabinet-create-actions">
                <Link href="/" className="cabinet-create-universe">
                  <i className="fa-regular fa-plus" aria-hidden /> {t('rooms.createSphere', 'Создать сферу')}
                </Link>
                <Link href="/" className="cabinet-create-universe">
                  <i className="fa-regular fa-bell" aria-hidden /> {t('rooms.trackSphere', 'Отслеживать сферу')}
                </Link>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="cabinet-right-column">
            <div className="cabinet-digest-card">
              <div className="cabinet-digest-header">
                <h3>
                  <i className="fa-regular fa-newspaper" aria-hidden /> {t('nav.digest', 'Дайджест')}
                </h3>
                <span className="cabinet-badge-new">{t('common.new', 'новое')}</span>
              </div>
              <DigestPreview />
            </div>

            <div className="cabinet-comments-card">
              <div className="cabinet-section-title">
                <i className="fa-regular fa-comment" aria-hidden /> {t('common.recentComments', 'Последние комментарии')}
              </div>
              {recentComments.length === 0 ? (
                <>
                  <div className="cabinet-empty-comments">
                    <i className="fa-regular fa-message-smile" aria-hidden />
                    <p>
                      {t('common.noComments', 'Пока нет комментариев. Участвуйте в обсуждениях материалов во')}{' '}
                      <span className="cabinet-highlight">{t('common.spheres', 'вселенных')}</span>.
                    </p>
                  </div>
                  <Link href="/" className="cabinet-quick-link">
                    <i className="fa-regular fa-compass" aria-hidden /> {t('common.goToDiscussions', 'Перейти к обсуждениям')}
                  </Link>
                </>
              ) : (
                <ul className="list-none p-0 m-0 space-y-3">
                  {recentComments.map((row) => (
                    <li key={row.commentId} className="cabinet-comment-item">
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 6 }}>
                        {row.commentBody.slice(0, 200)}
                        {row.commentBody.length > 200 ? '…' : ''}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <Link
                          href={`/universes/${encodeURIComponent(row.universeSlug)}/content/${row.contentId}`}
                          style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}
                        >
                          {row.contentTitle}
                        </Link>
                        {' · '}
                        {row.universeName}
                        {' · '}
                        {new Date(row.commentCreatedAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
