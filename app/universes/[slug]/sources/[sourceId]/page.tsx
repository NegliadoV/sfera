import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, sources, content, user, comments, contentLinks, universeMembers } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { ContentCard } from '../../ContentCard';
import { TrackUniverseButton } from '@/components/content/TrackUniverseButton';
import { AggregateSourceButton } from './AggregateSourceButton';
import { DeleteSourceButton } from './DeleteSourceButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sourceId: string }>;
}) {
  const { slug, sourceId } = await params;
  const [source] = await db
    .select({ name: sources.name })
    .from(sources)
    .where(eq(sources.id, sourceId));
  const name = source?.name ?? 'Источник';
  return { title: `${name} | SFERA` };
}

export default async function SourceContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; sourceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  const slug = normalizeUniverseSlug((await params).slug);
  const sourceId = (await params).sourceId;
  if (!slug) notFound();

  const [u] = await db.select().from(universes).where(eq(universes.slug, slug));
  if (!u) notFound();

  const [sourceRow] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.universeId, u.id)));
  if (!sourceRow) notFound();

  const list = await db
    .select({
      id: content.id,
      title: content.title,
      type: content.type,
      url: content.url,
      imageUrl: content.imageUrl,
      body: content.body,
      authorName: user.name,
      externalAuthor: content.externalAuthor,
      createdAt: content.createdAt,
      publishedAt: content.publishedAt,
      sourceId: content.sourceId,
      tags: content.tags,
    })
    .from(content)
    .leftJoin(user, eq(content.authorId, user.id))
    .where(and(eq(content.universeId, u.id), eq(content.sourceId, sourceId)))
    .orderBy(desc(content.createdAt))
    .limit(50);

  const contentList = await Promise.all(
    list.map(async (item) => {
      const [commentCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(eq(comments.contentId, item.id));
      const [hasLinksResult] = await db
        .select({ exists: sql<boolean>`true` })
        .from(contentLinks)
        .where(eq(contentLinks.fromContentId, item.id))
        .limit(1);
      return {
        ...item,
        commentCount: commentCountResult?.count || 0,
        hasLinks: !!hasLinksResult,
        tags: Array.isArray(item.tags) ? (item.tags as string[]) : null,
      };
    })
  );

  const session = await auth();
  const universeName = u.name;

  let canEdit = false;
  let canDelete = false;
  if (session?.user?.id) {
    const isOwner = u.ownerId === session.user.id;
    const [membership] = await db
      .select()
      .from(universeMembers)
      .where(and(eq(universeMembers.universeId, u.id), eq(universeMembers.userId, session.user.id)))
      .limit(1);
    canEdit = isOwner || membership?.role === 'owner' || membership?.role === 'moderator';
    canDelete = isOwner; // Только владелец сферы может удалить источник
  }

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> SFERA</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/">Сферы знаний</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{universeName}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>{sourceRow.name}</span>
      </div>

      <div className="platform-card mb-6">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          {sourceRow.name}
        </h1>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="platform-tag" style={{ textTransform: 'none' }}>
            {sourceRow.provider === 'rss'
              ? 'RSS'
              : sourceRow.provider === 'youtube'
                ? 'YouTube'
                : sourceRow.provider === 'telegram'
                  ? 'Telegram'
                  : sourceRow.provider === 'podcast'
                    ? 'Подкаст'
                    : 'Ручной'}
          </span>
          {sourceRow.url && (
            <a
              href={sourceRow.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              <i className="fa-solid fa-external-link-alt" style={{ marginRight: 4 }} />
              Открыть оригинал
            </a>
          )}
          <Link href={`/universes/${slug}`} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 4 }} />
            Все источники
          </Link>
          {session?.user?.id && (
            <TrackUniverseButton universeSlug={slug} label="Отслеживать канал" labelActive="Отслеживаю канал" />
          )}
          {sourceRow.provider !== 'manual' && sourceRow.url && (
            <AggregateSourceButton universeSlug={slug} sourceId={sourceId} canEdit={canEdit} />
          )}
          <DeleteSourceButton
            universeSlug={slug}
            sourceId={sourceId}
            sourceName={sourceRow.name}
            canDelete={canDelete}
          />
        </div>
      </div>

      {contentList.length === 0 ? (
        <p className="platform-card-desc">
          Пока нет постов из этого источника. Запустите агрегацию на{' '}
          <Link href={`/universes/${slug}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            странице сферы
          </Link>.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contentList.map((c) => (
            <ContentCard
              key={c.id}
              id={c.id}
              title={c.title}
              type={c.type}
              url={c.url}
              imageUrl={c.imageUrl}
              body={c.body}
              authorName={c.authorName}
              externalAuthor={c.externalAuthor}
              publishedAt={c.publishedAt}
              createdAt={c.createdAt}
              sourceId={c.sourceId}
              tags={c.tags}
              hasLinks={c.hasLinks}
              commentCount={c.commentCount}
              slug={slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
