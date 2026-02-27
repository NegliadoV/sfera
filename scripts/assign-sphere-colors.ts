/**
 * Присваивает случайные оттенки сфер всем вселенным, у которых sphere_color ещё не задан.
 * Запуск: npx tsx scripts/assign-sphere-colors.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    // Обновляем все вселенные с NULL sphere_color — присваиваем случайный индекс 0–7
    const result = await sql`
      UPDATE universes
      SET sphere_color = (floor(random() * 8))::text
      WHERE sphere_color IS NULL
      RETURNING id, slug, sphere_color
    `;
    console.log(`OK: присвоены цвета ${result.length} сферам.`);
    if (result.length > 0) {
      result.forEach((r) => console.log(`  ${r.slug} → ${r.sphere_color}`));
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
