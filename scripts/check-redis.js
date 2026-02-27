/**
 * Проверка подключения к Redis из проекта (redis-cli не нужен).
 * Требуется Redis 5+ для воркера агрегатора (BullMQ использует команды и Lua-скрипты, которых нет в Redis 3.x).
 * Запуск: node scripts/check-redis.js
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS script run with node
const Redis = require('ioredis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const MIN_REDIS_VERSION = 5;

function parseVersion(info) {
  const m = info.match(/redis_version:(\d+\.\d+\.\d+)/i) || info.match(/redis_version:(\d+\.\d+)/i);
  if (!m) return null;
  const parts = m[1].split('.').map(Number);
  return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

const r = new Redis(url, { maxRetriesPerRequest: 1 });

r.info('server')
  .then((info) => {
    const ver = parseVersion(info);
    const verStr = (info.match(/redis_version:([^\r\n]+)/i) || [])[1] || '?';
    if (ver !== null && ver < MIN_REDIS_VERSION * 10000) {
      console.error('ERROR: Redis версии ' + verStr + ' слишком старая.');
      console.error('Воркер агрегатора (BullMQ) требует Redis 5.0 или выше.');
      console.error('');
      console.error('Варианты на Windows:');
      console.error('  1. Memurai (Redis 7 для Windows): https://www.memurai.com/');
      console.error('  2. Docker: docker run -p 6379:6379 redis:7-alpine');
      console.error('  3. WSL2: установите redis-server из пакетов.');
      process.exit(1);
    }
    console.log('OK: Redis доступен (' + url + '), версия ' + verStr);
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR: Не удалось подключиться к Redis:', err.message);
    console.error('Убедитесь, что Memurai (или Redis 5+) запущен на порту 6379.');
    process.exit(1);
  })
  .finally(() => r.quit());
