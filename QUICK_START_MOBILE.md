# 📱 Quick Start: Mobile Integration

Быстрый старт для интеграции Roominate API с iOS/Android приложениями.

---

## 🔥 За 5 минут

### 1. Получить JWT токен

```bash
curl -X POST https://roominate.rest/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30d"
}
```

### 2. Получить ленту постов

```bash
curl https://roominate.rest/api/content?universeId=<UUID>&limit=20 \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. Создать пост

```bash
curl -X POST https://roominate.rest/api/content \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "universeId": "<UUID>",
    "title": "My Post",
    "type": "article",
    "body": "Content here..."
  }'
```

---

## 🔌 WebSocket (Real-time)

```javascript
import io from 'socket.io-client';

const socket = io('wss://roominate.rest:3002', {
  auth: { token: '<JWT_TOKEN>' },
  transports: ['websocket']
});

socket.on('new-message', (msg) => {
  console.log('New message:', msg);
});

socket.on('notification', (notif) => {
  console.log('Notification:', notif);
});
```

---

## 🎙️ Голосовые комнаты (LiveKit)

```bash
# 1. Получить токен для комнаты
curl -X POST https://roominate.rest/api/spaces/permissions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "tech-discussion",
    "participantName": "John Doe"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "url": "wss://livekit.roominate.rest"
}
```

```javascript
// 2. Подключиться к комнате (React Native)
import { LiveKitRoom } from '@livekit/react-native';

<LiveKitRoom
  serverUrl="wss://livekit.roominate.rest"
  token={token}
  connect={true}
  audio={true}
  video={false}
/>
```

---

## 📋 Основные endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/health` | GET | Проверка API |
| `/api/mobile/config` | GET | Конфигурация приложения |
| `/api/auth/register` | POST | Регистрация |
| `/api/auth/mobile/login` | POST | Вход (JWT) |
| `/api/content` | GET | Лента постов |
| `/api/content` | POST | Создать пост |
| `/api/content/:id/comments` | GET | Комментарии |
| `/api/content/:id/resonances` | POST | Поставить реакцию |
| `/api/messages` | GET | Список диалогов |
| `/api/messages/dm/:userId` | POST | Отправить сообщение |
| `/api/spaces` | GET | Голосовые комнаты |
| `/api/shorts` | GET | Shorts лента |
| `/api/push/subscribe` | POST | Регистрация push уведомлений |

---

## 🛠️ Headers для мобильных приложений

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-App-Version: 1.0.0
X-Device-Id: <UNIQUE_DEVICE_ID>
Accept-Language: ru-RU,ru;q=0.9
```

---

## 🚀 React Native за 10 минут

```bash
# 1. Создать проект
npx create-expo-app roominate-mobile
cd roominate-mobile

# 2. Установить основные зависимости
npm install @react-navigation/native @react-navigation/stack
npm install axios swr socket.io-client
npm install @livekit/react-native
npx expo install react-native-screens react-native-safe-area-context

# 3. Создать API client
# lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://roominate.rest/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

# 4. Запустить
npx expo start
```

---

## 📚 Полная документация

- **API:** См. `MOBILE_API.md` (полная документация всех endpoints)
- **React Native:** См. `REACT_NATIVE_SETUP.md` (пошаговый гайд)
- **iOS/Android Native:** См. примеры в `MOBILE_API.md`

---

## 🔒 Security

1. **Храните JWT токены безопасно:**
   - iOS: Keychain
   - Android: EncryptedSharedPreferences
   - React Native: `expo-secure-store`

2. **Используйте HTTPS везде** (API только через HTTPS в production)

3. **Токены действительны 30 дней** — при ошибке `401` перелогинить пользователя

---

## 🆘 Поддержка

**Email:** support@roominate.rest  
**Docs:** https://roominate.rest/docs  
**API Status:** https://roominate.rest/api/mobile/health

---

**API Version:** 1.0.0  
**Base URL:** `https://roominate.rest/api`
