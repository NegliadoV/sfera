import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db, user, comments, content, universes, universeMembers, universeTracking, notifications } from '@/lib/db';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { CabinetUniverseItem } from '@/components/universe/CabinetUniverseItem';
import { CabinetTrackedUniverseItem } from '@/components/universe/CabinetTrackedUniverseItem';
import { DigestPreview } from '@/components/DigestPreview';
import { LogoutButton } from '@/components/LogoutButton';
import { EditableAvatar } from '@/components/profile/EditableAvatar';

export const metadata = {
  title: 'Личный кабинет | Roominate',
  description: 'Ваш профиль, вселенные и активность.',
};

export const dynamic = 'force-dynamic';

const RECENT_COMMENTS_LIMIT = 10;

export default async function MePage(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  if (props.searchParams) await props.searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/me');
  }

  const userId = session.user.id;

  let userTagRow: { userTag: string | null } | null = null;
  try {
    const [row] = await db.select({ userTag: user.userTag }).from(user).where(eq(user.id, userId)).limit(1);
    userTagRow = row ?? null;
  } catch {
    // ignore
  }

  let myOwnedUniversesRows: Array<{ slug: string; name: string; description: string | null; icon: string | null; sphereColor: string | null; updatedAt: Date }> = [];
  let myMemberUniversesRows: Array<{ slug: string; name: string; description: string | null; icon: string | null; sphereColor: string | null; updatedAt: Date }> = [];
  let myTrackedUniversesRows: Array<{ slug: string; name: string; description: string | null; icon: string | null; sphereColor: string | null; updatedAt: Date; unreadCount: number }> = [];
  let recentCommentsRows: Array<{ commentId: string; commentBody: string; commentType: string; commentCreatedAt: Date; contentId: string; contentTitle: string; universeSlug: string; universeName: string }> = [];

  try {
    // Вселенные, которыми пользователь владеет
    try {
      myOwnedUniversesRows = await db
        .select({
          slug: universes.slug,
          name: universes.name,
          description: universes.description,
          icon: universes.icon,
          sphereColor: universes.sphereColor,
          updatedAt: universes.updatedAt,
        })
        .from(universes)
        .where(eq(universes.ownerId, userId))
        .orderBy(desc(universes.updatedAt));
    } catch {
      // DB unavailable or error
    }

    // Вселенные, в которых пользователь состоит как участник
    try {
      myMemberUniversesRows = await db
        .select({
          slug: universes.slug,
          name: universes.name,
          description: universes.description,
          icon: universes.icon,
          sphereColor: universes.sphereColor,
          updatedAt: universes.updatedAt,
        })
        .from(universeMembers)
        .innerJoin(universes, eq(universeMembers.universeId, universes.id))
        .where(eq(universeMembers.userId, userId))
        .orderBy(desc(universes.updatedAt));
    } catch {
      // DB unavailable or error
    }

    // Отслеживаемые сферы (universe_tracking)
    try {
      const tracked = await db
        .select({
          slug: universes.slug,
          name: universes.name,
          description: universes.description,
          icon: universes.icon,
          sphereColor: universes.sphereColor,
          updatedAt: universes.updatedAt,
          universeId: universes.id,
        })
        .from(universeTracking)
        .innerJoin(universes, eq(universeTracking.universeId, universes.id))
        .where(eq(universeTracking.userId, userId))
        .orderBy(desc(universes.updatedAt));
      // Unread count per universe (notifications where readAt is null)
      const unreadByUniverseId = new Map<string, number>();
      for (const u of tracked) {
        const unreadRows = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.universeId, u.universeId),
              isNull(notifications.readAt)
            )
          );
        unreadByUniverseId.set(u.slug, unreadRows.length);
      }
      const ownedOrMemberSlugs = new Set([
        ...myOwnedUniversesRows.map((x) => x.slug),
        ...myMemberUniversesRows.map((x) => x.slug),
      ]);
      myTrackedUniversesRows = tracked
        .filter((u) => !ownedOrMemberSlugs.has(u.slug))
        .map(({ universeId: _id, ...u }) => ({
          ...u,
          unreadCount: unreadByUniverseId.get(u.slug) ?? 0,
        }));
    } catch {
      // DB unavailable or error
    }

    // Комментарии пользователя
    try {
      recentCommentsRows = await db
        .select({
          commentId: comments.id,
          commentBody: comments.body,
          commentType: comments.type,
          commentCreatedAt: comments.createdAt,
          contentId: content.id,
          contentTitle: content.title,
          universeSlug: universes.slug,
          universeName: universes.name,
        })
        .from(comments)
        .innerJoin(content, eq(comments.contentId, content.id))
        .innerJoin(universes, eq(content.universeId, universes.id))
        .where(eq(comments.authorId, userId))
        .orderBy(desc(comments.createdAt))
        .limit(RECENT_COMMENTS_LIMIT);
    } catch {
      // DB unavailable or error
    }
  } catch {
    // General error handling
  }

  const displayName = session.user.name ?? session.user.email ?? 'Участник';
  const initials = displayName
    .trim()
    .slice(0, 2)
    .toUpperCase()
    .replace(/\s/g, '') || displayName.slice(0, 2).toUpperCase();
  const displayEmail = session.user.email
    ? session.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : null;

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">
          <i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> Roominate
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Личный кабинет</span>
      </div>
      <div className="platform-card platform-card--cabinet mb-8">
        <div className="platform-card-title cabinet-page-title">
          <i className="fa-solid fa-user" aria-hidden />
          Личный кабинет
          <span className="platform-tag" style={{ marginLeft: 'auto' }}>Профиль</span>
        </div>
        <p className="platform-card-desc cabinet-page-desc">
          Ваш профиль, вселенные и активность.
        </p>

        <div className="cabinet-main-content">
          {/* Левая колонка: профиль + мои вселенные */}
          <div className="cabinet-left-column">
            <div className="cabinet-profile-card">
              <div className="cabinet-profile-header">
                <EditableAvatar currentImage={session.user.image} initials={initials} />
                <div className="cabinet-name-email">
                  <h2>{displayName}</h2>
                  {userTagRow?.userTag && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      @{userTagRow.userTag}
                    </div>
                  )}
                  {displayEmail && (
                    <div className="email">
                      <i className="fa-regular fa-envelope" aria-hidden /> {displayEmail}
                    </div>
                  )}
                  {!userTagRow?.userTag && (
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                      <Link href="/settings" style={{ color: 'var(--accent-primary-muted)', textDecoration: 'underline' }}>
                        Задайте тег, чтобы вас могли найти
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="cabinet-profile-actions">
                <Link href="/messages" className="cabinet-action-btn">
                  <i className="fa-regular fa-message" aria-hidden /> Сообщения
                </Link>
                <Link href="/" className="cabinet-action-btn">
                  <i className="fa-regular fa-address-book" aria-hidden /> Контакты
                </Link>
                <Link href="/settings" className="cabinet-action-btn">
                  <i className="fas fa-gear" aria-hidden /> Настройки
                </Link>
                <Link href="/digest" className="cabinet-action-btn">
                  <i className="fa-regular fa-calendar" aria-hidden /> Дайджест
                </Link>
                <LogoutButton />
              </div>
            </div>

            <div className="cabinet-section">
              <div className="cabinet-section-title">
                <i className="fa-regular fa-star" aria-hidden /> Мои сферы
              </div>
              
              {/* Сферы, которыми пользователь владеет */}
              {myOwnedUniversesRows.length > 0 && (
                <>
                  <div className="cabinet-subsection-label">Владелец</div>
                  <div className="cabinet-universe-list cabinet-subsection-list">
                    {myOwnedUniversesRows.map((u) => (
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

              {/* Вселенные, в которых пользователь состоит как участник */}
              {myMemberUniversesRows.length > 0 && (
                <>
                  {myOwnedUniversesRows.length > 0 && (
                    <div className="cabinet-subsection-label">Участник</div>
                  )}
                  <div className={`cabinet-universe-list ${myOwnedUniversesRows.length > 0 ? 'cabinet-subsection-list' : ''}`}>
                    {myMemberUniversesRows.map((u) => (
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

              {/* Отслеживаемые сферы */}
              {myTrackedUniversesRows.length > 0 && (
                <>
                  {(myOwnedUniversesRows.length > 0 || myMemberUniversesRows.length > 0) && (
                    <div className="cabinet-subsection-label">Отслеживаю</div>
                  )}
                  <div className={`cabinet-universe-list ${myOwnedUniversesRows.length > 0 || myMemberUniversesRows.length > 0 ? 'cabinet-subsection-list' : ''}`}>
                    {myTrackedUniversesRows.map((u) => (
                      <CabinetTrackedUniverseItem
                        key={u.slug}
                        slug={u.slug}
                        name={u.name}
                        description={u.description}
                        sphereColor={u.sphereColor}
                        updatedAt={u.updatedAt}
                        unreadCount={u.unreadCount}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Сообщение, если нет сфер */}
              {myOwnedUniversesRows.length === 0 && myMemberUniversesRows.length === 0 && myTrackedUniversesRows.length === 0 && (
                <div className="cabinet-universe-list">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Вы пока не состоите ни в одной сфере.{' '}
                    <Link href="/" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                      Выбрать или создать
                    </Link>
                  </p>
                </div>
              )}
              <div className="cabinet-create-actions">
                <Link href="/" className="cabinet-create-universe">
                  <i className="fa-regular fa-plus" aria-hidden /> Создать сферу
                </Link>
                <Link href="/" className="cabinet-create-universe">
                  <i className="fa-regular fa-bell" aria-hidden /> Отслеживать сферу
                </Link>
              </div>
            </div>
          </div>

          {/* Правая колонка: дайджест + комментарии */}
          <div className="cabinet-right-column">
            <div className="cabinet-digest-card">
              <div className="cabinet-digest-header">
                <h3>
                  <i className="fa-regular fa-newspaper" aria-hidden /> Дайджест
                </h3>
                <span className="cabinet-badge-new">новое</span>
              </div>
              <DigestPreview />
            </div>

            <div className="cabinet-comments-card">
              <div className="cabinet-section-title">
                <i className="fa-regular fa-comment" aria-hidden /> Последние комментарии
              </div>
              {recentCommentsRows.length === 0 ? (
                <>
                  <div className="cabinet-empty-comments">
                    <i className="fa-regular fa-message-smile" aria-hidden />
                    <p>
                      Пока нет комментариев. Участвуйте в обсуждениях материалов во{' '}
                      <span className="cabinet-highlight">вселенных</span>.
                    </p>
                  </div>
                  <Link href="/" className="cabinet-quick-link">
                    <i className="fa-regular fa-compass" aria-hidden /> Перейти к обсуждениям
                  </Link>
                </>
              ) : (
                <ul className="list-none p-0 m-0 space-y-3">
                  {recentCommentsRows.map((row) => (
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
                        {new Date(row.commentCreatedAt).toLocaleString('ru')}
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
