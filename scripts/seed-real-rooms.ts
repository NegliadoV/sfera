/**
 * Создание 9 красивых реальных комнат знаний для запуска Roominate.
 * Удаляет тестовые комнаты, потом добавляет реальные.
 * Запуск: npx tsx --env-file=.env scripts/seed-real-rooms.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { db } from '../lib/db';
import {
  universes,
  universeMembers,
} from '../lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001';

// Слаги тестовых/мусорных комнат которые нужно снести
const TEST_SLUGS = [
  // Тестовые/мусорные (удалены ранее, но на всякий случай)
  'axsdas', 'фыв', 'gossip', 'asd-as-d', 'вышивание-крестиком', 'embroidery', 'splotni', 'сплетни',
  // Старые комнаты с неправильными именами/слагами
  'quantum',   // "Квантовая физика" → заменена на science-tech
  'море',      // "Море" → не тематика платформы
  'urban',     // "Урбанистика 80-х" → заменена на urbanism
];

// Реальные красивые комнаты
const REAL_ROOMS = [
  {
    slug: 'philosophy',
    name: 'Философия',
    description: 'Большие вопросы бытия, этики и сознания. Обсуждаем идеи великих мыслителей и строим собственные концепции.',
    icon: 'fa-brain',
    sphereColor: '#7c3aed',
  },
  {
    slug: 'science-tech',
    name: 'Наука и технологии',
    description: 'Квантовая физика, ИИ, космос, биотехнологии — следим за рубежами научного прогресса вместе.',
    icon: 'fa-atom',
    sphereColor: '#2563eb',
  },
  {
    slug: 'urbanism',
    name: 'Урбанистика',
    description: 'Города будущего, умная среда, архитектура и транспорт. Как пространство меняет жизнь людей.',
    icon: 'fa-city',
    sphereColor: '#059669',
  },
  {
    slug: 'productivity',
    name: 'Продуктивность',
    description: 'Системы мышления, GTD, Zettelkasten, ментальные модели. Как думать эффективнее и успевать больше.',
    icon: 'fa-bolt',
    sphereColor: '#d97706',
  },
  {
    slug: 'art-design',
    name: 'Искусство и дизайн',
    description: 'UX, графика, визуальная культура и эстетика. Пространство для творческого взгляда на мир.',
    icon: 'fa-palette',
    sphereColor: '#db2777',
  },
  {
    slug: 'books',
    name: 'Книги и идеи',
    description: 'Нон-фикшн, разборы, цитаты и рецензии. Обсуждаем книги, которые меняют мышление.',
    icon: 'fa-book-open',
    sphereColor: '#0891b2',
  },
  {
    slug: 'nature-travel',
    name: 'Природа и путешествия',
    description: 'Красота планеты, экология, маршруты и впечатления. Для тех, кто исследует мир за пределами экрана.',
    icon: 'fa-water',
    sphereColor: '#0284c7',
  },
  {
    slug: 'learning',
    name: 'Обучение',
    description: 'Онлайн-курсы, подкасты, образовательные ресурсы. Учимся новому каждый день — делимся находками.',
    icon: 'fa-graduation-cap',
    sphereColor: '#7c3aed',
  },
  {
    slug: 'news-politics',
    name: 'Новости и политика',
    description: 'Анализ событий, политические тренды и международные отношения. Разбираемся в происходящем вместе.',
    icon: 'fa-newspaper',
    sphereColor: '#475569',
  },
];

async function run() {
  console.log('🧹 Удаляем тестовые комнаты...');

  // Найдём ID тестовых комнат по слагу
  const testRooms = await db
    .select({ id: universes.id, name: universes.name })
    .from(universes)
    .where(inArray(universes.slug, TEST_SLUGS));

  if (testRooms.length > 0) {
    const testIds = testRooms.map((r) => r.id);
    console.log(`   Найдено тестовых комнат: ${testRooms.map((r) => r.name).join(', ')}`);

    // Удаляем через CASCADE по universeId используя raw SQL для безопасности
    for (const id of testIds) {
      // Все зависимые таблицы имеют ON DELETE CASCADE от universes.id
      // поэтому удаляем только запись в universes
      await db.execute(sql`DELETE FROM universes WHERE id = ${id}`);
    }

    console.log(`   ✅ Удалено ${testRooms.length} тестовых комнат`);
  } else {
    console.log('   Тестовых комнат не найдено, пропускаем');
  }

  console.log('\n🌐 Создаём реальные комнаты знаний...');

  for (const room of REAL_ROOMS) {
    // Проверяем, не существует ли уже
    const existing = await db
      .select({ id: universes.id })
      .from(universes)
      .where(eq(universes.slug, room.slug));

    if (existing.length > 0) {
      console.log(`   ⏭️  Комната «${room.name}» уже существует, пропускаем`);
      continue;
    }

    const [created] = await db
      .insert(universes)
      .values({
        slug: room.slug,
        name: room.name,
        description: room.description,
        icon: room.icon,
        sphereColor: room.sphereColor,
        ownerId: SEED_USER_ID,
        isPrivate: false,
      })
      .returning({ id: universes.id });

    // Добавляем seed-пользователя как владельца
    await db.insert(universeMembers).values({
      universeId: created.id,
      userId: SEED_USER_ID,
      role: 'owner',
    });

    console.log(`   ✅ Создана: «${room.name}» (/${room.slug})`);
  }

  console.log('\n🎉 Готово! Все реальные комнаты созданы.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
