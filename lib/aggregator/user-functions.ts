/**
 * Функции агрегации контента для пользователя (user_sources -> user_content).
 */
import { db } from '@/lib/db';
import { parseDate } from '@/lib/parse-date';
import { userSources, userContent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchRSS } from './providers/rss';
import { fetchYouTube } from './providers/youtube';
import { fetchTelegram } from './providers/telegram';

const MAX_ITEMS_PER_SOURCE = 10;

export interface ProcessUserContentData {
  userId: string;
  sourceId?: string;
  title: string;
  url?: string;
  body?: string;
  imageUrl?: string;
  type?: 'link' | 'article' | 'video' | 'podcast';
  publishedAt?: Date;
  externalAuthor?: string;
  tags?: string[];
}

export async function processUserContentItem(data: ProcessUserContentData): Promise<{ created: boolean; skipped?: boolean }> {
  const { userId, sourceId, title, url, body, imageUrl, type, publishedAt, externalAuthor, tags } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('Title is required');
  }

  if (url) {
    const existing = await db
      .select()
      .from(userContent)
      .where(and(eq(userContent.userId, userId), eq(userContent.url, url)))
      .limit(1);

    if (existing.length > 0) {
      return { created: false, skipped: true };
    }
  }

  await db.insert(userContent).values({
    userId,
    sourceId: sourceId || null,
    type: type || 'link',
    title,
    url: url || null,
    body: body || null,
    imageUrl: imageUrl || null,
    publishedAt: parseDate(publishedAt) ?? null,
    externalAuthor: externalAuthor || null,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : null,
  });

  return { created: true };
}

async function fetchUserSourceDataSync(sourceId: string, userId: string): Promise<{ itemsProcessed: number }> {
  const [source] = await db.select().from(userSources).where(eq(userSources.id, sourceId)).limit(1);
  if (!source || source.userId !== userId) {
    throw new Error('Source not found');
  }

  let items: Array<{
    title: string;
    url?: string;
    body?: string;
    imageUrl?: string;
    type: 'link' | 'article' | 'video' | 'podcast';
    publishedAt?: Date;
    externalAuthor?: string;
    tags?: string[];
  }> = [];

  switch (source.provider) {
    case 'rss':
    case 'podcast':
      if (source.url) items = await fetchRSS(source.url);
      break;
    case 'youtube':
      if (source.url) items = await fetchYouTube(source.url, source.config as { apiKey?: string });
      break;
    case 'telegram':
      if (source.url) items = await fetchTelegram(source.url);
      break;
    default:
      break;
  }

  const toProcess = items.slice(0, MAX_ITEMS_PER_SOURCE);

  await db
    .update(userSources)
    .set({ lastFetchedAt: new Date() })
    .where(eq(userSources.id, sourceId));

  let processed = 0;
  for (const item of toProcess) {
    try {
      const result = await processUserContentItem({
        userId,
        sourceId,
        ...item,
      });
      if (result.created) processed++;
    } catch (err) {
      console.error('[UserAggregator] Error inserting item:', err);
    }
  }

  return { itemsProcessed: processed };
}

export async function aggregateUserSync(userId: string): Promise<{ processed: number }> {
  const sources = await db
    .select()
    .from(userSources)
    .where(and(eq(userSources.userId, userId), eq(userSources.enabled, true)));

  let totalProcessed = 0;
  for (const source of sources) {
    try {
      const result = await fetchUserSourceDataSync(source.id, userId);
      totalProcessed += result.itemsProcessed;
    } catch (error) {
      console.error(`[AggregateUser] Error processing source ${source.id}:`, error);
    }
  }

  return { processed: totalProcessed };
}

export async function getUserIdsWithEnabledSources(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ userId: userSources.userId })
    .from(userSources)
    .where(eq(userSources.enabled, true));
  return rows.map((r) => r.userId as string);
}
