import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapNodes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; mapId: string; nodeId: string }> }
) {
  const { slug, mapId, nodeId } = await params;
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
    const position =
      body?.position && typeof body.position.x === 'number' && typeof body.position.y === 'number'
        ? { x: body.position.x, y: body.position.y }
        : null;

    if (!position) return NextResponse.json({ error: 'Position required' }, { status: 400 });

    const [updated] = await db
      .update(mindMapNodes)
      .set({ position })
      .where(and(eq(mindMapNodes.id, nodeId), eq(mindMapNodes.mindMapId, map.id)))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH mind-maps nodes', e);
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}
