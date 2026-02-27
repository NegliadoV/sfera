/**
 * Добавляет поле image_url в таблицу content (если его нет).
 * Запуск: npx tsx scripts/add-content-image-url.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`SET client_min_messages TO WARNING`);
    await sql.unsafe(`ALTER TABLE "public"."content" ADD COLUMN IF NOT EXISTS "image_url" text`);
    console.log("OK: поле image_url добавлено в таблицу content (или уже было).");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
