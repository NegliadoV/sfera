/**
 * Сидер: один пользователь, вселенные (quantum, urban, embroidery, philosophy), контент.
 * Запуск (при поднятой БД): npm run db:seed
 */
import { db } from '../lib/db';
import { user, universes, content } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  console.log('Seeding...');

  try {
    await db.insert(user).values({
      id: SEED_USER_ID,
      name: 'Сид-пользователь',
      email: 'seed@horizon.local',
    });
    console.log('Created seed user');
  } catch (err: unknown) {
    const code = (err as { code?: string; cause?: { code?: string } })?.code
      ?? (err as { cause?: { code?: string } })?.cause?.code;
    if (code === '23505') {
      console.log('Seed user already exists');
    } else throw err;
  }

  const universeSlugs = [
    { slug: 'quantum', name: 'Квантовая физика', description: 'Пространство для обсуждения квантовой механики, квантовой теории поля и смежных областей.' },
    { slug: 'urban', name: 'Урбанистика 80-х', description: 'Градостроительство, архитектура и городская культура 1980-х годов.' },
    { slug: 'embroidery', name: 'Вышивание крестиком', description: 'Обмен схемами, техниками и традициями вышивания.' },
    { slug: 'philosophy', name: 'Философия сознания', description: 'Природа сознания, проблема «разум-тело», ИИ и феноменология.' },
  ];

  for (const u of universeSlugs) {
    const [existing] = await db.select({ id: universes.id }).from(universes).where(eq(universes.slug, u.slug));
    let universeId: string;
    if (existing) {
      universeId = existing.id;
      console.log('Universe exists:', u.slug);
    } else {
      const [inserted] = await db.insert(universes).values({
        slug: u.slug,
        name: u.name,
        description: u.description,
        ownerId: SEED_USER_ID,
      }).returning({ id: universes.id });
      if (!inserted) throw new Error('Failed to insert universe');
      universeId = inserted.id;
      console.log('Created universe:', u.slug);
    }
    if (u.slug === 'quantum') {
      const existingContent = await db.select().from(content).where(eq(content.universeId, universeId)).limit(1);
      if (existingContent.length === 0) {
        await db.insert(content).values([
          {
            universeId,
            authorId: SEED_USER_ID,
            type: 'article',
            title: 'Копенгагенская интерпретация',
            body: 'Краткое введение в интерпретацию квантовой механики.',
            url: 'https://ru.wikipedia.org/wiki/Копенгагенская_интерпретация',
          },
          {
            universeId,
            authorId: SEED_USER_ID,
            type: 'link',
            title: 'Квантовая запутанность',
            url: 'https://example.com/entanglement',
          },
        ]);
        console.log('Created 2 content items in quantum');
      }
    }
  }

  console.log('Seed done.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
