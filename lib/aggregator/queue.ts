import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './redisConnection';

const connection = getRedisConnectionOptions();

// Очередь для агрегации контента по вселенной
export const aggregateUniverseQueue = new Queue('aggregate-universe', {
  connection,
  skipVersionCheck: true, // для Redis 3.x (например Windows build)
});

// Очередь для получения контента из источника
export const fetchSourceQueue = new Queue('fetch-source', {
  connection,
  skipVersionCheck: true,
});

// Очередь для обработки отдельного элемента контента
export const processContentQueue = new Queue('process-content', {
  connection,
  skipVersionCheck: true,
});
