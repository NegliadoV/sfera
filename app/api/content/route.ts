import { NextRequest, NextResponse } from 'next/server';
import { getSessionForRequest } from '@/lib/session';
import { db, content, user, comments, contentLinks, contentPolls, contentPollVotes } from '@/lib/db';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES = ['text', 'video', 'podcast', 'article', 'link'] as const;

import { validateContentCreation } from '@/lib/moderation/moderator-bot';

export async function POST(req: NextRequest) {
  const session = await getSessionForRequest(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { universeId, type, title, url, body: text, imageUrl, pollOptions } = body as {
      universeId: string;
      type?: string;
      title: string;
      url?: string;
      body?: string;
      imageUrl?: string;
      pollOptions?: string[];
    };
    if (!universeId || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'universeId and title required' }, { status: 400 });
    }

    // 🤖 Предварительная проверка Бот-модератором
    const moderation = validateContentCreation({
      title: title.trim(),
      body: typeof text === 'string' ? text.trim() : null,
      url: typeof url === 'string' ? url.trim() : null,
      type: typeof type === 'string' ? type : null,
    });

    if (!moderation.isAllowed) {
      return NextResponse.json(
        {
          error: moderation.reasonRu,
          botMessage: moderation.botFeedback,
          category: moderation.category,
        },
        { status: 400 }
      );
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
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
      })
      .returning();

    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length > 0) {
      const formattedOptions = pollOptions.filter(o => o.trim()).map((opt) => ({
        id: crypto.randomUUID(),
        text: opt.trim(),
      }));
      if (formattedOptions.length > 0) {
        await db.insert(contentPolls).values({
          contentId: inserted.id,
          options: formattedOptions,
        });
      }
    }

    // Ставим в очередь модерации (асинхронно, не блокирует ответ)
    db.execute(
      sql`INSERT INTO content_moderation (content_id, status) VALUES (${inserted.id}, 'pending')`
    ).catch(err => console.error('[moderation] Ошибка постановки в очередь:', err));

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

    // Строим условия фильтрации — исключаем скрытый модератором контент
    const conditions = [
      eq(content.universeId, universeId),
      eq(content.hidden, false),
    ];

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

    // Оптимизированный запрос с subqueries (устраняет N+1 query problem)
    const list = await db
      .select({
        id: content.id,
        universeId: content.universeId,
        authorId: content.authorId,
        authorName: user.name,
        authorImage: user.image,
        type: content.type,
        title: content.title,
        url: content.url,
        body: content.body,
        imageUrl: content.imageUrl,
        createdAt: content.createdAt,
        pinnedAt: content.pinnedAt,
        savesCount: content.savesCount,
        // Фаза 2: метаданные
        sourceId: content.sourceId,
        publishedAt: content.publishedAt,
        externalAuthor: content.externalAuthor,
        tags: content.tags,

        // Подсчёты через subqueries (выполняются в одном запросе, а не в цикле JS)
        commentCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM comments
          WHERE comments.content_id = ${content.id}
        )`.as('comment_count'),

        hasLinks: sql<boolean>`EXISTS(
          SELECT 1
          FROM content_links
          WHERE content_links.from_content_id = ${content.id}
        )`.as('has_links'),

        pollData: sql<any>`(
          SELECT json_build_object(
            'id', cp.id,
            'options', cp.options
          )
          FROM content_polls cp
          WHERE cp.content_id = ${content.id}
          LIMIT 1
        )`.as('poll_data'),
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .where(and(...conditions))
      .orderBy(desc(content.createdAt))
      .limit(limit)
      .offset(offset);

    // Batch-загрузка голосов для всех опросов одним запросом
    const pollIds = list
      .filter((item) => item.pollData)
      .map((item) => item.pollData.id);

    let pollVotesMap: Record<string, any[]> = {};
    if (pollIds.length > 0) {
      const allVotes = await db
        .select()
        .from(contentPollVotes)
        .where(inArray(contentPollVotes.pollId, pollIds));

      pollVotesMap = allVotes.reduce((acc, vote) => {
        if (!acc[vote.pollId]) acc[vote.pollId] = [];
        acc[vote.pollId].push(vote);
        return acc;
      }, {} as Record<string, any[]>);
    }

    // Формируем финальный список с poll votes
    const enrichedList = list.map((item) => ({
      ...item,
      poll: item.pollData
        ? { ...item.pollData, votes: pollVotesMap[item.pollData.id] || [] }
        : null,
    }));

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
