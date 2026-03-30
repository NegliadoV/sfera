import { db } from './lib/db';
import { content, user, universes } from './lib/db/schema';
import { desc, eq } from 'drizzle-orm';

async function test() {
  try {
    const list = await db
      .select({
        id: content.id,
        savesCount: content.savesCount,
      })
      .from(content)
      .leftJoin(user, eq(content.authorId, user.id))
      .innerJoin(universes, eq(content.universeId, universes.id))
      .orderBy(desc(content.savesCount), desc(content.createdAt))
      .limit(50);
    console.log('Success:', list.length);
  } catch(e) {
    console.error('DB Error details:', e);
  }
}
test();
