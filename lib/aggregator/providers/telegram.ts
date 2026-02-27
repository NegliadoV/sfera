/**
 * Провайдер агрегатора: Telegram канал.
 * Пользователь указывает канал (t.me/channel, @channel) — агрегатор получает последние 10 постов через RSSHub.
 */

import { fetchRSS } from './rss';

/** Сколько последних постов забирать */
const CHANNEL_POSTS_LIMIT = 10;

/** Базовый URL RSSHub (можно переопределить через TELEGRAM_RSSHUB_URL) */
const RSSHUB_BASE = process.env.TELEGRAM_RSSHUB_URL || 'https://rsshub.app';

function extractChannelName(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // @channel или просто channel
  const simpleMatch = trimmed.match(/^@?([a-zA-Z0-9_]+)$/);
  if (simpleMatch) return simpleMatch[1];

  // t.me/channel, t.me/channel/123, https://t.me/channel
  if (/(?:t\.me|telegram\.me|telegram\.dog)\/[a-zA-Z0-9_]+/i.test(trimmed)) {
    try {
      const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const path = new URL(url).pathname.replace(/^\/+/, '').split('/')[0];
      return path || null;
    } catch {
      return null;
    }
  }

  return null;
}

export type TelegramItem = {
  title: string;
  url?: string;
  body?: string;
  imageUrl?: string;
  type: 'link' | 'video';
  publishedAt?: Date;
  externalAuthor?: string;
  tags?: string[];
};

/**
 * Получает последние 10 постов из Telegram-канала через RSSHub.
 * Пользователь указывает: t.me/channel, @channel или просто channel.
 */
export async function fetchTelegram(channelOrPostUrl: string): Promise<TelegramItem[]> {
  const input = channelOrPostUrl.trim();
  if (!input) return [];

  // Извлекаем имя канала (t.me/channel, t.me/channel/123, @channel, channel — всё даёт имя канала)
  const channelName = extractChannelName(input);
  if (!channelName) {
    console.warn('[Telegram Provider] Не удалось извлечь имя канала из:', input);
    return [];
  }

  const rssUrl = `${RSSHUB_BASE}/telegram/channel/${encodeURIComponent(channelName)}?limit=${CHANNEL_POSTS_LIMIT}`;

  try {
    const items = await fetchRSS(rssUrl);
    return items.slice(0, CHANNEL_POSTS_LIMIT).map((item) => ({
      title: item.title,
      url: item.url,
      body: item.body,
      imageUrl: item.imageUrl,
      type: (item.type === 'video' ? 'video' : 'link') as 'link' | 'video',
      publishedAt: item.publishedAt,
      externalAuthor: item.externalAuthor || channelName,
      tags: item.tags,
    }));
  } catch (error) {
    console.error(`[Telegram Provider] Ошибка загрузки канала @${channelName}:`, error);
    return [];
  }
}
