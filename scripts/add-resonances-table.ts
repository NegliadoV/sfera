import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔧 Creating content_resonances table...');

  try {
    // Create the enum type first (ignore if exists)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE resonance_type AS ENUM (
          'insight', 'ignite', 'ponder', 'resonate', 'inspire', 'challenge'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('✅ resonance_type enum created (or already exists)');

    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_resonances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type resonance_type NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ content_resonances table created');

    // Unique index: one resonance type per user per post
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS content_resonances_user_content_idx
      ON content_resonances(content_id, user_id);
    `);
    console.log('✅ unique index created');

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

main();
