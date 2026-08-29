/**
 * Утилита транслитерации и генерации чистых URL-слагов для комнат и материалов.
 */

const RU_TO_EN_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
};

export function transliterate(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split('')
    .map((char) => RU_TO_EN_MAP[char] ?? char)
    .join('');
}

export function generateSlug(name: string): string {
  if (!name) return '';
  const transliterated = transliterate(name.trim());
  const slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'room-' + Math.random().toString(36).substring(2, 7);
}
