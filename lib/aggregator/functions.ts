/**
 * Чистые функции агрегации (без зависимости от очередей).
 * Можно вызывать синхронно или через воркеры.
 */
import { db } from '@/lib/db';
import { parseDate } from '@/lib/parse-date';
import { sources, content, universes, universeTracking, notifications } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { fetchRSS } from './providers/rss';
import { fetchYouTube } from './providers/youtube';
import { fetchTelegram } from './providers/telegram';

/** Максимум записей с одного источника за один запуск (последние 10 постов) */
const MAX_ITEMS_PER_SOURCE = 10;

export interface ProcessContentData {
  universeId: string;
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

/**
 * Обработка одного элемента контента (создание записи в БД)
 */
export async function processContentItem(data: ProcessContentData): Promise<{ created: boolean; skipped?: boolean; reason?: string }> {
  const { universeId, sourceId, title, url, body, imageUrl, type, publishedAt, externalAuthor, tags } = data;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!universeId || !uuidRegex.test(universeId)) {
    throw new Error(`Invalid universeId: ${universeId}. Expected UUID format.`);
  }
  if (sourceId && !uuidRegex.test(sourceId)) {
    throw new Error(`Invalid sourceId: ${sourceId}. Expected UUID format.`);
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('Title is required');
  }

  // Проверяем, не существует ли уже такой контент (по URL)
  if (url) {
    const existing = await db
      .select()
      .from(content)
      .where(and(eq(content.url, url), eq(content.universeId, universeId)))
      .limit(1);

    if (existing.length > 0) {
      return { created: false, skipped: true, reason: 'already_exists' };
    }
  }

  // Получаем вселенную для authorId
  const [universe] = await db
    .select()
    .from(universes)
    .where(eq(universes.id, universeId))
    .limit(1);

  if (!universe) {
    throw new Error(`Universe ${universeId} not found`);
  }

  // Создаём контент
  const [inserted] = await db.insert(content).values({
    universeId,
    authorId: universe.ownerId,
    sourceId,
    type: type || 'link',
    title,
    url: url || null,
    body: body || null,
    imageUrl: imageUrl || null,
    publishedAt: parseDate(publishedAt) ?? null,
    externalAuthor: externalAuthor || null,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : null,
  }).returning({ id: content.id });

  // Уведомляем пользователей, отслеживающих сферу
  if (inserted?.id) {
    const trackers = await db
      .select({ userId: universeTracking.userId })
      .from(universeTracking)
      .where(eq(universeTracking.universeId, universeId));
    if (trackers.length > 0) {
      await db.insert(notifications).values(
        trackers.map((t) => ({
          userId: t.userId,
          universeId,
          contentId: inserted.id,
        }))
      );
    }
  }

  return { created: true };
}

/**
 * Получить элементы из источника без вставки в БД (для предварительной очистки дубликатов)
 */
export async function fetchSourceItemsSync(sourceId: string): Promise<Array<{ url?: string }>> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!sourceId || !uuidRegex.test(sourceId)) return [];

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);
  if (!source) return [];

  let items: Array<{ url?: string }> = [];
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
  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}

/**
 * Удалить контент-дубликаты по URL из фида (в т.ч. с sourceId=null от старых источников)
 */
export async function clearDuplicateContentByUrls(universeId: string, urls: string[]): Promise<void> {
  const valid = urls.filter((u): u is string => !!u && typeof u === 'string');
  if (valid.length === 0) return;
  await db
    .delete(content)
    .where(and(eq(content.universeId, universeId), inArray(content.url, valid)));
}

/**
 * Получение контента из одного источника (синхронная версия для fallback)
 */
export async function fetchSourceDataSync(sourceId: string, universeId: string): Promise<{ itemsProcessed: number }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!sourceId || !uuidRegex.test(sourceId)) {
    throw new Error(`Invalid sourceId: ${sourceId}. Expected UUID format.`);
  }
  if (!universeId || !uuidRegex.test(universeId)) {
    throw new Error(`Invalid universeId: ${universeId}. Expected UUID format.`);
  }

  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);
  if (!source) {
    throw new Error(`Source ${sourceId} not found`);
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

  // Вызываем соответствующий провайдер
  switch (source.provider) {
    case 'rss':
      if (source.url) {
        items = await fetchRSS(source.url);
        console.log(`[Aggregator] RSS ${source.name}: получено ${items.length} элементов`);
      }
      break;
    case 'youtube':
      if (source.url) {
        items = await fetchYouTube(source.url, source.config as { apiKey?: string });
        console.log(`[Aggregator] YouTube ${source.name}: получено ${items.length} элементов`);
      }
      break;
    case 'podcast':
      if (source.url) {
        items = await fetchRSS(source.url);
        console.log(`[Aggregator] Podcast ${source.name}: получено ${items.length} элементов`);
      }
      break;
    case 'telegram':
      if (source.url) {
        items = await fetchTelegram(source.url);
        console.log(`[Aggregator] Telegram ${source.name}: получено ${items.length} элементов`);
      }
      break;
    default:
      console.warn(`Unknown provider: ${source.provider}`);
  }

  // Ограничиваем количество
  const toProcess = items.slice(0, MAX_ITEMS_PER_SOURCE);
  items = toProcess;

  // Обновляем время последнего получения
  await db
    .update(sources)
    .set({ lastFetchedAt: new Date() })
    .where(eq(sources.id, sourceId));

  // Обрабатываем каждый элемент синхронно
  let processed = 0;
  let skipped = 0;
  for (const item of items) {
    try {
      const result = await processContentItem({
        universeId,
        sourceId,
        ...item,
      });
      if (result.created) {
        processed++;
      } else if (result.skipped) {
        skipped++;
      }
    } catch (err) {
      console.error(`[Aggregator] Ошибка вставки "${item.title?.slice(0, 50)}" (url: ${item.url ?? 'нет'}):`, err);
    }
  }

  if (processed > 0 || skipped > 0) {
    console.log(`[Aggregator] ${source.name}: добавлено ${processed}, пропущено (дубликаты) ${skipped}`);
  }
  return { itemsProcessed: processed };
}

/**
 * Получение контента из одного источника (для воркера - использует очередь)
 */
export async function fetchSourceData(sourceId: string, universeId: string): Promise<{ itemsProcessed: number }> {
  return await fetchSourceDataSync(sourceId, universeId);
}

/**
 * Агрегация контента по вселенной (синхронно, без очереди - для fallback режима)
 */
export async function aggregateUniverseSync(universeId: string): Promise<{ processed: number }> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!universeId || !uuidRegex.test(universeId)) {
    throw new Error(`Invalid universeId: ${universeId}. Expected UUID format.`);
  }

  // Получаем все активные источники для вселенной
  const universeSources = await db
    .select()
    .from(sources)
    .where(and(eq(sources.universeId, universeId), eq(sources.enabled, true)));

  if (universeSources.length === 0) {
    return { processed: 0 };
  }

  // Обрабатываем каждый источник синхронно
  let totalProcessed = 0;
  for (const source of universeSources) {
    try {
      const result = await fetchSourceDataSync(source.id, universeId);
      totalProcessed += result.itemsProcessed;
    } catch (error) {
      console.error(`[AggregateUniverse] Error processing source ${source.id}:`, error);
    }
  }

  return { processed: totalProcessed };
}

/**
 * Возвращает ID вселенных, у которых есть хотя бы один включённый источник
 */
export async function getUniverseIdsWithEnabledSources(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ universeId: sources.universeId })
    .from(sources)
    .where(eq(sources.enabled, true));
  return rows.map((r) => r.universeId as string);
}
