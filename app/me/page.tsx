import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db, user, comments, content, universes, universeMembers, universeTracking, notifications } from '@/lib/db';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { CabinetPageClient } from './CabinetPageClient';

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
    <CabinetPageClient
      displayName={displayName}
      initials={initials}
      displayEmail={displayEmail}
      userImage={session.user.image}
      userTag={userTagRow?.userTag}
      ownedUniverses={myOwnedUniversesRows}
      memberUniverses={myMemberUniversesRows}
      trackedUniverses={myTrackedUniversesRows}
      recentComments={recentCommentsRows}
    />
  );
}
