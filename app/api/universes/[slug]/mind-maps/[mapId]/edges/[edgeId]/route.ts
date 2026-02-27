import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** DELETE /api/universes/[slug]/mind-maps/[mapId]/edges/[edgeId] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; mapId: string; edgeId: string }> }
) {
  const { slug, mapId, edgeId } = await params;
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

    const [edge] = await db
      .select()
      .from(mindMapEdges)
      .where(and(eq(mindMapEdges.id, edgeId), eq(mindMapEdges.mindMapId, map.id)))
      .limit(1);
    if (!edge) return NextResponse.json({ error: 'Edge not found' }, { status: 404 });

    await db.delete(mindMapEdges).where(eq(mindMapEdges.id, edge.id));
    await db.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, map.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE mind-maps edge', e);
    return NextResponse.json({ error: 'Failed to delete edge' }, { status: 500 });
  }
}
