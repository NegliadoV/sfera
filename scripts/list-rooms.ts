import 'dotenv/config';
import { db } from '../lib/db';
import { universes } from '../lib/db/schema';

async function main() {
  const all = await db.select({ slug: universes.slug, name: universes.name }).from(universes).orderBy(universes.name);
  console.log('\n📋 Текущие комнаты в базе:');
  all.forEach(r => console.log(`  - "${r.slug}": ${r.name}`));
  console.log(`\nВсего: ${all.length} комнат`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
