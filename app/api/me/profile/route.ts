import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, user, comments, content, universes, universeMembers, universeTracking, notifications } from '@/lib/db';
import { eq, desc, and, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const RECENT_COMMENTS_LIMIT = 10;

export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Владелец
    const ownedUniverses = await db
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

    // Участник
    const memberUniverses = await db
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

    // Отслеживаемые
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
      ...ownedUniverses.map((x) => x.slug),
      ...memberUniverses.map((x) => x.slug),
    ]);

    const trackedUniverses = tracked
      .filter((u) => !ownedOrMemberSlugs.has(u.slug))
      .map(({ universeId: _id, ...u }) => ({
        ...u,
        unreadCount: unreadByUniverseId.get(u.slug) ?? 0,
      }));

    // Последние комментарии
    const recentComments = await db
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

    return NextResponse.json({
      ownedUniverses,
      memberUniverses,
      trackedUniverses,
      recentComments,
    });
  } catch (error: any) {
    console.error('Error fetching profile data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
