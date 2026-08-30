/**
 * Домены которые требуют загрузки через прокси (блокируют хотлинкинг по Referer).
 * Для всех остальных внешних доменов пробуем no-referrer напрямую — это работает
 * для большинства сайтов. Прокси — только если site явно заблокирован.
 */
const PROXY_REQUIRED_DOMAINS = [
  // Telegram
  'cdn.telegram.org',
  't.me',
  'telegram.org',
  'telegram.me',
  'telegram.dog',
  // Dezeen — строгая hotlink protection
  'dezeen.com',
  'cdn.sanity.io',
  // Colossal
  'mymodernmet.com',
  // The Guardian
  'i.guim.co.uk',
  'media.guim.co.uk',
  // Medium
  'miro.medium.com',
  'cdn-images-1.medium.com',
  // Getty
  'media.gettyimages.com',
  'imageio.forbes.com',
];

function getImageUrlHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function shouldProxyImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const host = getImageUrlHost(url);
  if (!host) return false;
  return PROXY_REQUIRED_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
}

/**
 * Возвращает URL для загрузки картинки:
 * - для доменов из PROXY_REQUIRED_DOMAINS — через наш прокси (обходит Referer-блок)
 * - для всех остальных — исходный URL (браузер грузит с referrerPolicy="no-referrer")
 */
export function getProxiedImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  if (shouldProxyImageUrl(url)) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
