/**
 * Утилиты для форматирования дат
 */

/**
 * Форматирует дату обновления в читаемый формат
 */
export function formatUpdated(updatedAt: Date): string {
  const now = new Date();
  const diff = now.getTime() - updatedAt.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return 'сегодня';
  if (days === 1) return '1д назад';
  if (days < 7) return `${days}д назад`;
  return updatedAt.toLocaleDateString('ru');
}

