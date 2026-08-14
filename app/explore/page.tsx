import Link from 'next/link';
import { auth } from '@/auth';
import { db, universes, content, user, comments, contentLinks, contentPolls } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { ContentFeedGrid } from '@/app/universes/[slug]/ContentFeedGrid';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Общая лента | Roominate',
};

export default async function ExplorePage() {
  const session = await auth();

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
    universeSlug: string;
    universeName: string;
    pollData?: { id: string; options: any } | null;
  }> = [];

  try {
    // ── Алгоритмическая лента ────────────────────────────────────────
    // Скоринг: (saves + 1) / (age_hours + 2)^1.5
    // Для залогиненных: отслеживаемые сферы ×1.6
    const userId = session?.user?.id;

    const personalBoost = userId
      ? sql`CASE WHEN ${universes.slug} IN (
              SELECT u2.slug FROM universes u2
              JOIN universe_tracking ut ON ut.universe_id = u2.id
              WHERE ut.user_id = ${userId}
            ) THEN 1.6 ELSE 1.0 END`
      : sql`1.0`;

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
        universeSlug: universes.slug,
        universeName: universes.name,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .innerJoin(universes, eq(content.universeId, universes.id))
      .orderBy(sql`
        (${content.savesCount} + 1.0)
        / POWER(EXTRACT(EPOCH FROM (NOW() - ${content.createdAt})) / 3600.0 + 2, 1.5)
        * ${personalBoost}
        DESC
      `)
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
    console.error('[explore/feed]', err);
  }

  return (
    <div className="platform-page">
      <div className="platform-card mb-6 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20" style={{ background: 'radial-gradient(circle at top right, var(--accent-primary), transparent 60%)' }}></div>
        <div className="relative z-10">
          <h1 className="platform-hero-title" style={{ fontSize: '2rem', marginBottom: 8 }}>
            <i className="fa-solid fa-fire text-[var(--accent-primary)] mr-3"></i> 
            {session?.user ? 'Для тебя' : 'В тренде'}
          </h1>
          <p className="platform-card-desc">
            {session?.user
              ? 'Лучшие материалы из твоих сфер и со всей платформы — подобраны алгоритмом.'
              : 'Лучшие материалы со всех Сфер, подобранные по свежести и популярности.'}
          </p>
        </div>
      </div>

      {contentList.length === 0 ? (
        <p className="platform-card-desc">
          Пока нет материалов.
        </p>
      ) : (
        <ContentFeedGrid
          items={contentList.map(c => ({
            ...c,
            title: `[${c.universeName}] ${c.title}`
          }))}
          slug="explore"
        />
      )}
    </div>
  );
}
