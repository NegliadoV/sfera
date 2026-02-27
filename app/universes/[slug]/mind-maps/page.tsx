import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, mindMaps, user, mindMapNodes } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { MindMapsList } from './MindMapsList';

export const dynamic = 'force-dynamic';

export default async function UniverseMindMapsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();
  const sp = await searchParams;
  const addContentId = typeof sp?.addContent === 'string' ? sp.addContent : undefined;
  const addContentTitle = typeof sp?.contentTitle === 'string' ? decodeURIComponent(sp.contentTitle) : undefined;
  const [u] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
  if (!u) notFound();

  const list = await db
    .select({
      id: mindMaps.id,
      title: mindMaps.title,
      createdById: mindMaps.createdById,
      createdAt: mindMaps.createdAt,
      updatedAt: mindMaps.updatedAt,
      creatorName: user.name,
    })
    .from(mindMaps)
    .leftJoin(user, eq(mindMaps.createdById, user.id))
    .where(eq(mindMaps.universeId, u.id))
    .orderBy(desc(mindMaps.updatedAt))
    .limit(50);

  // Получаем количество узлов для каждой карты
  const mapsWithNodeCounts = await Promise.all(
    list.map(async (map) => {
      const [nodeCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(mindMapNodes)
        .where(eq(mindMapNodes.mindMapId, map.id));
      return {
        ...map,
        nodeCount: nodeCountResult?.count || 0,
      };
    })
  );

  const session = await auth();

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/">Сферы</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{u.name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Ментальные карты</span>
      </div>
      <div className="platform-card">
        <div className="platform-card-title" style={{ marginBottom: 8 }}>
          <i className="fa-solid fa-diagram-project" aria-hidden />
          Ментальные карты
          {mapsWithNodeCounts.length > 0 && (
            <span className="platform-tag" style={{ marginLeft: 'auto' }}>
              {mapsWithNodeCounts.length} {mapsWithNodeCounts.length === 1 ? 'карта' : mapsWithNodeCounts.length < 5 ? 'карты' : 'карт'}
            </span>
          )}
        </div>
        <p className="platform-card-desc mb-6">
          Визуализация связей между концепциями и материалами.
        </p>
        {session?.user?.id ? (
          <MindMapsList
            slug={slug}
            addContentId={addContentId}
            addContentTitle={addContentTitle}
            initialMaps={mapsWithNodeCounts.map((m) => ({
              id: m.id,
              title: m.title,
              createdById: m.createdById,
              createdAt: m.createdAt.toISOString(),
              updatedAt: m.updatedAt.toISOString(),
              creatorName: m.creatorName ?? undefined,
              nodeCount: m.nodeCount,
            }))}
          />
        ) : (
          <p className="platform-card-desc">
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/mind-maps`)}`}
              className="platform-btn platform-btn-primary no-underline"
            >
              Войдите
            </Link>
            , чтобы создавать ментальные карты.
          </p>
        )}
      </div>
    </div>
  );
}
