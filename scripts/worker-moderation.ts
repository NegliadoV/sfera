/**
 * Воркер модерации контента.
 * Периодически забирает pending записи из content_moderation,
 * анализирует контент rule-based движком и сохраняет результат.
 * 
 * Запуск: npm run worker:moderation
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { moderateContent, type ContentToModerate } from '../lib/moderation/rules';

const POLL_INTERVAL_MS = 15_000; // 15 сек
const BATCH_SIZE = 10;

interface PendingItem {
  modId: string;
  contentId: string;
  universeId: string;
  title: string;
  body: string | null;
  url: string | null;
  type: string;
  universeSlug: string;
  authorId: string;
  authorEmail: string | null;
  authorName: string | null;
}

async function getPendingBatch(): Promise<PendingItem[]> {
  const rows = await db.execute(sql`
    SELECT
      cm.id         AS "modId",
      c.id          AS "contentId",
      c.universe_id AS "universeId",
      c.title,
      c.body,
      c.url,
      c.type,
      u.slug        AS "universeSlug",
      c.author_id   AS "authorId",
      usr.email     AS "authorEmail",
      usr.name      AS "authorName"
    FROM content_moderation cm
    JOIN content c ON c.id = cm.content_id
    JOIN universes u ON u.id = c.universe_id
    LEFT JOIN "user" usr ON usr.id = c.author_id
    WHERE cm.status = 'pending'
    ORDER BY cm.created_at ASC
    LIMIT ${BATCH_SIZE}
  `) as unknown as PendingItem[];
  return rows;
}

async function processItem(item: PendingItem) {
  const contentToMod: ContentToModerate = {
    id: item.contentId,
    title: item.title,
    body: item.body,
    url: item.url,
    type: item.type,
    universeSlug: item.universeSlug,
    authorId: item.authorId,
  };

  const report = moderateContent(contentToMod);

  // Обновляем запись модерации
  await db.execute(sql`
    UPDATE content_moderation SET
      status         = ${report.status},
      score          = ${report.totalScore},
      verdict_reason = ${report.verdictReason},
      report         = ${JSON.stringify({
        criteria: report.criteria,
        triggeredFlags: report.triggeredFlags,
      })}::jsonb,
      moderated_at   = now(),
      model_used     = 'rules-v1'
    WHERE id = ${item.modId}
  `);

  // Если rejected — скрываем контент
  if (report.status === 'rejected') {
    await db.execute(sql`
      UPDATE content SET hidden = true WHERE id = ${item.contentId}
    `);

    // Уведомляем автора (используем тип 'moderation_rejected')
    await db.execute(sql`
      INSERT INTO notifications (id, user_id, universe_id, content_id, type, created_at)
      VALUES (
        gen_random_uuid(),
        ${item.authorId},
        ${item.universeId},
        ${item.contentId},
        'moderation_rejected',
        now()
      )
      ON CONFLICT DO NOTHING
    `);

    console.log(`   ❌ REJECTED  [score: ${report.totalScore}] — ${item.title.slice(0, 60)}`);
    console.log(`      Flags: ${report.triggeredFlags.join(', ') || 'none'}`);
  } else if (report.status === 'needs_review') {
    // Уведомляем автора что контент ожидает проверки
    await db.execute(sql`
      INSERT INTO notifications (id, user_id, universe_id, content_id, type, created_at)
      VALUES (
        gen_random_uuid(),
        ${item.authorId},
        ${item.universeId},
        ${item.contentId},
        'moderation_review',
        now()
      )
      ON CONFLICT DO NOTHING
    `);

    console.log(`   ⚠️  REVIEW   [score: ${report.totalScore}] — ${item.title.slice(0, 60)}`);
  } else {
    console.log(`   ✅ APPROVED  [score: ${report.totalScore}] — ${item.title.slice(0, 60)}`);
  }
}

async function processBatch() {
  const batch = await getPendingBatch();
  if (batch.length === 0) return;

  console.log(`\n📋 Обрабатываем ${batch.length} материал(а) в очереди модерации...`);

  for (const item of batch) {
    try {
      await processItem(item);
    } catch (err) {
      console.error(`   ⚠️ Ошибка при модерации ${item.contentId}:`, err);
      // Помечаем как approved при ошибке, чтобы не блокировать навечно
      await db.execute(sql`
        UPDATE content_moderation SET
          status       = 'approved',
          verdict_reason = 'Ошибка модератора — одобрено автоматически',
          moderated_at = now()
        WHERE id = ${item.modId}
      `);
    }
  }
}

async function main() {
  console.log('🤖 Воркер модерации запущен');
  console.log(`   Интервал: ${POLL_INTERVAL_MS / 1000}с | Batch: ${BATCH_SIZE}\n`);

  // Первый прогон сразу
  await processBatch();

  setInterval(async () => {
    try {
      await processBatch();
    } catch (err) {
      console.error('[moderation-worker] ошибка цикла:', err);
    }
  }, POLL_INTERVAL_MS);
}

main().catch(e => {
  console.error('Критическая ошибка воркера:', e);
  process.exit(1);
});
