# Развёртывание SFERA на домашнем Linux-сервере

Чтобы веб-приложение, API и WebSocket всегда работали на вашем сервере.

## Что будет запущено

| Сервис        | Порт | Описание                    |
|--------------|------|-----------------------------|
| Next.js      | 3000 | Сайт + API                  |
| WebSocket    | 3002 | Socket.IO (чаты, комнаты)   |
| PostgreSQL   | 5432 | База данных                 |
| Redis        | 6379 | Очереди (опционально)       |

## 1. Подготовка сервера (Ubuntu/Debian)

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Redis (опционально, для фоновых задач)
sudo apt install -y redis-server
```

## 2. База данных

```bash
sudo -u postgres psql -c "CREATE USER sfera WITH PASSWORD 'ваш_пароль';"
sudo -u postgres psql -c "CREATE DATABASE sfera OWNER sfera;"
```

Проверка: `psql -h localhost -U sfera -d sfera -c "SELECT 1"`

## 3. Клонирование и сборка проекта

```bash
cd /opt   # или любой каталог
sudo git clone https://github.com/NegliadoV/sfera.git
cd sfera
sudo chown -R $USER:$USER .

npm ci
npm run build
```

## 4. Переменные окружения

Создайте файл `.env` в корне проекта (рядом с `package.json`):

```env
# Обязательно
DATABASE_URL=postgres://sfera:ваш_пароль@localhost:5432/sfera
AUTH_SECRET=длинный_случайный_секрет_минимум_32_символа
NEXTAUTH_URL=http://ВАШ_IP_ИЛИ_ДОМЕН:3000

# WebSocket (тот же AUTH_SECRET использует ws-server)
WS_PORT=3002
# URL, по которому фронт и мобильные клиенты подключаются к сокетам
NEXT_PUBLIC_WS_URL=http://ВАШ_IP_ИЛИ_ДОМЕН:3002
# Для уведомлений с Next.js в ws-server (если на одном хосте — можно не ставить)
WS_SERVER_URL=http://127.0.0.1:3002

# Опционально: Redis для аггрегации/воркеров
REDIS_URL=redis://localhost:6379

# Опционально: Google OAuth
# AUTH_GOOGLE_ID=...
# AUTH_GOOGLE_SECRET=...
```

**Важно:**  
- Если заходите по домену (например, `https://sfera.mydomain.com`), в `NEXTAUTH_URL` и `NEXT_PUBLIC_WS_URL` используйте этот домен (и `https`/`wss` при наличии SSL).  
- Для доступа по IP: `http://192.168.1.100:3000` и `http://192.168.1.100:3002`.

## 5. Миграции БД

```bash
cd /opt/sfera
npm run db:push
# при необходимости: npm run db:seed
```

## 6. Запуск через PM2 (всегда работают)

```bash
sudo npm install -g pm2
cd /opt/sfera
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # автозапуск после перезагрузки
```

Проверка: `pm2 status` — должны быть `next` и `ws`.

Логи: `pm2 logs`, перезапуск: `pm2 restart all`.

Если нужен фоновый воркер (агрегация контента из источников), в `ecosystem.config.js` раскомментируйте приложение `worker` и выполните `pm2 start ecosystem.config.js --only worker`.

## 7. Доступ с телефона и других устройств

- В браузере: `http://IP_СЕРВЕРА:3000`.
- Мобильное приложение (Expo/React Native): в конфиге указать:
  - `EXPO_PUBLIC_API_URL=http://IP_СЕРВЕРА:3000`
  - `EXPO_PUBLIC_WS_URL=ws://IP_СЕРВЕРА:3002`
- Если сервер за роутером: пробросьте порты 3000 и 3002 (Port Forwarding) на IP сервера.

## 8. Фаервол

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3002/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 9. (Опционально) Nginx и HTTPS

Если есть домен и нужен HTTPS, перед приложением ставят Nginx как reverse proxy и выдают сертификат (например, Let's Encrypt). Тогда в `.env` указывают уже домен и `https`/`wss` в `NEXTAUTH_URL` и `NEXT_PUBLIC_WS_URL`.

---

После выполнения шагов 1–6 сайт и API будут постоянно работать на вашем Linux-сервере; телефоны и ПК подключаются по IP (или домену) к этому серверу.
