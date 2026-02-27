const USER_TAG_REGEX = /^[a-z0-9_]{3,30}$/;

/**
 * Валидирует и нормализует userTag.
 * Принимает ввод с @ или без, в любом регистре.
 * @returns lowercase тег без @ или null если невалидный
 */
export function normalizeAndValidateUserTag(input: string | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/^@+/, '').toLowerCase();
  if (trimmed.length === 0) return null;
  return USER_TAG_REGEX.test(trimmed) ? trimmed : null;
}
