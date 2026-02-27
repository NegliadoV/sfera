# Установка Redis для Horizon

Для работы агрегатора контента (Фаза 2) требуется Redis версии 5.0 или выше. BullMQ не работает со старыми версиями Redis.

## Варианты установки

### Вариант 1: Memurai Developer (рекомендуется для Windows)

Memurai — официальный партнёр Redis для Windows, совместим с Redis 5.0+.

1. **Скачать с официального сайта:**
   - Перейти на https://www.memurai.com/get-memurai
   - Скачать Memurai Developer (бесплатно для разработки)

2. **Или через winget (может не сработать):**
   ```powershell
   winget install Memurai.MemuraiDeveloper
   ```

3. **После установки:**
   - Memurai запускается как служба Windows автоматически
   - Порт по умолчанию: **6379**
   - Проверка: `redis-cli ping` (должен вернуть `PONG`)

### Вариант 2: Docker (если Docker Desktop работает)

Если Docker Desktop работает корректно:

```powershell
docker run -d -p 6379:6379 --name horizon-redis redis:7
```

Или использовать docker-compose из корня проекта:
```powershell
docker compose up -d redis
```

### Вариант 3: WSL2 + Redis (если WSL2 установлен)

```bash
# В WSL2 терминале
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

## Проверка установки

После установки проверьте подключение:

```powershell
# Проверка через redis-cli
redis-cli ping
# Должно вернуть: PONG

# Или через Node.js
node -e "const Redis = require('ioredis'); const r = new Redis('redis://localhost:6379'); r.ping().then(() => console.log('OK')).catch(e => console.log('ERROR:', e.message));"
```

## Запуск Redis

### Memurai
- Запускается автоматически как служба Windows
- Управление через "Службы Windows" (Services) или:
  ```powershell
  # Запуск (имя службы: Memurai или MemuraiDeveloper — проверьте через Get-Service *mem*)
  net start Memurai

  # Остановка
  net stop Memurai
  ```

  Проверка из проекта (без redis-cli): `npm run check-redis`

### Docker
```powershell
docker start horizon-redis
```

### WSL2
```bash
sudo service redis-server start
```

## Использование в проекте

После установки Redis проект автоматически подключится к `redis://localhost:6379` (настроено в `.env`).

Для запуска воркера агрегации:
```powershell
npm run worker
```

## Устранение проблем

**Ошибка: "Redis version needs to be greater or equal than 5.0.0"**
- Установлена старая версия Redis (например, 3.0.504)
- Решение: установите Memurai Developer или Redis 5.0+ через Docker/WSL2

**Ошибка: "ECONNREFUSED"**
- Redis не запущен
- Решение: запустите Redis (см. раздел "Запуск Redis" выше)

**Порт 6379 занят**
- Другой процесс использует порт 6379
- Решение: остановите другой Redis/Memurai или измените порт в `.env` (`REDIS_URL=redis://localhost:6380`)
