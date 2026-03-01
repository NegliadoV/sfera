/**
 * Проверяет, является ли URL прямым видеофайлом (можно воспроизвести через <video> / expo-av).
 */
const DIRECT_VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|$)/i;

export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const path = new URL(url.trim()).pathname;
    return DIRECT_VIDEO_EXT.test(path);
  } catch {
    return false;
  }
}
