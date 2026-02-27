/**
 * Создаёт таблицу content_tracking для отслеживания постов пользователями.
 * Запуск: npx tsx scripts/add-content-tracking.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "content_tracking" (
        "content_id" uuid NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY ("content_id", "user_id")
      )
    `);
    console.log('OK: таблица content_tracking создана (или уже была).');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
