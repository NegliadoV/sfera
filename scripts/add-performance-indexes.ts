import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🚀 Creating high-performance PostgreSQL indexes...');

  const queries = [
    // 1. Content: ленты сфер и сортировка
    `CREATE INDEX IF NOT EXISTS idx_content_universe_created ON content (universe_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_content_pinned ON content (universe_id, pinned_at DESC) WHERE pinned_at IS NOT NULL;`,

    // 2. Comments: комментарии к постам
    `CREATE INDEX IF NOT EXISTS idx_comments_content_created ON comments (content_id, created_at ASC);`,
    `CREATE INDEX IF NOT EXISTS idx_comments_author ON comments (author_id);`,

    // 3. Notifications: выборка непрочитанных уведомлений
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read_at);`,

    // 4. Content Views & Resonances: реакции и просмотры
    `CREATE INDEX IF NOT EXISTS idx_user_content_views_lookup ON user_content_views (content_id, user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_content_resonances_content_type ON content_resonances (content_id, type);`,
    `CREATE INDEX IF NOT EXISTS idx_content_resonances_user ON content_resonances (user_id);`,

    // 5. Direct Messages: чаты и сообщения
    `CREATE INDEX IF NOT EXISTS idx_dm_conv_created ON direct_messages (conversation_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_dm_unread ON direct_messages (conversation_id, read_at) WHERE read_at IS NULL;`,

    // 6. Universes: поиск по slug и владельцу
    `CREATE INDEX IF NOT EXISTS idx_universes_slug ON universes (slug);`,
    `CREATE INDEX IF NOT EXISTS idx_universes_owner ON universes (owner_id);`,

    // 7. Tracked Universes
    `CREATE INDEX IF NOT EXISTS idx_user_tracking_user ON user_universe_tracking (user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_tracking_universe ON user_universe_tracking (universe_id);`,
  ];

  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
      console.log(`✓ ${q.split('ON ')[1]?.split(';')[0] || q}`);
    } catch (e: any) {
      console.warn(`! Note for query (${q}):`, e.message);
    }
  }

  console.log('✨ All performance indexes created successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
