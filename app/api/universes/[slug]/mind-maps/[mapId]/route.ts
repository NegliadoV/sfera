import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapNodes, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; mapId: string }> }
) {
  const { slug, mapId } = await params;
  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
    if (!u) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const [map] = await db
      .select()
      .from(mindMaps)
      .where(and(eq(mindMaps.id, mapId), eq(mindMaps.universeId, u.id)))
      .limit(1);
    if (!map) return NextResponse.json({ error: 'Mind map not found' }, { status: 404 });

    const [nodes, edges] = await Promise.all([
      db.select().from(mindMapNodes).where(eq(mindMapNodes.mindMapId, map.id)),
      db.select().from(mindMapEdges).where(eq(mindMapEdges.mindMapId, map.id)),
    ]);

    return NextResponse.json({
      ...map,
      nodes: nodes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        position: n.position as { x: number; y: number } | null,
      })),
      edges: edges.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('GET mind-maps/[mapId]', e);
    return NextResponse.json({ error: 'Failed to load mind map' }, { status: 500 });
  }
}

export async function PATCH(
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
    if (map.createdById !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : undefined;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const [updated] = await db
      .update(mindMaps)
      .set({ title, updatedAt: new Date() })
      .where(eq(mindMaps.id, map.id))
      .returning();
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH mind-maps/[mapId]', e);
    return NextResponse.json({ error: 'Failed to update mind map' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
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
    if (map.createdById !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.delete(mindMaps).where(eq(mindMaps.id, map.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE mind-maps/[mapId]', e);
    return NextResponse.json({ error: 'Failed to delete mind map' }, { status: 500 });
  }
}
