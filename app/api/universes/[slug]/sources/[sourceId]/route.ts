import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, sources, universes, universeMembers, content } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; sourceId: string }> }
) {
  const { slug, sourceId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enabled, name, url, config } = body as {
      enabled?: boolean;
      name?: string;
      url?: string;
      config?: Record<string, unknown>;
    };

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

    // Проверяем, что источник принадлежит вселенной
    const [source] = await db
      .select()
      .from(sources)
      .where(and(eq(sources.id, sourceId), eq(sources.universeId, universe.id)))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Обновляем источник
    const updateData: {
      enabled?: boolean;
      name?: string;
      url?: string | null;
      config?: Record<string, unknown> | null;
    } = {};

    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) updateData.url = url?.trim() || null;
    if (config !== undefined) updateData.config = config || null;

    const [updated] = await db
      .update(sources)
      .set(updateData)
      .where(eq(sources.id, sourceId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH /api/universes/[slug]/sources/[sourceId]', e);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; sourceId: string }> }
) {
  const { slug, sourceId } = await params;
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

    // Удалять источник может только владелец сферы
    if (universe.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Только владелец сферы может удалить источник' }, { status: 403 });
    }

    const [source] = await db
      .select()
      .from(sources)
      .where(and(eq(sources.id, sourceId), eq(sources.universeId, universe.id)))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Удаляем контент из этого источника (чтобы при пересоздании источника не было дубликатов по URL)
    await db.delete(content).where(eq(content.sourceId, sourceId));

    // Удаляем источник
    await db.delete(sources).where(eq(sources.id, sourceId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/universes/[slug]/sources/[sourceId]', e);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
