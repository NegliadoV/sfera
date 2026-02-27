/**
 * Парсит дату в Date.
 * Поддерживает: строки (RFC 2822, ISO 8601), Date.
 * Используется во всех провайдерах агрегации (RSS, YouTube, Telegram и др.).
 */
export function parseDate(input: string | Date | null | undefined): Date | undefined {
  if (input == null) return undefined;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? undefined : input;
  }
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  try {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}
