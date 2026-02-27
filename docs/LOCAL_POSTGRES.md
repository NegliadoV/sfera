# Запуск без Docker (локальный PostgreSQL)

Если Docker Desktop выдаёт 500 Internal Server Error или виртуализация недоступна, используйте PostgreSQL, установленный в Windows.

## 1. Установка PostgreSQL

В PowerShell (от имени администратора или обычном):

```powershell
winget install PostgreSQL.PostgreSQL.16
```

При установке задайте пароль для пользователя `postgres` (запомните его). Порт по умолчанию: **5432**.

Перезапустите терминал после установки (чтобы в PATH появился `psql`).

## 2. Создание БД и пользователя

**Вариант 1 — скрипт (проще):** из корня проекта в PowerShell:

```powershell
.\scripts\setup-local-db.ps1
```

Введите пароль пользователя `postgres`, когда будет запрошено.

**Вариант 2 — вручную:** откройте новый терминал и выполните (подставьте свой пароль `postgres` вместо `YOUR_POSTGRES_PASSWORD`):

```powershell
$env:PGPASSWORD = "YOUR_POSTGRES_PASSWORD"
psql -U postgres -h localhost -c "CREATE USER horizon WITH PASSWORD 'horizon_dev';"
psql -U postgres -h localhost -c "CREATE DATABASE horizon OWNER horizon;"
```

Если `psql` не находится, укажите полный путь (подставьте версию, если отличается):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE USER horizon WITH PASSWORD 'horizon_dev';"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE horizon OWNER horizon;"
```

## 3. Настройка проекта

В корне проекта в файле `.env` должна быть строка:

```
DATABASE_URL=postgresql://horizon:horizon_dev@localhost:5432/horizon
```

(Она уже есть по умолчанию — менять не нужно.)

## 4. Применение схемы и тестовых данных

В папке проекта:

```powershell
cd C:\Users\stanis\Desktop\Horizon_project
npm run db:push
npm run db:seed
```

## 5. Запуск приложения

```powershell
npm run dev
```

Откройте http://localhost:3000 → «Начать познание» → вселенная «Квантовая физика» — должна появиться лента контента и материалы (после сида).

---

**Redis** в этом режиме не используется (очереди и кэш из плана пока не задействованы). Приложение работает только с PostgreSQL.
