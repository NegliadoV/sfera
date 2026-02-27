/**
 * Добавляет колонку user_tag в таблицу user для личного тега (@bublik33).
 * Запуск: npx tsx scripts/add-user-tag.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`SET client_min_messages TO WARNING`);

    await sql.unsafe(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "user_tag" text UNIQUE;
    `);
    console.log('OK: user_tag column added to user table');

    console.log('Done: user_tag добавлена.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
