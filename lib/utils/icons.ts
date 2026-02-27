/**
 * Утилиты для работы с иконками Font Awesome
 */

/**
 * Нормализует иконку перед сохранением в базу данных
 * Убирает fa-solid, оставляет только fa-*
 */
export function normalizeIconForStorage(icon: string): string | null {
  if (!icon || !icon.trim()) {
    return null;
  }
  
  let normalized = icon.trim();
  // Убираем fa-solid если есть
  normalized = normalized.replace(/fa-solid\s+/g, '').trim();
  // Если не начинается с fa-, добавляем префикс
  if (!normalized.startsWith('fa-')) {
    normalized = `fa-${normalized}`;
  }
  
  return normalized;
}
