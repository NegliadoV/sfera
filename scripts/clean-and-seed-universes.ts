/**
 * Очистка базы: удаление всех каналов (источников), контента, комнат, карт и вселенных.
 * Затем создание 5 базовых вселенных.
 * Запуск: npm run db:clean-seed
 */
import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  user,
  universes,
  universeMembers,
  content,
  comments,
  reactions,
  contentLinks,
  sources,
  universeAggregatorSettings,
  themes,
  rooms,
  roomRounds,
  roomParticipants,
  roomChatMessages,
  mindMaps,
  mindMapNodes,
  mindMapEdges,
} from '../lib/db/schema';

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001';

const BASE_UNIVERSES = [
  { slug: 'knowledge', name: 'База знаний', description: 'Общая вселенная для накопления и структурирования знаний. Статьи, ссылки и обсуждения.' },
  { slug: 'ideas', name: 'Идеи и гипотезы', description: 'Пространство для идей, гипотез и их развития через дискуссии и связи.' },
  { slug: 'readings', name: 'Чтения и рефлексия', description: 'Контент для вдумчивого чтения, рефлексии и обмена впечатлениями.' },
  { slug: 'projects', name: 'Проекты', description: 'Проектная работа: материалы, задачи и обсуждения в контексте конкретных проектов.' },
  { slug: 'community', name: 'Сообщество', description: 'Общие обсуждения, анонсы и обмен опытом участников платформы.' },
];

async function run() {
  console.log('Cleaning database (channels, content, rooms, mind maps, universes)...');

  // Порядок удаления: от зависимых таблиц к universes (реакции не имеют FK на content/comment, удаляем вручную)
  await db.delete(roomChatMessages).where(sql`true`);
  await db.delete(roomParticipants).where(sql`true`);
  await db.delete(roomRounds).where(sql`true`);
  await db.delete(rooms).where(sql`true`);
  await db.delete(mindMapEdges).where(sql`true`);
  await db.delete(mindMapNodes).where(sql`true`);
  await db.delete(mindMaps).where(sql`true`);
  await db.delete(contentLinks).where(sql`true`);
  await db.delete(reactions).where(sql`true`);
  await db.delete(comments).where(sql`true`);
  await db.delete(content).where(sql`true`);
  await db.delete(sources).where(sql`true`);
  await db.delete(universeAggregatorSettings).where(sql`true`);
  await db.delete(themes).where(sql`true`);
  await db.delete(universeMembers).where(sql`true`);
  await db.delete(universes).where(sql`true`);

  console.log('Database cleaned.');

  // Сид-пользователь как владелец вселенных
  try {
    await db.insert(user).values({
      id: SEED_USER_ID,
      name: 'Сид-пользователь',
      email: 'seed@horizon.local',
    });
    console.log('Created seed user');
  } catch (err: unknown) {
    const code = (err as { cause?: { code?: string }; code?: string })?.cause?.code ?? (err as { code?: string })?.code;
    if (code === '23505') {
      console.log('Seed user already exists');
    } else throw err;
  }

  console.log('Creating 5 base universes...');
  for (const u of BASE_UNIVERSES) {
    await db.insert(universes).values({
      slug: u.slug,
      name: u.name,
      description: u.description,
      ownerId: SEED_USER_ID,
    });
    console.log('  -', u.slug, u.name);
  }

  console.log('Done. 5 base universes created.');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
