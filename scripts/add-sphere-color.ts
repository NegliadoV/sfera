/**
 * Добавляет поле sphere_color в таблицу universes (если его нет).
 * Запуск: npx tsx scripts/add-sphere-color.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`SET client_min_messages TO WARNING`);
    await sql.unsafe(`ALTER TABLE "public"."universes" ADD COLUMN IF NOT EXISTS "sphere_color" text`);
    console.log('OK: поле sphere_color добавлено в таблицу universes (или уже было).');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
