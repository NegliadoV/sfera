import Link from 'next/link';
import { auth } from '@/auth';
import { db, universes, content, user, comments, contentLinks, contentPolls, userHygieneSettings, userContentViews } from '@/lib/db';
import { eq, desc, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ContentFeedGrid } from '@/app/universes/[slug]/ContentFeedGrid';
import { ExploreHero, ExploreEmpty } from './ExploreHero';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Общая лента | Roominate',
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const showWelcome = params?.welcome === '1';

  // Новый пользователь — нет ни одной подписки → на онбординг
  if (session?.user?.id) {
    try {
      const [trackCount] = await db.execute(
        sql`SELECT COUNT(*)::int as cnt FROM universe_tracking WHERE user_id = ${session.user.id}`
      ) as unknown as [{ cnt: number }];
      if (!trackCount || trackCount.cnt === 0) {
        redirect('/onboarding');
      }
    } catch {}
  }

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
    const userId = session?.user?.id;

    // 1. Проверяем настройку умной ленты
    let smartFeedEnabled = true;
    if (userId) {
      const [settingsRow] = await db
        .select({ smartFeedEnabled: userHygieneSettings.smartFeedEnabled })
        .from(userHygieneSettings)
        .where(eq(userHygieneSettings.userId, userId))
        .limit(1);
      if (settingsRow && settingsRow.smartFeedEnabled === false) {
        smartFeedEnabled = false;
      }
    }

    let listQuery;

    if (smartFeedEnabled && userId) {
      // ── Умный рекомендательный алгоритм на основе интересов и просмотров ──
      // 1. Бонус за отслеживаемые сферы (x1.7)
      const trackedBoost = sql`
        CASE WHEN ${universes.slug} IN (
          SELECT u2.slug FROM universes u2
          JOIN universe_tracking ut ON ut.universe_id = u2.id
          WHERE ut.user_id = ${userId}
        ) THEN 1.7 ELSE 1.0 END
      `;

      // 2. Бонус за сферы, из которых пользователь активно смотрит материалы (до +100% / x2.0)
      const viewHistoryBoost = sql`
        COALESCE(
          (SELECT 1.0 + LEAST(COUNT(*)::float * 0.15, 1.0)
           FROM user_content_views ucv
           WHERE ucv.user_id = ${userId} AND ucv.universe_id = ${universes.id}),
          1.0
        )
      `;

      // 3. Дебуст уже просмотренных постов (x0.7), чтобы лента предлагала новый контент
      const unreadBoost = sql`
        CASE WHEN EXISTS (
          SELECT 1 FROM user_content_views ucv2
          WHERE ucv2.user_id = ${userId} AND ucv2.content_id = ${content.id}
        ) THEN 0.7 ELSE 1.2 END
      `;

      // Итоговый скоринг интересов и свежести
      const smartScore = sql`
        (${content.savesCount} * 1.5 + 1.0)
        / POWER(EXTRACT(EPOCH FROM (NOW() - COALESCE(${content.publishedAt}, ${content.createdAt}))) / 3600.0 + 2.0, 1.35)
        * ${trackedBoost}
        * ${viewHistoryBoost}
        * ${unreadBoost}
      `;

      listQuery = db
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
        .where(eq(content.hidden, false))
        .orderBy(sql`${smartScore} DESC`)
        .limit(60);
    } else {
      // ── Классическая хронологическая лента (без персонализации) ──
      listQuery = db
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
        .where(eq(content.hidden, false))
        .orderBy(sql`COALESCE(${content.publishedAt}, ${content.createdAt}) DESC`)
        .limit(60);
    }

    const list = await listQuery;

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
      <ExploreHero
        isLoggedIn={!!session?.user}
        userName={session?.user?.name}
        showWelcome={showWelcome}
      />

      {contentList.length === 0 ? (
        <ExploreEmpty />
      ) : (
        <ContentFeedGrid
          items={contentList.map(c => ({
            ...c,
            title: c.title
          }))}
          slug="explore"
          session={session}
        />
      )}
    </div>
  );
}
