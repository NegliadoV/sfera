# 🌌 Roominate (бывш. Ноосфера)

**Умная платформа для глубокого познания и дискуссий.**
Здесь люди создают тематические "Вселенные", обсуждают контент, делятся мыслями через визуальные Mind-Maps и развивают идеи без бесконечного инфошума.

![Roominate Cover](https://roominate.rest/og-image.png)

🔗 **Продакшен:** [roominate.rest](https://roominate.rest)

## 🛠 Технологический стек

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
* **Backend:** Node.js, Next.js API Routes, NextAuth.js v5
* **База данных:** PostgreSQL + Drizzle ORM
* **Real-time:** Socket.IO / LiveKit (WebRTC)
* **Асинхронные задачи:** Redis + BullMQ (парсеры RSS)
* **Деплой:** Ubuntu VPS, PM2, NGINX

## 🚀 Основные фичи

* **OAuth & OTP Регистрация:** Вход по Google/GitHub + надежная кастомная система регистрации с подтверждением email (6-значные коды), индикатором надежности пароля и сбросом.
* **Агрегатор контента:** Воркер (`worker-digest.ts`) автоматически парсит внешние RSS-ленты и каналы, обогащая "Вселенные" свежим контентом.
* **Голосовые комнаты:** Real-time комнаты для общения с использованием LiveKit SDK.
* **Mind-Maps:** Встроенный визуальный редактор связей (на базе React Flow).
* **Система подписок и ленты:** TikTok-style ленты для мобильной версии, классические grid-сетки для веба. Форматирование постов в Markdown.
* **Mobile App:** Параллельно разрабатывается нативного приложения на React Native (Expo).

## 💻 Локальный запуск (Для разработчиков)

1. Клонируйте репозиторий и установите зависимости:
   ```bash
   npm install
   ```

2. Заполните `.env` (возьмите пример из `.env.example`):
   ```env
   # Database (PostgreSQL)
   DATABASE_URL="postgresql://user:password@localhost:5432/sfera"

   # Auth secrets
   AUTH_SECRET="your_secure_random_string"

   # Redis
   REDIS_URL="redis://localhost:6379"
   ```

3. Поднимите БД и примените схему:
   ```bash
   npm run db:push
   ```

4. Запустите все сервисы одним скриптом (Next.js + WebSockets):
   ```bash
   npm run dev
   ```

5. (Опционально) Запустите парсер RSS в фоне:
   ```bash
   npm run worker
   ```

Сервер будет доступен по адресу **http://localhost:3000**.

## 📦 Команды

* `npm run dev` — запуск Next.js и Socket.IO параллельно
* `npm run build` — сборка проекта для продакшена
* `npm run db:push` — выгрузка схемы Drizzle в базу данных
* `npm run db:seed` — заполнение базы тестовыми вселенными и пользователями
* `npm run worker` — ручной триггер воркера для загрузки RSS
* `npm run ws` — запуск только WebSocket сервера
