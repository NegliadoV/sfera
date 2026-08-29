/**
 * Миграция: добавляет таблицу content_moderation и поле hidden в content.
 * Запуск: npx tsx --env-file=.env scripts/add-moderation-table.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔧 Создаём таблицу модерации...\n');

  // 1. Поле hidden в content
  await db.execute(sql`
    ALTER TABLE content 
    ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false
  `);
  console.log('   ✅ content.hidden добавлен');

  // 2. Таблица content_moderation
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_moderation (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_review', 'rejected')),
      score integer,
      verdict_reason text,
      report jsonb,
      moderated_at timestamp with time zone,
      model_used text DEFAULT 'rules-v1',
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  console.log('   ✅ content_moderation создана');

  // 3. Индекс для быстрого поиска pending задач
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_content_moderation_pending 
    ON content_moderation(status, created_at) 
    WHERE status = 'pending'
  `);
  console.log('   ✅ Индекс idx_content_moderation_pending создан');

  // 4. Индекс для быстрого поиска по content_id
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_content_moderation_content_id
    ON content_moderation(content_id)
  `);
  console.log('   ✅ Индекс idx_content_moderation_content_id создан\n');

  console.log('🎉 Миграция завершена!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
