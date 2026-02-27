# Ноосфера (Horizon)

Платформа для глубокого познания: тематические «вселенные», структурированные дискуссии, совместное познание. Инструмент для мышления и осмысленного диалога.

**План разработки (фазы 0–6):** [docs/PLAN.md](docs/PLAN.md)

## Стек

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Drizzle ORM, PostgreSQL, Redis (Docker)
- **Auth:** NextAuth.js v5 (Auth.js) с Google OAuth и Drizzle adapter

## Быстрый старт

1. Установить зависимости:
   ```bash
   npm install
   ```

2. Запустить БД и Redis:
   - **Вариант A (Docker):** `docker compose up -d` — нужен работающий Docker Desktop.
   - **Вариант B (без Docker):** 
     - PostgreSQL: см. [docs/LOCAL_POSTGRES.md](docs/LOCAL_POSTGRES.md) — установка через winget, создание БД, затем `npm run db:push` и `npm run db:seed`.
     - Redis: см. [docs/REDIS_SETUP.md](docs/REDIS_SETUP.md) — требуется Redis 5.0+ (рекомендуется Memurai Developer для Windows).

3. Применить схему БД:
   ```bash
   npm run db:push
   ```

4. (Опционально) Заполнить тестовыми данными — вселенные и контент в «Квантовая физика»:
   ```bash
   npm run db:seed
   ```

5. Настроить `.env` (есть `.env.example`): `DATABASE_URL`, `AUTH_SECRET`, при необходимости `AUTH_GOOGLE_*`.

6. Запуск dev-сервера:
   ```bash
   npm run dev
   ```
   Открыть [http://localhost:3000](http://localhost:3000).

## Скрипты

- `npm run dev` — режим разработки
- `npm run build` — сборка
- `npm run start` — запуск прод-сборки
- `npm run lint` — ESLint
- `npm run db:generate` — сгенерировать миграции Drizzle
- `npm run db:push` — применить схему к БД (dev)
- `npm run db:seed` — заполнить тестовыми данными (вселенные + контент)
- `npm run worker` — запустить воркер агрегации контента (требует Redis)
- `.\scripts\start-redis.ps1` — запустить Redis/Memurai (Windows)
- `npm run db:studio` — Drizzle Studio

## Дизайн

Визуальный стиль и токены взяты из `index.html` (лендинг «Ноосфера»): тёмная тема по умолчанию, шрифты Inter и JetBrains Mono, акценты фиолетовый/синий, карточки с градиентной полосой и семантические реакции.

## Структура

- `app/` — страницы и API (Next.js App Router)
- `components/` — React-компоненты (Header, Footer, UniversesDemo)
- `lib/db/` — Drizzle схема и клиент БД
- `auth.ts` — конфигурация NextAuth
