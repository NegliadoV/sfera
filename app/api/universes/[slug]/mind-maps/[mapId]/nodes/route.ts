import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapNodes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const NODE_TYPES = ['source', 'thesis', 'discussion'] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; mapId: string }> }
) {
  const { slug, mapId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [map] = await db
      .select()
      .from(mindMaps)
      .where(and(eq(mindMaps.id, mapId), eq(mindMaps.universeId, u.id)))
      .limit(1);
    if (!map) return NextResponse.json({ error: 'Mind map not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === 'string' ? body.label.trim() : '';
    const type = body?.type && NODE_TYPES.includes(body.type) ? body.type : 'thesis';
    const contentId = typeof body?.contentId === 'string' ? body.contentId : null;
    const commentId = typeof body?.commentId === 'string' ? body.commentId : null;
    const position =
      body?.position && typeof body.position.x === 'number' && typeof body.position.y === 'number'
        ? { x: body.position.x, y: body.position.y }
        : null;

    if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 });

    const [node] = await db
      .insert(mindMapNodes)
      .values({
        mindMapId: map.id,
        type,
        label,
        contentId,
        commentId,
        position,
        createdById: session.user.id,
      })
      .returning();

    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json(node);
  } catch (e) {
    console.error('POST mind-maps nodes', e);
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }
}
