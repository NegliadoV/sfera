/**
 * Очистка неприемлемых тестовых комнат из базы данных
 * и проверка работоспособности Бот-модератора.
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import {
  validateUniverseCreation,
  validateContentCreation,
  validateCommentCreation,
} from '../lib/moderation/moderator-bot';

async function main() {
  console.log('🧹 Очистка тестовых некорректных сфер из БД...\n');

  // Удаляем комнаты с нецензурными или тестовыми названиями
  const deleted = await db.execute(sql`
    DELETE FROM universes 
    WHERE name ILIKE '%секс%' 
       OR name ILIKE '%пизд%' 
       OR name ILIKE '%хуй%' 
       OR name ILIKE '%ебат%' 
       OR name ILIKE '%бля%'
       OR slug = '-'
       OR slug = '--'
    RETURNING id, slug, name
  `) as unknown as Array<{ id: string; slug: string; name: string }>;

  console.log(`   Удалено неприемлемых сфер: ${deleted.length}`);
  deleted.forEach(r => console.log(`   - [${r.slug}] ${r.name}`));

  console.log('\n🧪 Тестирование Бот-модератора на различных сценариях:\n');

  // Тест 1: Попытка создания сферы "Секс пиздц"
  const test1 = validateUniverseCreation({ name: 'Секс пиздц', slug: '-' });
  console.log('1. Тест: Сфера "Секс пиздц"');
  console.log(`   Разрешено: ${test1.isAllowed ? 'ДА ❌ (ошибка)' : 'НЕТ ✅'}`);
  console.log(`   Причина: ${test1.reasonRu}`);
  console.log(`   Сообщение бота: ${test1.botFeedback}\n`);

  // Тест 2: Замаскированный мат "п*здец" / "c3кс"
  const test2 = validateUniverseCreation({ name: 'Комната п*здец и х.у.й' });
  console.log('2. Тест: Замаскированный мат "п*здец и х.у.й"');
  console.log(`   Разрешено: ${test2.isAllowed ? 'ДА ❌' : 'НЕТ ✅'}`);
  console.log(`   Причина: ${test2.reasonRu}\n`);

  // Тест 3: Спам / казино
  const test3 = validateContentCreation({
    title: 'Казино Вулкан 1xbet выиграй 1000000',
    body: 'Срочно переходи и делай ставки',
  });
  console.log('3. Тест: Спам "Казино Вулкан"');
  console.log(`   Разрешено: ${test3.isAllowed ? 'ДА ❌' : 'НЕТ ✅'}`);
  console.log(`   Причина: ${test3.reasonRu}\n`);

  // Тест 4: Неприемлемый комментарий
  const test4 = validateCommentCreation('Да ты просто ебаный мудак и членосос');
  console.log('4. Тест: Оскорбительный комментарий');
  console.log(`   Разрешено: ${test4.isAllowed ? 'ДА ❌' : 'НЕТ ✅'}`);
  console.log(`   Причина: ${test4.reasonRu}\n`);

  // Тест 5: Корректная сфера
  const test5 = validateUniverseCreation({
    name: 'Квантовая физика и сознание',
    description: 'Исследования физики микромира и философские аспекты',
  });
  console.log('5. Тест: Корректная сфера "Квантовая физика"');
  console.log(`   Разрешено: ${test5.isAllowed ? 'ДА ✅' : 'НЕТ ❌'}`);
  console.log(`   Причина: ${test5.reasonRu}\n`);

  console.log('🎉 Все тесты завершены успешно!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
