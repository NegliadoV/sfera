import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, content, user, comments, contentLinks } from '@/lib/db';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES = ['text', 'video', 'podcast', 'article', 'link'] as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { universeId, type, title, url, body: text } = body as {
      universeId: string;
      type?: string;
      title: string;
      url?: string;
      body?: string;
    };
    if (!universeId || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'universeId and title required' }, { status: 400 });
    }
    const contentType =
      type && CONTENT_TYPES.includes(type as (typeof CONTENT_TYPES)[number])
        ? (type as (typeof CONTENT_TYPES)[number])
        : 'link';
    const [inserted] = await db
      .insert(content)
      .values({
        universeId,
        authorId: session.user.id,
        type: contentType,
        title: title.trim(),
        url: typeof url === 'string' ? url : null,
        body: typeof text === 'string' ? text : null,
      })
      .returning();
    return NextResponse.json(inserted);
  } catch (e) {
    console.error('POST /api/content', e);
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const universeId = searchParams.get('universeId');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Number(searchParams.get('offset')) || 0;
  const sortBy = searchParams.get('sortBy') || 'newest'; // newest, most_discussed, controversial
  const sourceId = searchParams.get('sourceId');
  const hasLinks = searchParams.get('hasLinks') === 'true';
  const tagsParam = searchParams.get('tags'); // JSON array или comma-separated

  if (!universeId) {
    return NextResponse.json({ error: 'universeId required' }, { status: 400 });
  }

  try {
    // Парсим теги
    let tags: string[] = [];
    if (tagsParam) {
      try {
        tags = JSON.parse(tagsParam);
      } catch {
        tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    // Строим условия фильтрации
    const conditions = [eq(content.universeId, universeId)];

    if (sourceId) {
      conditions.push(eq(content.sourceId, sourceId));
    }

    if (tags.length > 0) {
      // Фильтр по тегам через JSONB оператор ?| (содержит хотя бы один из тегов)
      // Экранируем теги для безопасности
      const escapedTags = tags.map((tag) => tag.replace(/'/g, "''"));
      conditions.push(
        sql`${content.tags} ?| ARRAY[${sql.raw(escapedTags.map((t) => `'${t}'`).join(','))}]::text[]`
      );
    }

    // Фильтр по наличию связей — контент должен быть в fromContentId или toContentId
    if (hasLinks) {
      const fromIds = await db
        .selectDistinct({ id: contentLinks.fromContentId })
        .from(contentLinks);
      const toIds = await db
        .selectDistinct({ id: contentLinks.toContentId })
        .from(contentLinks);
      const contentIdsWithLinks = [
        ...new Set([...fromIds.map((c) => c.id), ...toIds.map((c) => c.id)]),
      ];
      if (contentIdsWithLinks.length === 0) {
        return NextResponse.json([]);
      }
      conditions.push(inArray(content.id, contentIdsWithLinks));
    }

    // Упрощённый запрос - сначала получаем контент, потом добавляем метаданные
    const list = await db
      .select({
        id: content.id,
        universeId: content.universeId,
        authorId: content.authorId,
        authorName: user.name,
        type: content.type,
        title: content.title,
        url: content.url,
        body: content.body,
        createdAt: content.createdAt,
        // Фаза 2: метаданные
        sourceId: content.sourceId,
        publishedAt: content.publishedAt,
        externalAuthor: content.externalAuthor,
        tags: content.tags,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(content.createdAt))
      .limit(limit)
      .offset(offset);

    // Добавляем подсчёты комментариев и проверку связей для каждого элемента
    const enrichedList = await Promise.all(
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
        };
      })
    );

    // Повторная сортировка для most_discussed и controversial
    if (sortBy === 'most_discussed' || sortBy === 'controversial') {
      enrichedList.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }

    const finalList = enrichedList;

    return NextResponse.json(finalList);
  } catch (e) {
    console.error('GET /api/content', e);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
