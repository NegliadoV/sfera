/**
 * Очередь задач агрегатора на PostgreSQL (без Redis).
 * Добавляйте задачи через addAggregateJob(), воркер берёт их через claimNextJob().
 */
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function addAggregateJob(universeId: string): Promise<string> {
  const result = await db.execute<{ id: string }>(sql`
    INSERT INTO aggregator_jobs (universe_id, status)
    VALUES (${universeId}, 'pending')
    RETURNING id
  `);
  const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? [];
  const row = rows[0] as { id: string } | undefined;
  if (!row) throw new Error('Failed to create aggregate job');
  return row.id;
}

/**
 * Берёт следующую задачу из очереди (атомарно).
 * Возвращает job или null, если очередь пуста.
 */
export async function claimNextJob(): Promise<{
  id: string;
  universeId: string;
} | null> {
  // Атомарно: берём первую pending и помечаем processing в одном запросе
  const result = await db.execute(sql`
    UPDATE aggregator_jobs
    SET status = 'processing', started_at = now()
    WHERE id = (
      SELECT id FROM aggregator_jobs
      WHERE status = 'pending'
      ORDER BY created_at
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, universe_id
  `);

  // postgres.js возвращает массив строк
  const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? [];
  const row = rows[0] as { id: string; universe_id: string } | undefined;
  if (!row) return null;

  return { id: row.id, universeId: row.universe_id };
}

export async function completeJob(
  jobId: string,
  result: { processed: number }
): Promise<void> {
  await db.execute(sql`
    UPDATE aggregator_jobs
    SET status = 'completed', result = ${JSON.stringify(result)}, completed_at = now()
    WHERE id = ${jobId}
  `);
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await db.execute(sql`
    UPDATE aggregator_jobs
    SET status = 'failed', error = ${error}, completed_at = now()
    WHERE id = ${jobId}
  `);
}
