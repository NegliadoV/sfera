import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, sources, universeMembers, content } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { fetchSourceDataSync, fetchSourceItemsSync, clearDuplicateContentByUrls } from '@/lib/aggregator/functions';
import { normalizeUniverseSlug } from '@/lib/universe-slug';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; sourceId: string }> }
) {
  const { slug: rawSlug, sourceId } = await params;
  const slug = normalizeUniverseSlug(rawSlug);
  if (!slug) {
    return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [universe] = await db
      .select()
      .from(universes)
      .where(eq(universes.slug, slug))
      .limit(1);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    const [sourceRow] = await db
      .select()
      .from(sources)
      .where(and(eq(sources.id, sourceId), eq(sources.universeId, universe.id)))
      .limit(1);

    if (!sourceRow) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Владелец или модератор
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

    // Очистить посты источника перед агрегацией (чтобы пересобрать без дубликатов)
    const body = await req.json().catch(() => ({}));
    const clearFirst = body?.clearFirst === true;
    if (clearFirst) {
      await db.delete(content).where(eq(content.sourceId, sourceId));
      const items = await fetchSourceItemsSync(sourceId);
      const urls = items.map((i) => i.url).filter((u): u is string => !!u);
      await clearDuplicateContentByUrls(universe.id, urls);
    }

    const result = await fetchSourceDataSync(sourceId, universe.id);
    return NextResponse.json({
      message: 'Aggregation completed',
      processed: result.itemsProcessed,
    });
  } catch (e) {
    console.error('POST /api/universes/[slug]/sources/[sourceId]/aggregate', e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
