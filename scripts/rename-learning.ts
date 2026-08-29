import 'dotenv/config';
import { db } from '../lib/db';
import { universes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const result = await db
    .update(universes)
    .set({ name: 'Образование' })
    .where(eq(universes.slug, 'learning'))
    .returning({ name: universes.name });
  
  if (result.length > 0) {
    console.log(`✅ Комната переименована: ${result[0].name}`);
  } else {
    console.log('⚠️  Комната "learning" не найдена');
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
