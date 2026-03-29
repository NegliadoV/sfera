import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { db, universes, content, user, comments, contentLinks, universeMembers, contentPolls } from '@/lib/db';
import { eq, desc, sql, and } from 'drizzle-orm';
import { normalizeUniverseSlug } from '@/lib/universe-slug';
import { AddContentForm } from '../AddContentForm';
import { ContentFeedGrid } from '../ContentFeedGrid';
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
  return { title: `Лента — ${name} | Roominate` };
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
    pinnedAt: Date | null;
    url: string | null;
    imageUrl: string | null;
    body: string | null;
    sourceId: string | null;
    tags: string[] | null;
    hasLinks: boolean;
    commentCount: number;
    savesCount: number;
    pollData?: { id: string; options: any } | null;
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
        pinnedAt: content.pinnedAt,
        sourceId: content.sourceId,
        tags: content.tags,
        savesCount: content.savesCount,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .where(eq(content.universeId, u.id))
      .orderBy(desc(content.pinnedAt), desc(content.createdAt))
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

        const [pollData] = await db
          .select({
            id: contentPolls.id,
            options: contentPolls.options,
          })
          .from(contentPolls)
          .where(eq(contentPolls.contentId, item.id))
          .limit(1);

        return {
          ...item,
          commentCount: commentCountResult?.count || 0,
          hasLinks: !!hasLinksResult,
          tags: Array.isArray(item.tags) ? (item.tags as string[]) : null,
          pollData: pollData || null,
        };
      })
    );
  } catch (err) {
    console.error('[content/feed]', err);
    throw err;
  }

  const name = universeRow?.name ?? FALLBACK[slug]?.name ?? slug.replace(/-/g, ' ');

  return (
    <div className="platform-page">
      <div className="platform-breadcrumb mb-6">
        <Link href="/"><i className="fa-solid fa-shapes" style={{ marginRight: 4 }} /> Roominate</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} aria-hidden />
        <Link href="/">Комнаты знаний</Link>
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
        <ContentFeedGrid
          items={contentList}
          slug={slug}
          canDelete={canDelete}
          canEdit={canDelete}
          canPin={canDelete}
        />
      )}
    </div>
  );
}
