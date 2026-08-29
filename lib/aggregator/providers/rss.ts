import type { AggregatedContentItem } from './base';
import { parseDate } from '@/lib/parse-date';

/** Максимум записей из одного фида за раз (последние 10 постов) */
const RSS_ITEMS_LIMIT = 10;

/**
 * RSS/Atom провайдер для агрегации контента
 */
export async function fetchRSS(
  feedUrl: string
): Promise<AggregatedContentItem[]> {
  try {
    const response = await fetch(feedUrl, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Horizon Aggregator/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xml = await response.text();
    const items: AggregatedContentItem[] = [];

    // Простой парсинг RSS (можно заменить на библиотеку типа fast-xml-parser)
    // Базовая реализация для RSS 2.0
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i) ||
                        itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const descriptionMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const dcDateMatch = itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      const authorMatch = itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i) ||
                          itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
      // Изображения: enclosure (тип image), media:thumbnail, media:content (порядок url/type может быть разный)
      const enclosureImageMatch = itemXml.match(/<enclosure[^>]*(?:type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'])/i);
      const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
      const mediaContentImageMatch = itemXml.match(/<media:content[^>]*(?:type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'])/i);
      // Видео: enclosure (тип video), media:content (тип video)
      const enclosureVideoMatch = itemXml.match(/<enclosure[^>]*(?:type=["']video\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']video\/[^"']+["'])/i);
      const mediaContentVideoMatch = itemXml.match(/<media:content[^>]*(?:type=["']video\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']video\/[^"']+["'])/i);
      let videoUrl = enclosureVideoMatch?.[1] || enclosureVideoMatch?.[2] || mediaContentVideoMatch?.[1] || mediaContentVideoMatch?.[2];
      const bodyRaw = descriptionMatch ? descriptionMatch[1] : undefined;
      if (!videoUrl && bodyRaw) {
        videoUrl = extractVideoUrlFromHtml(bodyRaw);
      }

      const title = titleMatch ? cleanXmlText(titleMatch[1]) : '';
      const rawLink = linkMatch?.[1];
      const linkUrl = rawLink !== undefined && rawLink !== null
        ? (String(rawLink).startsWith('http') ? String(rawLink).trim() : cleanXmlText(String(rawLink)))
        : undefined;
      const url = videoUrl || linkUrl;
      const body = bodyRaw ? cleanXmlText(bodyRaw) : undefined;
      const publishedAt =
        parseDate(pubDateMatch ? cleanXmlText(pubDateMatch[1]) : undefined) ??
        parseDate(dcDateMatch ? cleanXmlText(dcDateMatch[1]) : undefined);
      const externalAuthor = authorMatch ? cleanXmlText(authorMatch[1]) : undefined;
      let imageUrl = enclosureImageMatch?.[1] || enclosureImageMatch?.[2] || mediaThumbnailMatch?.[1] || mediaContentImageMatch?.[1] || mediaContentImageMatch?.[2];
      if (!imageUrl && bodyRaw) {
        imageUrl = extractImageUrlFromHtml(bodyRaw);
      }
      const isVideoByContent = !videoUrl && bodyRaw && (
        /Video is too big/i.test(bodyRaw) ||
        /tgme_widget_message_video/i.test(bodyRaw) ||
        /\u{1F3AC}|\u{1F3AD}/u.test(title) // 🎬
      );
      const contentType = (videoUrl || isVideoByContent) ? ('video' as const) : ('article' as const);

      // Если изображения нет в фиде, но есть URL — пробуем получить og:image
      if (!imageUrl && url) {
        try {
          const pageRes = await fetch(url, {
            cache: 'no-store',
            headers: { 'User-Agent': 'Horizon Aggregator/1.0' },
            signal: AbortSignal.timeout(5000), // Таймаут 5 секунд
          });
          if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            const ogImageMatch =
              pageHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
              pageHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (ogImageMatch) {
              imageUrl = ogImageMatch[1].trim();
            }
          }
        } catch {
          // Игнорируем ошибки при загрузке страницы (таймаут, сеть и т.д.)
        }
      }

      if (title) {
        items.push({
          title,
          url,
          body,
          imageUrl,
          type: contentType,
          publishedAt,
          externalAuthor,
        });
      }
    }

    // Если не нашли items в формате RSS 2.0, пробуем Atom
    if (items.length === 0) {
      const entryMatches = xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
      for (const match of entryMatches) {
        const entryXml = match[1];
        const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const linkMatch = entryXml.match(/<link[^>]*href=["']([^"']+)["']/i);
        const summaryMatch = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
                            entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
        const publishedMatch = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
        const updatedMatch = entryXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
        const dcDateAtomMatch = entryXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
        const authorMatch = entryXml.match(/<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i);
        const mediaThumbnailMatch = entryXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
        const mediaContentImageMatch = entryXml.match(/<media:content[^>]*(?:type=["']image\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'])/i);
        const mediaContentVideoMatch = entryXml.match(/<media:content[^>]*(?:type=["']video\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']video\/[^"']+["'])/i);
        const enclosureVideoMatch = entryXml.match(/<enclosure[^>]*(?:type=["']video\/[^"']+["'][^>]*url=["']([^"']+)["']|url=["']([^"']+)["'][^>]*type=["']video\/[^"']+["'])/i);
        let videoUrlAtom = enclosureVideoMatch?.[1] || enclosureVideoMatch?.[2] || mediaContentVideoMatch?.[1] || mediaContentVideoMatch?.[2];
        const contentRaw = entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1];
        const summaryRaw = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1];
        const bodyRawAtom = contentRaw ?? summaryRaw;
        if (!videoUrlAtom && bodyRawAtom) {
          videoUrlAtom = extractVideoUrlFromHtml(bodyRawAtom);
        }

        const title = titleMatch ? cleanXmlText(titleMatch[1]) : '';
        const linkUrl = linkMatch ? linkMatch[1] : undefined;
        const url = videoUrlAtom || linkUrl;
        const body = bodyRawAtom ? cleanXmlText(bodyRawAtom) : undefined;
        const publishedAt =
          parseDate(publishedMatch ? cleanXmlText(publishedMatch[1]) : undefined) ??
          parseDate(updatedMatch ? cleanXmlText(updatedMatch[1]) : undefined) ??
          parseDate(dcDateAtomMatch ? cleanXmlText(dcDateAtomMatch[1]) : undefined);
        const externalAuthor = authorMatch ? cleanXmlText(authorMatch[1]) : undefined;
        let imageUrlAtom = mediaThumbnailMatch?.[1] || mediaContentImageMatch?.[1] || mediaContentImageMatch?.[2];
        if (!imageUrlAtom && bodyRawAtom) {
          imageUrlAtom = extractImageUrlFromHtml(bodyRawAtom);
        }
        if (!imageUrlAtom && url) {
          try {
            const pageRes = await fetch(url, {
              cache: 'no-store',
              headers: { 'User-Agent': 'Horizon Aggregator/1.0' },
              signal: AbortSignal.timeout(5000),
            });
            if (pageRes.ok) {
              const pageHtml = await pageRes.text();
              const ogImageMatch =
                pageHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                pageHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
              if (ogImageMatch) {
                imageUrlAtom = ogImageMatch[1].trim();
              }
            }
          } catch {
            // игнорируем ошибки сети/таймаута
          }
        }
        const imageUrl = imageUrlAtom;
        const isVideoByContentAtom = !videoUrlAtom && bodyRawAtom && (
          /Video is too big/i.test(bodyRawAtom) ||
          /tgme_widget_message_video/i.test(bodyRawAtom) ||
          /\u{1F3AC}|\u{1F3AD}/u.test(title) // 🎬
        );
        const contentType = (videoUrlAtom || isVideoByContentAtom) ? ('video' as const) : ('article' as const);

        if (title) {
          items.push({
            title,
            url,
            body,
            imageUrl,
            type: contentType,
            publishedAt,
            externalAuthor,
          });
        }
      }
    }

    return items.slice(0, RSS_ITEMS_LIMIT);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[RSS Provider] Ошибка загрузки фида ${feedUrl}:`, msg);
    return [];
  }
}

/**
 * Очищает HTML в описании поста: оставляет только текст.
 * Сначала декодирует HTML-сущности, затем удаляет все теги (включая <a>, <video>, <p> и т.д.).
 */
function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    // Числовые HTML-сущности (десятичные) — например &#8217; = '
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Числовые HTML-сущности (шестнадцатеричные) — например &#x2019; = '
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}


/** Раскомментировать HTML-сущности (RSS экранирует < > " в description) */
function unescapeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&');
}

/** Извлечь URL первого изображения из HTML (например <img src="..."> в description, фото из Telegram) */
function extractImageUrlFromHtml(html: string | undefined): string | undefined {
  if (!html || typeof html !== 'string') return undefined;
  const unescaped = unescapeHtmlEntities(html);
  const m = unescaped.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : undefined;
}

/** Извлечь URL видео из HTML (например <video src="..."> или <source src="..."> в description) */
function extractVideoUrlFromHtml(html: string | undefined): string | undefined {
  if (!html || typeof html !== 'string') return undefined;
  const unescaped = unescapeHtmlEntities(html);
  let m = unescaped.match(/<video[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  m = unescaped.match(/src=["']([^"']+)["'][^>]*type=["']video\/[^"']+["']/i)
    || unescaped.match(/type=["']video\/[^"']+["'][^>]*src=["']([^"']+)["']/i);
  if (m) return m[1];
  m = unescaped.match(/<source[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return undefined;
}
