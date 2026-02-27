import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, content, universes, universeMembers, universeTracking } from '@/lib/db';
import { eq, and, desc, inArray, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Контент за последние 24 часа в сферах, где пользователь владелец/участник или отслеживает */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // ID сфер: владелец, участник, отслеживаемые
    const owned = await db
      .select({ universeId: universes.id })
      .from(universes)
      .where(eq(universes.ownerId, userId));
    const member = await db
      .select({ universeId: universeMembers.universeId })
      .from(universeMembers)
      .where(eq(universeMembers.userId, userId));
    const tracked = await db
      .select({ universeId: universeTracking.universeId })
      .from(universeTracking)
      .where(eq(universeTracking.userId, userId));

    const universeIds = [
      ...new Set([
        ...owned.map((r) => r.universeId),
        ...member.map((r) => r.universeId),
        ...tracked.map((r) => r.universeId),
      ]),
    ];

    if (universeIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        byUniverse: {},
      });
    }

    const items = await db
      .select({
        id: content.id,
        title: content.title,
        universeId: content.universeId,
        universeSlug: universes.slug,
        universeName: universes.name,
        publishedAt: content.publishedAt,
        createdAt: content.createdAt,
      })
      .from(content)
      .innerJoin(universes, eq(content.universeId, universes.id))
      .where(
        and(
          inArray(content.universeId, universeIds),
          gte(content.createdAt, since)
        )
      )
      .orderBy(desc(content.createdAt))
      .limit(50);

    const byUniverse: Record<string, { name: string; slug: string; count: number }> = {};
    for (const item of items) {
      const key = item.universeId;
      if (!byUniverse[key]) {
        byUniverse[key] = { name: item.universeName, slug: item.universeSlug, count: 0 };
      }
      byUniverse[key].count += 1;
    }

    return NextResponse.json({
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        universeSlug: i.universeSlug,
        universeName: i.universeName,
        publishedAt: i.publishedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
      total: items.length,
      byUniverse: Object.values(byUniverse),
    });
  } catch (e) {
    console.error('GET /api/me/digest', e);
    return NextResponse.json({ error: 'Failed to load digest' }, { status: 500 });
  }
}
