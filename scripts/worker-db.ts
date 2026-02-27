/**
 * Воркер агрегатора на PostgreSQL (без Redis).
 * 1. Опрашивает очередь aggregator_jobs и обрабатывает задачи
 * 2. Каждые 30 мин автоматически подтягивает новые посты из всех источников
 * Запуск: npm run worker
 */
import 'dotenv/config';
import {
  claimNextJob,
  completeJob,
  failJob,
} from '../lib/aggregator/queue-db';
import {
  aggregateUniverseSync,
  getUniverseIdsWithEnabledSources,
} from '../lib/aggregator/functions';

const POLL_INTERVAL_MS = 3000;
const AUTO_AGGREGATE_INTERVAL_MS = 30 * 60 * 1000; // 30 минут

let running = true;
let lastAutoAggregate = Date.now(); // Первый авто-запуск через 30 мин

async function runAutoAggregate() {
  try {
    const universeIds = await getUniverseIdsWithEnabledSources();
    if (universeIds.length === 0) return;

    console.log(`[Auto] Автоагрегация: ${universeIds.length} сфер с источниками`);
    for (const universeId of universeIds) {
      try {
        const result = await aggregateUniverseSync(universeId);
        if (result.processed > 0) {
          console.log(`[Auto] ${universeId.substring(0, 8)}: +${result.processed} новых записей`);
        }
      } catch (err) {
        console.error(`[Auto] Ошибка ${universeId.substring(0, 8)}:`, err);
      }
    }
  } catch (err) {
    console.error('[Auto] Ошибка автоагрегации:', err);
  }
}

async function processLoop() {
  console.log('🚀 Воркер агрегатора (PostgreSQL) запущен');
  console.log('   • Очередь: aggregator_jobs');
  console.log('   • Автоагрегация: каждые 30 мин (новые посты из источников)');
  console.log('');
  console.log('Для остановки нажмите Ctrl+C');
  console.log('');

  while (running) {
    try {
      const now = Date.now();
      if (now - lastAutoAggregate >= AUTO_AGGREGATE_INTERVAL_MS) {
        lastAutoAggregate = now;
        await runAutoAggregate();
      }

      const job = await claimNextJob();
      if (job) {
        console.log(`[Worker] Обработка вселенной ${job.universeId.substring(0, 8)}...`);
        try {
          const result = await aggregateUniverseSync(job.universeId);
          await completeJob(job.id, { processed: result.processed });
          console.log(`[Worker] Готово: ${result.processed} элементов`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[Worker] Ошибка:`, msg);
          await failJob(job.id, msg);
        }
      } else {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (err) {
      console.error('[Worker] Ошибка цикла:', err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

process.on('SIGINT', () => {
  console.log('\nОстановка воркера...');
  running = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  running = false;
  process.exit(0);
});

processLoop().catch((err) => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
