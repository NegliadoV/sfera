/**
 * Подключение реальных RSS-источников к комнатам знаний Roominate.
 * Запуск: npx tsx --env-file=.env scripts/seed-rss-sources.ts
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { universes, sources, aggregatorJobs } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const SEED_USER_ID = '00000000-0000-0000-0000-000000000001';

// Реальные RSS-источники по комнатам
const ROOM_SOURCES: Record<string, { name: string; url: string }[]> = {
  'philosophy': [
    { name: 'Stanford Encyclopedia of Philosophy (новинки)', url: 'https://plato.stanford.edu/rss/sep.xml' },
    { name: 'The Conversation — Philosophy', url: 'https://theconversation.com/us/topics/philosophy-67/articles.atom' },
    { name: 'Aeon Magazine — Philosophy', url: 'https://aeon.co/feed.rss' },
  ],
  'science-tech': [
    { name: 'N+1 (Наука)', url: 'https://nplus1.ru/rss' },
    { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/' },
    { name: 'Хабр — Научпоп', url: 'https://habr.com/ru/rss/hub/popular_science/all/?fl=ru' },
    { name: 'Хабр — ИИ', url: 'https://habr.com/ru/rss/hub/artificial_intelligence/all/?fl=ru' },
  ],
  'urbanism': [
    { name: 'The Urbanist', url: 'https://www.theurbanist.org/feed/' },
    { name: 'Planetizen', url: 'https://www.planetizen.com/rss.xml' },
    { name: 'Dezeen — Urbanism', url: 'https://feeds.feedburner.com/dezeen' },
  ],
  'productivity': [
    { name: 'Хабр — GTD и продуктивность', url: 'https://habr.com/ru/rss/hub/gtd/all/?fl=ru' },
    { name: 'Ness Labs', url: 'https://nesslabs.com/feed' },
    { name: 'James Clear', url: 'https://jamesclear.com/feed' },
  ],
  'art-design': [
    { name: 'UX Collective', url: 'https://uxdesign.cc/feed' },
    { name: 'Design Milk', url: 'https://design-milk.com/feed/' },
    { name: 'Dezeen', url: 'https://www.dezeen.com/feed/' },
    { name: 'Colossal', url: 'https://www.thisiscolossal.com/feed/' },
  ],
  'books': [
    { name: 'Brain Pickings / The Marginalian', url: 'https://www.themarginalian.org/feed/' },
    { name: 'Electric Literature', url: 'https://electricliterature.com/feed/' },
    { name: 'LitHub', url: 'https://lithub.com/feed/' },
  ],
  'nature-travel': [
    { name: 'Atlas Obscura', url: 'https://www.atlasobscura.com/feeds/latest' },
    { name: 'Smithsonian Magazine — Nature', url: 'https://www.smithsonianmag.com/rss/nature/' },
    { name: 'BBC Earth', url: 'https://www.bbc.co.uk/earth/feed' },
    { name: 'Lenta.ru — Путешествия', url: 'https://lenta.ru/rss/news/travel' },
  ],
  'learning': [
    { name: 'Coursera Blog', url: 'https://blog.coursera.org/feed/' },
    { name: 'eLearning Industry', url: 'https://elearningindustry.com/feed' },
    { name: 'Хабр — Образование', url: 'https://habr.com/ru/rss/hub/education/all/?fl=ru' },
    { name: 'MIT OpenCourseWare Blog', url: 'https://ocw.mit.edu/about/ocw-stories/rss.xml' },
  ],
  'news-politics': [
    { name: 'BBC Русская служба', url: 'https://feeds.bbci.co.uk/russian/rss.xml' },
    { name: 'Медуза (Meduza)', url: 'https://meduza.io/rss/all' },
    { name: 'Deutsche Welle Русский', url: 'https://rss.dw.com/xml/rss-ru-all' },
  ],
};

async function run() {
  console.log('📡 Подключаем RSS-источники к комнатам...\n');

  for (const [slug, roomSources] of Object.entries(ROOM_SOURCES)) {
    // Найдём комнату по слагу
    const [room] = await db
      .select({ id: universes.id, name: universes.name })
      .from(universes)
      .where(eq(universes.slug, slug));

    if (!room) {
      console.log(`   ⚠️  Комната "${slug}" не найдена, пропускаем`);
      continue;
    }

    console.log(`🌐 Комната «${room.name}» (${slug}):`);

    for (const src of roomSources) {
      // Проверяем, не добавлен ли уже этот источник
      const existing = await db
        .select({ id: sources.id })
        .from(sources)
        .where(eq(sources.url, src.url));

      if (existing.length > 0) {
        console.log(`   ⏭️  "${src.name}" уже добавлен`);
        continue;
      }

      await db.insert(sources).values({
        universeId: room.id,
        provider: 'rss',
        name: src.name,
        url: src.url,
        enabled: true,
      });
      console.log(`   ✅ ${src.name}`);
    }

    // Ставим задачу агрегации в очередь
    await db.insert(aggregatorJobs).values({
      universeId: room.id,
      status: 'pending',
    });
    console.log(`   📬 Задача агрегации поставлена в очередь\n`);
  }

  console.log('🎉 Все источники подключены! Запусти агрегатор: npm run worker');
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
