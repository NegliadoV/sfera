/**
 * lib/rate-limit.ts
 *
 * Простой Rate Limiter на базе Redis (sliding window).
 * Не требует дополнительных зависимостей — использует ioredis из стека.
 *
 * Использование:
 *   const result = await rateLimit({ key: `fp:${email}`, limit: 3, windowSec: 600 });
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: 429 });
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  // В Edge Runtime Redis недоступен — пропускаем (graceful degradation)
  if (typeof process === 'undefined') return null;
  if (!process.env.REDIS_URL) return null;

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      redis.on('error', () => {
        // Не прерываем приложение — rate limit просто не работает
        redis = null;
      });
    } catch {
      return null;
    }
  }
  return redis;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // unix timestamp (сек)
  error?: string;
}

export interface RateLimitOptions {
  /** Уникальный ключ (например, `fp:${email}` или `reg:${ip}`) */
  key: string;
  /** Максимальное число попыток в окне */
  limit: number;
  /** Размер скользящего окна в секундах */
  windowSec: number;
}

/**
 * Проверяет и инкрементирует счётчик в Redis.
 * Если Redis недоступен — возвращает ok:true (graceful degradation).
 */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const client = getRedis();
  const resetAt = Math.floor(Date.now() / 1000) + opts.windowSec;

  if (!client) {
    // Redis недоступен — пропускаем ограничение, не ломаем приложение
    return { ok: true, remaining: opts.limit, resetAt };
  }

  try {
    const redisKey = `rl:${opts.key}`;
    const [[, count]] = await client
      .multi()
      .incr(redisKey)
      .expire(redisKey, opts.windowSec)
      .exec() as [[null, number], [null, number]];

    const remaining = Math.max(0, opts.limit - count);

    if (count > opts.limit) {
      const ttl = await client.ttl(redisKey);
      return {
        ok: false,
        remaining: 0,
        resetAt: Math.floor(Date.now() / 1000) + ttl,
        error: `Слишком много попыток. Повторите через ${Math.ceil(ttl / 60)} мин.`,
      };
    }

    return { ok: true, remaining, resetAt };
  } catch {
    // Ошибка Redis — пропускаем (graceful degradation)
    return { ok: true, remaining: opts.limit, resetAt };
  }
}
