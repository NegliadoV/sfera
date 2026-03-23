import { db } from '../lib/db';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateBalance() {
  try {
    await db.update(user)
      .set({ crystals: 1000000 })
      .where(eq(user.id, '00000000-0000-0000-0000-000000000001'));
    console.log('Успешно: баланс сид-пользователя пополнен на 1 000 000 кристаллов SFERA.');
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

updateBalance();
