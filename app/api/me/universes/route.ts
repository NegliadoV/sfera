import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeTracking } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Возвращает только сферы, которые пользователь отслеживает или владеет ими */
export async function GET(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const owned = await db
      .select({ id: universes.id, slug: universes.slug, name: universes.name })
      .from(universes)
      .where(eq(universes.ownerId, session.user.id))
      .orderBy(desc(universes.updatedAt));

    const trackedRows = await db
      .select({ id: universes.id, slug: universes.slug, name: universes.name })
      .from(universeTracking)
      .innerJoin(universes, eq(universeTracking.universeId, universes.id))
      .where(eq(universeTracking.userId, session.user.id))
      .orderBy(desc(universes.updatedAt));

    const seen = new Set<string>();
    const result: Array<{ id: string; slug: string; name: string }> = [];
    for (const u of owned) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push(u);
      }
    }
    for (const u of trackedRows) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        result.push(u);
      }
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/me/universes', e);
    return NextResponse.json({ error: 'Failed to load universes' }, { status: 500 });
  }
}
