/**
 * Исправляет HTML-сущности в заголовках и текстах контента в базе данных.
 * Запуск: npx tsx --env-file=.env scripts/fix-html-entities.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { content } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    // Числовые десятичные сущности &#8217; → '
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Числовые шестнадцатеричные &#x2019; → '
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Именованные
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

async function main() {
  console.log('🔧 Исправляем HTML-сущности в контенте...\n');

  // Берём все записи с HTML-сущностями в заголовке
  const rows = await db.execute(
    sql`SELECT id, title, body FROM content WHERE title LIKE '%&#%' OR title LIKE '%&amp;%' OR body LIKE '%&#%'`
  ) as unknown as { id: string; title: string; body: string | null }[];

  console.log(`   Найдено записей для исправления: ${rows.length}`);

  let fixed = 0;
  for (const row of rows) {
    const newTitle = decodeHtmlEntities(row.title);
    const newBody = row.body ? decodeHtmlEntities(row.body) : null;

    if (newTitle !== row.title || newBody !== row.body) {
      await db.execute(
        sql`UPDATE content SET title = ${newTitle}, body = ${newBody} WHERE id = ${row.id}`
      );
      fixed++;
    }
  }

  console.log(`   ✅ Исправлено: ${fixed} записей`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
