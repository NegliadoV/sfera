import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapNodes, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** POST /api/universes/[slug]/mind-maps/[mapId]/edges — добавить связь */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; mapId: string }> }
) {
  const { slug, mapId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    const fromNodeId = typeof body?.fromNodeId === 'string' ? body.fromNodeId : '';
    const toNodeId = typeof body?.toNodeId === 'string' ? body.toNodeId : '';
    if (!fromNodeId || !toNodeId) {
      return NextResponse.json({ error: 'fromNodeId and toNodeId required' }, { status: 400 });
    }
    if (fromNodeId === toNodeId) {
      return NextResponse.json({ error: 'from and to must differ' }, { status: 400 });
    }

    const [fromNode, toNode] = await Promise.all([
      db.select().from(mindMapNodes).where(and(eq(mindMapNodes.id, fromNodeId), eq(mindMapNodes.mindMapId, map.id))).limit(1),
      db.select().from(mindMapNodes).where(and(eq(mindMapNodes.id, toNodeId), eq(mindMapNodes.mindMapId, map.id))).limit(1),
    ]);
    if (!fromNode[0] || !toNode[0]) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const [edge] = await db
      .insert(mindMapEdges)
      .values({
        mindMapId: map.id,
        fromNodeId,
        toNodeId,
        createdById: session.user.id,
      })
      .returning();

    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json(edge);
  } catch (e) {
    console.error('POST mind-maps edges', e);
    return NextResponse.json({ error: 'Failed to create edge' }, { status: 500 });
  }
}
