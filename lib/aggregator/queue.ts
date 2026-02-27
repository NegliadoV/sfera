import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Очередь для агрегации контента по вселенной
export const aggregateUniverseQueue = new Queue('aggregate-universe', {
  connection: redisConnection,
  skipVersionCheck: true, // для Redis 3.x (например Windows build)
});

// Очередь для получения контента из источника
export const fetchSourceQueue = new Queue('fetch-source', {
  connection: redisConnection,
  skipVersionCheck: true,
});

// Очередь для обработки отдельного элемента контента
export const processContentQueue = new Queue('process-content', {
  connection: redisConnection,
  skipVersionCheck: true,
});

export { redisConnection };
