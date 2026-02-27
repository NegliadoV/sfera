import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, content, user, comments, contentLinks, universeMembers } from '@/lib/db';
import { eq, asc, sql, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { AddContentForm } from '../AddContentForm';
import { ContentCard } from '../ContentCard';
import { TrackUniverseButton } from '@/components/content/TrackUniverseButton';

export const dynamic = 'force-dynamic';

const FALLBACK: Record<string, { name: string }> = {
  quantum: { name: 'Квантовая физика' },
  urban: { name: 'Урбанистика 80-х' },
  embroidery: { name: 'Вышивание крестиком' },
  philosophy: { name: 'Философия сознания' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = FALLBACK[slug]?.name ?? slug;
  return { title: `Лента — ${name} | SFERA` };
}

export default async function ContentFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (searchParams) await searchParams;
  const slug = normalizeUniverseSlug((await params).slug);
  if (!slug) notFound();

  let universeRow: { id: string; name: string } | null = null;
  let contentList: Array<{
    id: string;
    title: string;
    type: string;
    authorName: string | null;
    externalAuthor: string | null;
    createdAt: Date;
    publishedAt: Date | null;
    url: string | null;
    imageUrl: string | null;
    body: string | null;
    sourceId: string | null;
    tags: string[] | null;
    hasLinks: boolean;
    commentCount: number;
  }> = [];
  let canDelete = false;

  const session = await auth();

  try {
    const [u] = await db.select().from(universes).where(eq(universes.slug, slug));
    if (!u) notFound();

    universeRow = { id: u.id, name: u.name };

    if (session?.user?.id) {
      const [uFull] = await db.select().from(universes).where(eq(universes.slug, slug)).limit(1);
      if (uFull) {
        const isOwner = uFull.ownerId === session.user.id;
        const isSid = session.user.name === 'Сид';
        const [member] = await db
          .select({ role: universeMembers.role })
          .from(universeMembers)
          .where(
            and(
              eq(universeMembers.universeId, uFull.id),
              eq(universeMembers.userId, session.user.id)
            )
          )
          .limit(1);
        const isModerator = member?.role === 'moderator' || member?.role === 'owner';
        canDelete = isOwner || isModerator || isSid;
      }
    }

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
      .where(eq(content.universeId, u.id))
      .orderBy(asc(content.createdAt))
      .limit(50);

    contentList = await Promise.all(
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
  } catch (err) {
    console.error('[content/feed]', err);
    notFound();
  }

  const name = universeRow?.name ?? FALLBACK[slug]?.name ?? slug.replace(/-/g, ' ');
  const search = await searchParams;
  const showList = search?.list === '1' || search?.list === 'true';

  // При переходе на ленту сферы без ?list=1 — редирект на последний (новейший) пост
  if (!showList && contentList.length > 0) {
    const newestPost = contentList[contentList.length - 1];
    redirect(`/universes/${slug}/content/${newestPost.id}`);
  }

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-globe" style={{ marginRight: 4 }} /> SFERA</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/">Сферы знаний</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href={`/universes/${slug}`}>{name}</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <span>Лента</span>
      </div>

      <div className="platform-card mb-6">
        <h1 className="platform-hero-title" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          Лента контента: {name}
        </h1>
        <p className="platform-card-desc">
          Материалы из источников и добавленные вручную.
        </p>
        {session?.user?.id && (
          <div className="mt-4">
            <TrackUniverseButton universeSlug={slug} />
          </div>
        )}
      </div>

      {session?.user?.id && (
        <div style={{ marginBottom: '16px' }}>
          <AddContentForm universeId={universeRow.id} slug={slug} />
        </div>
      )}

      {contentList.length === 0 ? (
        <p className="platform-card-desc">
          Пока нет материалов.{' '}
          {session?.user?.id ? (
            <>Добавьте контент выше или запустите агрегацию в{' '}
              <Link href="/me/content" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Сборке
              </Link>.
            </>
          ) : (
            <>
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/universes/${slug}/content`)}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Войдите
              </Link>
              , чтобы добавлять контент.
            </>
          )}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p className="platform-card-desc" style={{ marginBottom: 8 }}>
            <Link href={`/universes/${slug}/content?list=1`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              Вся лента
            </Link>
            {' · '}
            <span>Внизу — последние посты</span>
          </p>
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
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
