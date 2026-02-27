/**
 * Извлекает ID видео YouTube из ссылки.
 * Поддерживает: watch?v=, youtu.be/, embed/, v/
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    // youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?|$|\/)/);
    if (shortMatch) return shortMatch[1];

    const u = new URL(trimmed);
    // youtube.com/watch?v=VIDEO_ID
    if (u.hostname.replace(/^www\./, '') === 'youtube.com' && u.pathname === '/watch' && u.searchParams.has('v')) {
      const id = u.searchParams.get('v');
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    // youtube.com/embed/VIDEO_ID
    if (u.hostname.replace(/^www\./, '') === 'youtube.com' && u.pathname.startsWith('/embed/')) {
      const id = u.pathname.slice(7).split(/[?/]/)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    // youtube.com/v/VIDEO_ID
    if (u.hostname.replace(/^www\./, '') === 'youtube.com' && u.pathname.startsWith('/v/')) {
      const id = u.pathname.slice(3).split(/[?/]/)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    // невалидный URL
  }
  return null;
}
