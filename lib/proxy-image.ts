/**
 * Домены, для которых превью грузим через прокси (обход блокировки по Referer).
 */
const PROXY_WHITELIST_DOMAINS = [
  'cdn.telegram.org',
  't.me',
  'telegram.org',
  'telegram.me',
  'telegram.dog',
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
  return PROXY_WHITELIST_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
}

/**
 * Возвращает URL для загрузки картинки: для доменов из белого списка — через прокси, иначе исходный.
 */
export function getProxiedImageSrc(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  if (shouldProxyImageUrl(url)) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}
