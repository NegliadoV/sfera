import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, mindMaps, mindMapNodes, mindMapEdges } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { MindMapEditor } from './MindMapEditor';

export const dynamic = 'force-dynamic';

export default async function MindMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; mapId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  const p = await params;
  const slug = normalizeUniverseSlug(p.slug);
  const mapId = p.mapId;
  if (!slug) notFound();
  const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
  if (!u) notFound();

  const [map] = await db
    .select()
    .from(mindMaps)
    .where(and(eq(mindMaps.id, mapId), eq(mindMaps.universeId, u.id)))
    .limit(1);
  if (!map) notFound();

  const [nodes, edges] = await Promise.all([
    db.select().from(mindMapNodes).where(eq(mindMapNodes.mindMapId, map.id)),
    db.select().from(mindMapEdges).where(eq(mindMapEdges.mindMapId, map.id)),
  ]);

  const session = await auth();
  const canEdit = session?.user?.id === map.createdById;

  const mapData = {
    ...map,
    createdAt: map.createdAt.toISOString(),
    updatedAt: map.updatedAt.toISOString(),
    nodes: nodes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      position: n.position as { x: number; y: number } | null,
    })),
    edges: edges.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 page-padding-mobile">
      <Link
        href={`/universes/${slug}/mind-maps`}
        className="inline-block mb-6 text-sm no-underline"
        style={{ color: 'var(--text-accent)' }}
      >
        ← Ментальные карты
      </Link>
      <div
        className="rounded-[var(--radius-xl)] p-6 md:p-8 mb-8 border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {map.title}
        </h1>
        <MindMapEditor
          slug={slug}
          mapId={map.id}
          initialMap={mapData}
          canEdit={!!canEdit}
        />
      </div>
    </div>
  );
}
