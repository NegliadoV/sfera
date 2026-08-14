/**
 * lib/session-version.ts
 *
 * Утилиты для работы с sessionVersion — механизма инвалидации JWT-сессий.
 *
 * Кеш хранится в памяти процесса Next.js и используется совместно auth.ts
 * и любым API-маршрутом, который меняет пароль пользователя.
 *
 * ⚠️  В multi-instance деплое (PM2 cluster / несколько серверов) кеш будет
 *     только в одном процессе. Это нормально: максимальная задержка инвалидации
 *     равна SESSION_VERSION_CACHE_TTL (5 сек), после чего все процессы
 *     самостоятельно подтянут актуальную версию из БД.
 */

/** TTL in-memory кеша версий (мс). Уменьши для мгновенной инвалидации (больше нагрузки на БД). */
export const SESSION_VERSION_CACHE_TTL = 5_000;

export const versionCache = new Map<string, { version: number; fetchedAt: number }>();

/**
 * Сбрасывает закешированную версию для userId.
 * Вызывается после смены пароля / явного выхода со всех устройств.
 */
export function invalidateSessionVersionCache(userId: string): void {
  versionCache.delete(userId);
}

/**
 * Инкрементирует sessionVersion пользователя в БД и сбрасывает кеш.
 * Использовать когда нужно выгнать пользователя со всех устройств без смены пароля.
 */
export async function bumpSessionVersion(userId: string): Promise<void> {
  const { db } = await import('@/lib/db');
  const { user } = await import('@/lib/db/schema');
  const { sql, eq } = await import('drizzle-orm');

  await db
    .update(user)
    .set({ sessionVersion: sql`${user.sessionVersion} + 1` })
    .where(eq(user.id, userId));

  invalidateSessionVersionCache(userId);
}
