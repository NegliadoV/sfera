import { NextResponse } from 'next/server';
import { db, mindMapNodes, mindMapEdges, mindMaps } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionForServerComponent } from '@/lib/session';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionForServerComponent();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mapId = (await params).id;
    const { nodes, edges } = await req.json();

    // Verify ownership
    const [map] = await db.select().from(mindMaps).where(and(eq(mindMaps.id, mapId), eq(mindMaps.createdById, session.user.id)));
    if (!map) return NextResponse.json({ error: 'Not found or not your map' }, { status: 404 });

    await db.transaction(async (tx) => {
      // Very naive full sync: delete all and re-insert 
      // Safe enough for personal mind maps edited by 1 user
      await tx.delete(mindMapEdges).where(eq(mindMapEdges.mindMapId, mapId));
      await tx.delete(mindMapNodes).where(eq(mindMapNodes.mindMapId, mapId));

      if (nodes && nodes.length > 0) {
        await tx.insert(mindMapNodes).values(
          nodes.map((n: any) => ({
            id: n.id,
            mindMapId: mapId,
            type: n.type === 'post' || n.type === 'thesis' ? 'thesis' : 'source',
            label: n.data?.label || '',
            contentId: n.data?.contentId || null,
            position: n.position,
            data: n.data, // JSONB column
            createdById: session.user.id,
          }))
        );
      }
      
      if (edges && edges.length > 0) {
        await tx.insert(mindMapEdges).values(
          edges.map((e: any) => ({
            id: e.id,
            mindMapId: mapId,
            fromNodeId: e.source,
            toNodeId: e.target,
            createdById: session.user.id
          }))
        );
      }
      
      // Update map updatedAt
      await tx.update(mindMaps).set({ updatedAt: new Date() }).where(eq(mindMaps.id, mapId));
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT /api/me/mind-maps/[id]/sync', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
