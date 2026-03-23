import { getSessionForServerComponent } from '@/lib/session';
import { db, mindMaps, mindMapNodes, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { MindMapWorkspace } from '@/components/mind-maps/MindMapWorkspace';

export const dynamic = 'force-dynamic';

export default async function PersonalMindMapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionForServerComponent();
  if (!session?.user?.id) redirect('/auth/signin');

  const id = (await params).id;
  const [map] = await db.select().from(mindMaps).where(and(eq(mindMaps.id, id), eq(mindMaps.createdById, session.user.id)));
  if (!map) notFound();

  const nodes = await db.select().from(mindMapNodes).where(eq(mindMapNodes.mindMapId, id));
  const edges = await db.select().from(mindMapEdges).where(eq(mindMapEdges.mindMapId, id));

  // Map DB format to ReactFlow format
  const initialNodes = nodes.map((n: any) => ({
    id: n.id,
    type: n.data?.type || 'custom', // Restore the exact frontend type
    position: n.position || { x: 0, y: 0 },
    data: n.data || { label: n.label, bgColor: 'rgba(20, 20, 25, 0.6)' }
  }));

  const initialEdges = edges.map(e => ({
    id: e.id,
    source: e.fromNodeId,
    target: e.toNodeId,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--accent-primary)', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: 'var(--accent-primary)' }
  }));

  return (
    <div className="flex flex-col w-full h-full" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="platform-breadcrumb shrink-0 px-6 pt-6 pb-2">
        <Link href="/">Сферы</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/me/mind-maps">Мои Карты</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{map.title}</span>
      </div>

      <div className="flex-1 w-full relative px-6 pb-6">
        <div className="w-full h-full relative">
          <MindMapWorkspace mapId={map.id} initialNodes={initialNodes} initialEdges={initialEdges} />
        </div>
      </div>
    </div>
  );
}
