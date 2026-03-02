import type { ConnectionOptions } from 'bullmq';

function toInt(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function getRedisConnectionOptions(): ConnectionOptions {
  const raw = process.env.REDIS_URL ?? 'redis://localhost:6379';

  try {
    const url = new URL(raw);
    const port = toInt(url.port) ?? 6379;
    const dbPath = url.pathname?.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    const db = toInt(dbPath);

    const options: Record<string, unknown> = {
      host: url.hostname || 'localhost',
      port,
      maxRetriesPerRequest: null,
    };

    if (url.username) options.username = decodeURIComponent(url.username);
    if (url.password) options.password = decodeURIComponent(url.password);
    if (db != null) options.db = db;
    if (url.protocol === 'rediss:') options.tls = {};

    return options as ConnectionOptions;
  } catch {
    // Fallback if REDIS_URL is not a valid URL format
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null } as ConnectionOptions;
  }
}

