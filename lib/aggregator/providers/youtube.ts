import type { AggregatedContentItem } from './base';
import { parseDate } from '@/lib/parse-date';

interface YouTubeConfig {
  apiKey?: string;
}

/**
 * YouTube провайдер для агрегации контента через YouTube Data API v3
 */
export async function fetchYouTube(
  channelIdOrUrl: string,
  config?: YouTubeConfig
): Promise<AggregatedContentItem[]> {
  const apiKey = config?.apiKey || process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[YouTube Provider] Пропуск: нужен YOUTUBE_API_KEY в .env или API ключ в настройках источника. Без ключа YouTube Data API v3 не возвращает данные.');
    return [];
  }

  try {
    // Извлекаем channel ID из URL или используем как есть
    let channelId = channelIdOrUrl;
    if (channelIdOrUrl.includes('youtube.com/channel/')) {
      const match = channelIdOrUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
      channelId = match ? match[1] : channelIdOrUrl;
    } else if (channelIdOrUrl.includes('youtube.com/@') || channelIdOrUrl.startsWith('@')) {
      // Для каналов с @handle используем forHandle (forUsername устарел)
      const handleMatch = channelIdOrUrl.match(/@([a-zA-Z0-9_.-]+)/);
      const handle = handleMatch ? `@${handleMatch[1]}` : channelIdOrUrl;
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
        { cache: 'no-store' }
      );
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        if (channelData.items && channelData.items.length > 0) {
          channelId = channelData.items[0].id;
        }
      }
    }

    // Получаем последние 10 видео канала
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&key=${apiKey}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items: AggregatedContentItem[] = [];

    for (const video of data.items || []) {
      const snippet = video.snippet;
      // YouTube API возвращает thumbnails с разными размерами, берём high или default
      const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
      items.push({
        title: snippet.title,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        body: snippet.description,
        imageUrl: thumbnail,
        type: 'video',
        publishedAt: parseDate(snippet.publishedAt),
        externalAuthor: snippet.channelTitle,
        tags: snippet.tags || [],
      });
    }

    return items;
  } catch (error) {
    console.error(`[YouTube Provider] Error fetching ${channelIdOrUrl}:`, error);
    return [];
  }
}
