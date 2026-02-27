import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { db } from '@/lib/db';
import { sources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchRSS } from './providers/rss';
import { fetchYouTube } from './providers/youtube';
import { fetchTelegram } from './providers/telegram';
import { fetchSourceQueue, processContentQueue } from './queue';
import { processContentItem } from './functions';

const MAX_ITEMS_PER_SOURCE = 15;

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Воркер для агрегации контента по вселенной
export const aggregateUniverseWorker = new Worker(
  'aggregate-universe',
  async (job) => {
    const { universeId } = job.data;
    console.log(`[AggregateUniverse] Начало обработки вселенной ${universeId.substring(0, 8)}...`);

    // Получаем все активные источники для вселенной
    const universeSources = await db
      .select()
      .from(sources)
      .where(and(eq(sources.universeId, universeId), eq(sources.enabled, true)));

    if (universeSources.length === 0) {
      console.log(`[AggregateUniverse] Universe ${universeId}: нет включённых источников.`);
      return { processed: 0 };
    }

    // Для каждого источника добавляем задачу в очередь fetch-source (для параллелизма)
    for (const source of universeSources) {
      await fetchSourceQueue.add('fetch-source', {
        sourceId: source.id,
        universeId,
      });
    }

    return { processed: universeSources.length };
  },
  {
    connection: redisConnection,
    skipVersionCheck: true,
    concurrency: 2, // Максимум 2 вселенные обрабатываются одновременно
    limiter: {
      max: 1, // Максимум 1 задача
      duration: 5000, // за 5 секунд (чтобы не перегружать)
    },
  }
);

// Воркер для получения контента из источника
export const fetchSourceWorker = new Worker(
  'fetch-source',
  async (job) => {
    const { sourceId, universeId } = job.data;

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
        }
        break;
      case 'youtube':
        if (source.url) {
          items = await fetchYouTube(source.url, source.config as { apiKey?: string });
        }
        break;
      case 'podcast':
        if (source.url) {
          items = await fetchRSS(source.url);
        }
        break;
      case 'telegram':
        if (source.url) {
          items = await fetchTelegram(source.url);
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

    // Добавляем задачи на обработку каждого элемента контента в очередь
    for (const item of items) {
      await processContentQueue.add('process-content', {
        universeId,
        sourceId,
        ...item,
      });
    }

    return { itemsProcessed: items.length };
  },
  {
    connection: redisConnection,
    skipVersionCheck: true,
    concurrency: 3, // Максимум 3 источника обрабатываются одновременно
    limiter: {
      max: 2, // Максимум 2 задачи
      duration: 3000, // за 3 секунды
    },
  }
);

// Воркер для обработки отдельного элемента контента
export const processContentWorker = new Worker(
  'process-content',
  async (job) => {
    const { universeId, sourceId, title, url, body, imageUrl, type, publishedAt, externalAuthor, tags } =
      job.data;
    return await processContentItem({
      universeId,
      sourceId,
      title,
      url,
      body,
      imageUrl,
      type,
      publishedAt,
      externalAuthor,
      tags,
    });
  },
  {
    connection: redisConnection,
    skipVersionCheck: true,
    concurrency: 5, // Максимум 5 элементов контента обрабатываются одновременно
    limiter: {
      max: 10, // Максимум 10 задач
      duration: 2000, // за 2 секунды
    },
  }
);

// Обработка ошибок
aggregateUniverseWorker.on('failed', (job, err) => {
  console.error(`[AggregateUniverse] Job ${job?.id} failed:`, err);
});

fetchSourceWorker.on('failed', (job, err) => {
  console.error(`[FetchSource] Job ${job?.id} failed:`, err);
});

processContentWorker.on('failed', (job, err) => {
  console.error(`[ProcessContent] Job ${job?.id} failed:`, err);
});
