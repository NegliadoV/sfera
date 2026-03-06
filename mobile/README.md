# SFERA — React Native (Expo)

Кроссплатформенное приложение iOS и Android с тем же бэкендом, что и веб (Next.js API + Socket.IO).

**Общая база пользователей:** учётные записи единые для веба и мобильного приложения. Пользователи, зарегистрированные на сайте (email + пароль), входят в мобильное приложение с теми же email и паролем. Регистрация в приложении создаёт того же пользователя в общей базе — войти потом можно и на сайте.

## Требования

- Node.js 18+
- npm или yarn

## Запуск

**Сначала запустите бэкенд** (в корне проекта, не в `mobile/`):

```bash
# В корне Horizon_project
npm run dev
```

Бэкенд — Next.js на порту 3000. Для входа через seed или по email нужна БД: `npm run db:push` и `npm run db:seed`.

Затем запустите мобильное приложение:

```bash
cd mobile
npm install
npm start
```

Далее:
- **В браузере (без телефона):** нажмите `w` — откроется веб-версия на http://localhost:8081.
- **На телефоне:** сканируйте QR-код в приложении Expo Go (iOS/Android) или нажмите `a` / `i` для эмулятора. Если видите ошибку *«Project is incompatible with this version of Expo Go»* — см. ниже.

Если тестируете на **реальном телефоне**, в одном терминале задайте переменные и запустите: `EXPO_PUBLIC_API_URL=http://ВАШ_IP:3000 EXPO_PUBLIC_WS_URL=ws://ВАШ_IP:3002 npm start` (подставьте IP вашего компьютера в локальной сети).

### Подключение с iPhone (iOS)

**Вариант A — по LAN (рекомендуется, если tunnel не подключается):**

1. Подключите **iPhone и компьютер к одной Wi‑Fi сети**.
2. Узнайте IP компьютера в этой сети:
   - **Windows:** в cmd выполните `ipconfig`, найдите «IPv4-адрес» у вашего Wi‑Fi (например `192.168.1.105`).
   - **Mac:** Системные настройки → Сеть → Wi‑Fi → Подробнее.
3. В папке `mobile` запустите (подставьте свой IP вместо `192.168.1.105`):
   ```bash
   set EXPO_PUBLIC_API_URL=http://192.168.1.105:3000
   set EXPO_PUBLIC_WS_URL=ws://192.168.1.105:3002
   npm start
   ```
   В **PowerShell:** `$env:EXPO_PUBLIC_API_URL="http://192.168.1.105:3000"; $env:EXPO_PUBLIC_WS_URL="ws://192.168.1.105:3002"; npm start`  
   В **Git Bash / MINGW64:** `export EXPO_PUBLIC_API_URL=http://192.168.1.105:3000 EXPO_PUBLIC_WS_URL=ws://192.168.1.105:3002 && npm start`
4. Отсканируйте QR-код в Expo Go на iPhone. Если бэкенд на этом же ПК, не забудьте запустить в корне проекта `npm run dev`.

**Вариант B — Tunnel (если LAN не подходит):**

1. В папке `mobile`: `npm run start:tunnel`. Если появится *«ngrok tunnel took too long to connect»*, см. раздел **«Туннель не подключается»** ниже.
2. После появления QR и ссылки `exp://...` откройте их в Expo Go на iPhone.

### Запуск на сервере под root (ошибка «React Native DevTools» / Electron)

При `npm start` под **root** (например на Linux-сервере) Expo может пытаться установить/запустить React Native DevTools (Electron), и появляется ошибка *«Running as root without --no-sandbox is not supported»*.

**Варианты:**

1. **Запуск без DevTools (часто помогает):**
   ```bash
   npm run start:server
   ```
   Скрипт задаёт `CI=1`, из‑за чего Expo может не трогать DevTools. QR-код и Metro работают как обычно.

2. **Запуск не от root** (предпочтительно на проде):
   ```bash
   sudo useradd -m -s /bin/bash expo
   sudo su - expo
   cd /opt/sfera/mobile
   npm run start:server
   ```
   Либо: `sudo -u expo npm run start:server` из каталога `mobile` (предварительно выдать пользователю `expo` доступ к каталогу).

3. Игнорировать сообщение **ERROR** — если в терминале уже появились QR-код и строка `Metro: exp://...`, Metro запущен, приложением можно пользоваться; ошибка касается только установки DevTools.

### Туннель не подключается (ngrok took too long to connect)

В Expo нельзя увеличить таймаут туннеля. Что помогает:

1. **Лучший вариант — не использовать tunnel.** Подключите телефон и ПК к **одной Wi‑Fi** и запускайте без `--tunnel`:
   ```bash
   cd mobile
   npm start
   ```
   Отсканируйте QR-код из терминала (адрес будет вида `exp://192.168.x.x:8081`). API при этом может указывать на ваш сервер через `.env` (например `EXPO_PUBLIC_API_URL=https://jhonlohanta.xyz`).

2. **Повторить запуск туннеля** — часто срабатывает со 2–3 попытки: `npm run start:tunnel`.

3. **Очистить кэш и снова tunnel:** `npm run start:tunnel-clear`.

4. **Временно отключить антивирус/брандмауэр** на ПК и снова запустить `npm run start:tunnel`.

5. **Установить ngrok отдельно:** скачать с https://ngrok.com/download, запустить `ngrok` и оставить окно открытым, затем в другом терминале: `npm run start:tunnel`.

**Версия Expo Go (SDK 55) на iPhone:** в App Store может быть старая версия. Установите Expo Go для SDK 55 по **приглашению TestFlight** — откройте на iPhone ссылку (отдельный код не нужен): **https://testflight.apple.com/join/GZJxxfUU** → «Accept» → в TestFlight появится установка Expo Go.

### Ошибка «Project is incompatible with this version of Expo Go»

Проект собран на **Expo SDK 55**. Нужна свежая версия Expo Go.

1. **Обновите Expo Go** до последней версии в App Store (iOS) или Google Play (Android).
2. Если в сторах всё ещё старая версия: на **iOS** установите [Expo Go для SDK 55 через TestFlight](https://testflight.apple.com/join/GZJxxfUU); на **Android** — установите через команду `npx expo run:android` или дождитесь обновления в Play Store.
3. **Пока тестируете без телефона:** в терминале после `npm start` нажмите **`w`** — откроется веб-версия в браузере (тот же функционал, без Expo Go).

### Вход как seed-пользователь не работает

1. **Бэкенд запущен?** В корне проекта: `npm run dev` (порт 3000).
2. **Seed-пользователь создан?** В корне проекта: `npm run db:push` (если ещё не применяли схему), затем `npm run db:seed`. Без этого пользователя `seed@horizon.local` в базе нет — приложение покажет сообщение «Seed-пользователь не найден в базе…».
3. **На телефоне** (не в браузере/эмуляторе) приложение должно стучаться на IP вашего ПК, а не на localhost: в `mobile/` запускайте с `EXPO_PUBLIC_API_URL=http://IP:3000`.

## Конфигурация API

По умолчанию в dev используется `http://localhost:3000` (API) и `ws://localhost:3002` (WebSocket). Для устройства в локальной сети задайте:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000 EXPO_PUBLIC_WS_URL=ws://192.168.x.x:3002 npm start
```

Или создайте `.env` в `mobile/`:

```
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_WS_URL=wss://your-api.com
```

## Сборка (EAS Build)

1. Установите EAS CLI: `npm i -g eas-cli`
2. Войдите: `eas login`
3. Настройте проект: `eas build:configure`
4. Сборка:
   - iOS: `eas build --platform ios --profile production`
   - Android: `eas build --platform android --profile production`

Профили и переменные окружения заданы в `eas.json`.

## Структура

- `app/` — экраны (expo-router): табы Вселенные, Я, Сообщения, Сборка, Настройки.
- `contexts/AuthContext.tsx` — авторизация (JWT в SecureStore).
- `lib/api.ts` — HTTP-клиент с Bearer; `lib/socket.ts` — Socket.IO и ws-token.
- `hooks/useDMSocket.ts`, `hooks/useRoomSocket.ts` — real-time чаты и комнаты.
- `constants/Theme.ts`, `constants/Colors.ts` — тема в стиле веб-приложения.
