/**
 * Создаёт таблицы universe_tracking и notifications для уведомлений о новых постах в сфере.
 * Запуск: npx tsx scripts/add-universe-tracking-notifications.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`
      DROP TABLE IF EXISTS "content_tracking";
    `);
    console.log('OK: content_tracking удалена (если была).');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "universe_tracking" (
        "universe_id" uuid NOT NULL REFERENCES "universes"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        PRIMARY KEY ("universe_id", "user_id")
      )
    `);
    console.log('OK: таблица universe_tracking создана (или уже была).');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "universe_id" uuid NOT NULL REFERENCES "universes"("id") ON DELETE CASCADE,
        "content_id" uuid NOT NULL REFERENCES "content"("id") ON DELETE CASCADE,
        "read_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('OK: таблица notifications создана (или уже была).');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
