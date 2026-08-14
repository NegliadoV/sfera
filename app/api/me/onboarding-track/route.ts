import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, universes, universeTracking } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * POST /api/me/onboarding-track
 * Подписывает пользователя на выбранные сферы при онбординге.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slugs } = await req.json().catch(() => ({ slugs: [] }));
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ ok: true, tracked: 0 });
  }

  const validSlugs = slugs.filter((s: unknown) => typeof s === 'string').slice(0, 20);

  try {
    // Получаем id сфер по slug-ам
    const found = await db
      .select({ id: universes.id, slug: universes.slug })
      .from(universes)
      .where(inArray(universes.slug, validSlugs));

    if (found.length === 0) return NextResponse.json({ ok: true, tracked: 0 });

    // INSERT OR IGNORE — если уже отслеживает, не падаем
    await db
      .insert(universeTracking)
      .values(found.map(u => ({ universeId: u.id, userId: session.user.id })))
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, tracked: found.length });
  } catch (e) {
    console.error('[onboarding-track]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
