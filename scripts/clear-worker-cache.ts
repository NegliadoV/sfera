/**
 * Очистка очередей и кеша воркера агрегатора.
 * Удаляет все задачи из очередей BullMQ (wait, active, completed, failed, delayed).
 * Запуск: npm run clear-worker-cache или tsx scripts/clear-worker-cache.ts
 */
import 'dotenv/config';
import {
  aggregateUniverseQueue,
  fetchSourceQueue,
  processContentQueue,
} from '../lib/aggregator/queue';

async function getQueueStats(queue: typeof aggregateUniverseQueue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed, total: waiting + active + completed + failed + delayed };
}

async function clearQueue(queue: typeof aggregateUniverseQueue, name: string) {
  const statsBefore = await getQueueStats(queue);
  console.log(`\n📊 ${name}:`);
  console.log(`   Ожидают: ${statsBefore.waiting}, Активны: ${statsBefore.active}, Завершены: ${statsBefore.completed}, Ошибки: ${statsBefore.failed}, Отложены: ${statsBefore.delayed}`);
  console.log(`   Всего задач: ${statsBefore.total}`);

  if (statsBefore.total === 0) {
    console.log(`   ✓ Очередь уже пуста`);
    return;
  }

  await queue.obliterate({ force: true });
  const statsAfter = await getQueueStats(queue);
  console.log(`   ✓ Очищено. Осталось задач: ${statsAfter.total}`);
}

async function main() {
  console.log('🧹 Очистка очередей воркера агрегатора...\n');

  try {
    await clearQueue(aggregateUniverseQueue, 'aggregate-universe');
    await clearQueue(fetchSourceQueue, 'fetch-source');
    await clearQueue(processContentQueue, 'process-content');

    console.log('\n✅ Очистка завершена. Очереди пусты.');
    console.log('   Перезапустите воркер: npm run worker');
  } catch (error) {
    console.error('\n❌ Ошибка при очистке:', error);
    process.exit(1);
  } finally {
    await Promise.all([
      aggregateUniverseQueue.close(),
      fetchSourceQueue.close(),
      processContentQueue.close(),
    ]);
  }
}

main();
