/**
 * Воркер для обработки задач агрегации контента
 * Запуск: npm run worker или tsx scripts/worker.ts
 */
import 'dotenv/config';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MIN_REDIS_VERSION = 5;

function parseRedisVersion(info: string): number | null {
  const m = info.match(/redis_version:(\d+\.\d+\.\d+)/i) || info.match(/redis_version:(\d+\.\d+)/i);
  if (!m) return null;
  const parts = m[1].split('.').map(Number);
  return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

async function checkRedisVersion(): Promise<void> {
  const r = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
  try {
    const info = await r.info('server');
    const ver = parseRedisVersion(info);
    const verStr = (info.match(/redis_version:([^\r\n]+)/i) || [])[1] || '?';
    if (ver !== null && ver < MIN_REDIS_VERSION * 10000) {
      console.error('');
      console.error('❌ ОШИБКА: Redis версии ' + verStr + ' слишком старая.');
      console.error('');
      console.error('   BullMQ (очередь воркера) требует Redis 5.0 или выше.');
      console.error('   Redis 3.x не поддерживает Streams (XADD, XTRIM) и другие команды.');
      console.error('');
      console.error('   Варианты на Windows:');
      console.error('     1. Memurai (Redis 7): https://www.memurai.com/');
      console.error('     2. Docker: docker run -p 6379:6379 redis:7-alpine');
      console.error('     3. WSL2: sudo apt install redis-server');
      console.error('');
      process.exit(1);
    }
    console.log('   Redis: ' + verStr + ' ✓');
  } finally {
    await r.quit();
  }
}

let aggregateUniverseWorker: { close: () => Promise<void> };
let fetchSourceWorker: { close: () => Promise<void> };
let processContentWorker: { close: () => Promise<void> };

async function main() {
  console.log('Проверка Redis...');
  await checkRedisVersion();

  const worker = await import('../lib/aggregator/worker');
  aggregateUniverseWorker = worker.aggregateUniverseWorker;
  fetchSourceWorker = worker.fetchSourceWorker;
  processContentWorker = worker.processContentWorker;

  console.log('');
  console.log('🚀 Запуск воркеров агрегатора...');
  console.log('  ✓ AggregateUniverse (лимит: 1 задача / 5 сек, до 2 параллельно)');
  console.log('  ✓ FetchSource (лимит: 2 задачи / 3 сек, до 3 параллельно)');
  console.log('  ✓ ProcessContent (лимит: 10 задач / 2 сек, до 5 параллельно)');
  console.log('');
  console.log('Воркеры работают в фоне и обрабатывают задачи из очереди.');
  console.log('Для остановки нажмите Ctrl+C');
  console.log('');
}

function shutdown() {
  console.log('\nShutting down workers...');
  const closes = [
    aggregateUniverseWorker?.close?.() ?? Promise.resolve(),
    fetchSourceWorker?.close?.() ?? Promise.resolve(),
    processContentWorker?.close?.() ?? Promise.resolve(),
  ];
  Promise.all(closes).then(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});
