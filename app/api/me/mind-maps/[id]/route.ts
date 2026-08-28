import { NextRequest, NextResponse } from 'next/server';
import { getSessionForServerComponent } from '@/lib/session';
import { db, mindMaps, mindMapNodes, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionForServerComponent();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const [existing] = await db
      .select({ id: mindMaps.id })
      .from(mindMaps)
      .where(and(eq(mindMaps.id, id), eq(mindMaps.createdById, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: 'Карта не найдена или доступ запрещен' }, { status: 404 });
    }

    // Cascade delete nodes and edges first
    await db.delete(mindMapNodes).where(eq(mindMapNodes.mindMapId, id));
    await db.delete(mindMapEdges).where(eq(mindMapEdges.mindMapId, id));

    // Delete the mind map itself
    await db.delete(mindMaps).where(eq(mindMaps.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/me/mind-maps/[id]]', error);
    return NextResponse.json({ error: 'Не удалось удалить карту' }, { status: 500 });
  }
}
