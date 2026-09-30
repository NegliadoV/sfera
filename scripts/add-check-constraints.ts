/**
 * Add CHECK constraints to prevent invalid data
 *
 * Prevents negative balances, prices, and counts
 * Run: npx tsx --env-file=.env scripts/add-check-constraints.ts
 */

import { config } from 'dotenv';
import path from 'path';

const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
config({ path: path.resolve(rootDir, '../.env') });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔒 Adding CHECK constraints...\n');

  const constraints = [
    {
      name: 'user_crystals_nonnegative',
      sql: `ALTER TABLE "user"
            ADD CONSTRAINT user_crystals_nonnegative
            CHECK (crystals >= 0)`,
      reason: 'Prevent negative crystal balance',
    },
    {
      name: 'universes_price_positive',
      sql: `ALTER TABLE universes
            ADD CONSTRAINT universes_price_positive
            CHECK (monthly_price IS NULL OR monthly_price >= 0)`,
      reason: 'Prevent negative universe price',
    },
    {
      name: 'content_saves_nonnegative',
      sql: `ALTER TABLE content
            ADD CONSTRAINT content_saves_nonnegative
            CHECK (saves_count >= 0)`,
      reason: 'Prevent negative saves count',
    },
    {
      name: 'shorts_views_nonnegative',
      sql: `ALTER TABLE shorts
            ADD CONSTRAINT shorts_views_nonnegative
            CHECK (views_count >= 0)`,
      reason: 'Prevent negative views count',
    },
    {
      name: 'shorts_likes_nonnegative',
      sql: `ALTER TABLE shorts
            ADD CONSTRAINT shorts_likes_nonnegative
            CHECK (likes_count >= 0)`,
      reason: 'Prevent negative likes count',
    },
    {
      name: 'crystal_transactions_amount_positive',
      sql: `ALTER TABLE crystal_transactions
            ADD CONSTRAINT crystal_transactions_amount_positive
            CHECK (amount > 0)`,
      reason: 'Prevent zero or negative crystal transfers',
    },
  ];

  let success = 0;
  let failed = 0;

  for (const { name, sql: constraintSql, reason } of constraints) {
    try {
      console.log(`🔒 Adding ${name}...`);
      console.log(`   Reason: ${reason}`);
      await db.execute(sql.raw(constraintSql));
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
  console.log(`✅ Added/verified: ${success}/${constraints.length} constraints`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} constraints`);
  }
  console.log('════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
