/**
 * Добавляет значение 'telegram' в enum source_provider в БД.
 * Запуск: npx tsx scripts/add-source-provider-telegram.ts
 * Используйте этот скрипт, если db:migrate падает из-за рассинхрона истории миграций.
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`SET client_min_messages TO WARNING`);
    await sql.unsafe(
      `ALTER TYPE "public"."source_provider" ADD VALUE IF NOT EXISTS 'telegram'`
    );
    console.log("OK: значение 'telegram' добавлено в enum source_provider (или уже было).");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
