/**
 * Performance Indexes: Critical + High Priority
 *
 * Добавляет недостающие индексы для устранения N+1 queries и ускорения JOIN'ов.
 * Запуск: npx tsx --env-file=.env scripts/add-critical-indexes.ts
 */

import { config } from 'dotenv';
import path from 'path';

const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
config({ path: path.resolve(rootDir, '../.env') });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔧 Adding critical performance indexes...\n');

  const indexes = [
    // ═══════════════════════════════════════════════════════════════
    // CRITICAL: Eliminate N+1 queries and slow JOINs
    // ═══════════════════════════════════════════════════════════════

    {
      name: 'idx_content_universe_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_universe_created
            ON content(universe_id, created_at DESC)
            WHERE hidden = false`,
      reason: 'Feed query (universe → posts). Used in /api/content GET.',
    },

    {
      name: 'idx_comments_content_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_comments_content_created
            ON comments(content_id, created_at ASC)`,
      reason: 'Comments list (post → comments). Used in /api/content/[id]/comments GET.',
    },

    {
      name: 'idx_notifications_user_read_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
            ON notifications(user_id, read_at NULLS FIRST, created_at DESC)`,
      reason: 'User notifications (unread first). Used in notification feed.',
    },

    {
      name: 'idx_direct_messages_conversation_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created
            ON direct_messages(conversation_id, created_at DESC)`,
      reason: 'DM history (conversation → messages). Used in /messages/[id].',
    },

    {
      name: 'idx_group_chat_messages_group_created',
      sql: `CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_created
            ON group_chat_messages(group_id, created_at DESC)`,
      reason: 'Group chat history. Used in /messages/group/[id].',
    },

    {
      name: 'idx_content_author',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_author
            ON content(author_id, created_at DESC)`,
      reason: 'User profile posts (user → their posts). Used in /profile/[id].',
    },

    {
      name: 'idx_comments_author',
      sql: `CREATE INDEX IF NOT EXISTS idx_comments_author
            ON comments(author_id, created_at DESC)`,
      reason: 'User profile comments. Used in /profile/[id].',
    },

    {
      name: 'idx_user_content_user_updated',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_content_user_updated
            ON user_content(user_id, created_at DESC)`,
      reason: 'Personal aggregated feed (user → content). Used in /me/digest.',
    },

    // ═══════════════════════════════════════════════════════════════
    // HIGH: Foreign key indexes (missing auto-index)
    // ═══════════════════════════════════════════════════════════════

    {
      name: 'idx_account_user',
      sql: `CREATE INDEX IF NOT EXISTS idx_account_user
            ON account(user_id)`,
      reason: 'OAuth account lookup (user → accounts). Used in auth flow.',
    },

    {
      name: 'idx_universe_members_universe',
      sql: `CREATE INDEX IF NOT EXISTS idx_universe_members_universe
            ON universe_members(universe_id)`,
      reason: 'Universe membership check. Used in permission guards.',
    },

    {
      name: 'idx_universe_members_user',
      sql: `CREATE INDEX IF NOT EXISTS idx_universe_members_user
            ON universe_members(user_id)`,
      reason: 'User memberships list. Used in /me/universes.',
    },

    {
      name: 'idx_sources_universe',
      sql: `CREATE INDEX IF NOT EXISTS idx_sources_universe
            ON sources(universe_id)
            WHERE enabled = true`,
      reason: 'Active sources per universe. Used in aggregator worker.',
    },

    {
      name: 'idx_user_sources_user_enabled',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_sources_user_enabled
            ON user_sources(user_id, enabled)
            WHERE enabled = true`,
      reason: 'Active user sources. Used in personal aggregator.',
    },

    {
      name: 'idx_mind_map_nodes_map',
      sql: `CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_map
            ON mind_map_nodes(mind_map_id)`,
      reason: 'Mind map nodes lookup. Used in /me/mind-maps/[id].',
    },

    {
      name: 'idx_mind_map_edges_map',
      sql: `CREATE INDEX IF NOT EXISTS idx_mind_map_edges_map
            ON mind_map_edges(mind_map_id)`,
      reason: 'Mind map edges lookup. Used in /me/mind-maps/[id].',
    },

    {
      name: 'idx_universe_tracking_universe',
      sql: `CREATE INDEX IF NOT EXISTS idx_universe_tracking_universe
            ON universe_tracking(universe_id)`,
      reason: 'Tracked universe subscribers. Used for notifications.',
    },

    {
      name: 'idx_live_space_participants_space',
      sql: `CREATE INDEX IF NOT EXISTS idx_live_space_participants_space
            ON live_space_participants(space_id)
            WHERE left_at IS NULL`,
      reason: 'Active space participants. Used in /rooms/[id].',
    },

    // ═══════════════════════════════════════════════════════════════
    // MEDIUM: JSONB and specialized queries
    // ═══════════════════════════════════════════════════════════════

    {
      name: 'idx_content_tags_gin',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_tags_gin
            ON content USING GIN(tags jsonb_path_ops)`,
      reason: 'Tag filtering (WHERE tags ?| ARRAY[...]). Used in /api/content GET.',
    },

    {
      name: 'idx_user_content_views_user_viewed',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_content_views_user_viewed
            ON user_content_views(user_id, last_viewed_at DESC)`,
      reason: 'User view history (for smart feed). Used in recommendation engine.',
    },

    {
      name: 'idx_content_resonances_content',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_resonances_content
            ON content_resonances(content_id, type)`,
      reason: 'Resonance counts per post. Used in content cards.',
    },

    {
      name: 'idx_content_links_from',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_links_from
            ON content_links(from_content_id)`,
      reason: 'Outgoing links (content → related). Used in mind maps.',
    },

    {
      name: 'idx_content_links_to',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_links_to
            ON content_links(to_content_id)`,
      reason: 'Incoming links (backlinks). Used in content detail.',
    },

    {
      name: 'idx_comments_parent',
      sql: `CREATE INDEX IF NOT EXISTS idx_comments_parent
            ON comments(parent_id)
            WHERE parent_id IS NOT NULL`,
      reason: 'Threaded comments (parent → children). Used in comment tree.',
    },

    {
      name: 'idx_content_source',
      sql: `CREATE INDEX IF NOT EXISTS idx_content_source
            ON content(source_id, created_at DESC)
            WHERE source_id IS NOT NULL`,
      reason: 'Content by source (source → posts). Used in source detail page.',
    },
  ];

  let success = 0;
  let failed = 0;

  for (const { name, sql: indexSql, reason } of indexes) {
    try {
      console.log(`📍 Creating ${name}...`);
      console.log(`   Reason: ${reason}`);
      await db.execute(sql.raw(indexSql));
      console.log(`   ✅ Success\n`);
      success++;
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`   ⏭️  Already exists\n`);
        success++;
      } else {
        console.error(`   ❌ Failed: ${err.message}\n`);
        failed++;
      }
    }
  }

  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ Created/verified: ${success}/${indexes.length} indexes`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} indexes`);
  }
  console.log('════════════════════════════════════════════════════════════\n');

  console.log('📊 Next steps:');
  console.log('1. Run ANALYZE on large tables: ANALYZE content; ANALYZE comments;');
  console.log('2. Check query plans with EXPLAIN ANALYZE');
  console.log('3. Monitor slow_query_log for queries >100ms');
  console.log('4. Consider adding CHECK constraints (see db-schema-review report)');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
