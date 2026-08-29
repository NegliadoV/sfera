/**
 * Миграция: добавляет таблицу user_content_views и поле smart_feed_enabled в user_hygiene_settings.
 * Запуск: npx tsx --env-file=.env scripts/add-smart-feed-tables.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔧 Создаём таблицы и поля для Умной Ленты (Smart Feed)...\n');

  // 1. Поле smart_feed_enabled в user_hygiene_settings
  await db.execute(sql`
    ALTER TABLE user_hygiene_settings 
    ADD COLUMN IF NOT EXISTS smart_feed_enabled boolean NOT NULL DEFAULT true
  `);
  console.log('   ✅ user_hygiene_settings.smart_feed_enabled добавлен');

  // 2. Таблица user_content_views для отслеживания истории просмотров
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_content_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      universe_id uuid NOT NULL REFERENCES universes(id) ON DELETE CASCADE,
      view_count integer NOT NULL DEFAULT 1,
      last_viewed_at timestamp with time zone DEFAULT now() NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  console.log('   ✅ Таблица user_content_views создана');

  // 3. Уникальный индекс пара (user_id, content_id)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_content_views_user_content
    ON user_content_views(user_id, content_id)
  `);
  console.log('   ✅ Индекс idx_user_content_views_user_content создан');

  // 4. Индекс по user_id + universe_id для быстрого подсчета интересов
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_user_content_views_user_universe
    ON user_content_views(user_id, universe_id)
  `);
  console.log('   ✅ Индекс idx_user_content_views_user_universe создан\n');

  console.log('🎉 Миграция успешно завершена!');
  process.exit(0);
}

main().catch((e) => {
  console.error('Ошибка миграции:', e);
  process.exit(1);
});
