import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, universeMembers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { aggregateUniverseSync } from '@/lib/aggregator/functions';
import { normalizeUniverseSlug } from '@/lib/universe-slug';

export const dynamic = 'force-dynamic';

export const maxDuration = 60; // Агрегация может занять до минуты (RSS, сеть)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rawSlug = (await params).slug;
  const slug = normalizeUniverseSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
  }
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Получаем вселенную
    const [universe] = await db
      .select()
      .from(universes)
      .where(eq(universes.slug, slug))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    // Проверяем права (только владелец или модератор)
    const [membership] = await db
      .select()
      .from(universeMembers)
      .where(
        and(
          eq(universeMembers.universeId, universe.id),
          eq(universeMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!membership && universe.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (membership && membership.role === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Запускаем агрегацию синхронно — посты появятся сразу, воркер не нужен
    const result = await aggregateUniverseSync(universe.id);
    return NextResponse.json({
      message: 'Aggregation completed',
      processed: result.processed,
    });
  } catch (e) {
    console.error('POST /api/universes/[slug]/aggregate', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Failed to start aggregation: ${errorMsg}` }, { status: 500 });
  }
}
