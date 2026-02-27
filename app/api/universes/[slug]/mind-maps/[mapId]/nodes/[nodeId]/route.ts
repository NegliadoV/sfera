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

    const [node] = await db
      .select()
      .from(mindMapNodes)
      .where(and(eq(mindMapNodes.id, nodeId), eq(mindMapNodes.mindMapId, map.id)))
      .limit(1);
    if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const updates: { label?: string; position?: { x: number; y: number } } = {};
    if (typeof body?.label === 'string' && body.label.trim()) updates.label = body.label.trim();
    if (body?.position && typeof body.position.x === 'number' && typeof body.position.y === 'number') {
      updates.position = { x: body.position.x, y: body.position.y };
    }
    if (Object.keys(updates).length === 0) return NextResponse.json(node);

    const [updated] = await db
      .update(mindMapNodes)
      .set(updates)
      .where(eq(mindMapNodes.id, node.id))
      .returning();
    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH mind-maps node', e);
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
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

    const [node] = await db
      .select()
      .from(mindMapNodes)
      .where(and(eq(mindMapNodes.id, nodeId), eq(mindMapNodes.mindMapId, map.id)))
      .limit(1);
    if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    await db.delete(mindMapNodes).where(eq(mindMapNodes.id, node.id));
    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE mind-maps node', e);
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }
}
