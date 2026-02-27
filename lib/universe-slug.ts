/**
 * Нормализует slug вселенной из params: decode + trim + тот же формат, что при создании (lowercase, пробелы → дефисы).
 * В БД slug хранится так же — поиск по нормализованному slug находит запись.
 */
export function normalizeUniverseSlug(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // оставляем как есть
  }
  return decoded.toLowerCase().replace(/\s+/g, '-');
}
