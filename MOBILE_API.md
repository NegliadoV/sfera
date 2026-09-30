# 📱 Roominate Mobile API Documentation

## Обзор

Roominate API готов для интеграции с нативными мобильными приложениями (iOS/Android) и React Native.

**Base URL (Production):** `https://roominate.rest/api`  
**WebSocket URL:** `wss://roominate.rest:3002`  
**LiveKit URL:** `wss://livekit.roominate.rest`

---

## 🔐 Аутентификация

### 1. JWT-based Authentication (рекомендуется для mobile)

Мобильные приложения должны использовать **JWT токены** вместо cookies.

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/mobile/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://...",
    "crystals": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30d"
}
```

#### OAuth (Google, GitHub, Facebook)

Для мобильных приложений используйте **OAuth 2.0 PKCE flow**:

1. Откройте WebView с URL:
   ```
   https://roominate.rest/api/auth/signin?callbackUrl=roominate://auth/callback
   ```

2. После успешной авторизации пользователь будет перенаправлен на:
   ```
   roominate://auth/callback?token=<JWT_TOKEN>
   ```

3. Извлеките токен из deep link и сохраните в Keychain (iOS) / EncryptedSharedPreferences (Android)

#### Использование токена

Все запросы к защищённым эндпоинтам должны содержать токен в заголовке:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 📋 Core Endpoints

### Health Check
```http
GET /api/mobile/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-30T12:00:00Z",
  "version": "1.0.0",
  "api": {
    "baseUrl": "https://roominate.rest",
    "wsUrl": "wss://roominate.rest:3002",
    "livekitUrl": "wss://livekit.roominate.rest"
  },
  "features": {
    "auth": ["google", "github", "facebook", "credentials"],
    "realtime": true,
    "voiceRooms": true,
    "push": true
  }
}
```

### App Configuration
```http
GET /api/mobile/config
```

Возвращает feature flags, лимиты, локализацию.

---

## 🌐 Universes (Сферы)

### Get Universes List
```http
GET /api/universes?limit=20&offset=0
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "slug": "tech",
    "name": "Technology",
    "description": "All about tech",
    "icon": "💻",
    "sphereColor": "#3b82f6",
    "membersCount": 1250,
    "isPrivate": false,
    "monthlyPrice": null
  }
]
```

### Get Universe Detail
```http
GET /api/universes/:slug
Authorization: Bearer <TOKEN>
```

### Join Universe
```http
POST /api/universes/:id/join
Authorization: Bearer <TOKEN>
```

### Leave Universe
```http
DELETE /api/universes/:id/leave
Authorization: Bearer <TOKEN>
```

---

## 📝 Content (Посты)

### Get Feed
```http
GET /api/content?universeId=<UUID>&limit=20&offset=0&sortBy=newest
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `universeId` (required): UUID сферы
- `limit` (optional, default: 20, max: 50): Количество постов
- `offset` (optional, default: 0): Пагинация
- `sortBy` (optional): `newest` | `most_discussed` | `controversial`
- `tags` (optional): Фильтр по тегам (JSON array или comma-separated)
- `sourceId` (optional): Фильтр по источнику
- `hasLinks` (optional): `true` для постов со связями

**Response:**
```json
[
  {
    "id": "uuid",
    "universeId": "uuid",
    "authorId": "uuid",
    "authorName": "John Doe",
    "authorImage": "https://...",
    "type": "article",
    "title": "Introduction to AI",
    "url": "https://example.com/article",
    "body": "Article text...",
    "imageUrl": "https://...",
    "createdAt": "2026-09-30T12:00:00Z",
    "commentCount": 42,
    "savesCount": 15,
    "hasLinks": true,
    "tags": ["ai", "machine-learning"],
    "poll": null
  }
]
```

### Create Post
```http
POST /api/content
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "universeId": "uuid",
  "type": "article",
  "title": "My Post Title",
  "url": "https://example.com",
  "body": "Optional markdown content",
  "imageUrl": "https://...",
  "pollOptions": ["Option 1", "Option 2"] // Optional
}
```

### Save/Bookmark Post
```http
POST /api/content/:contentId/save
Authorization: Bearer <TOKEN>
```

### Delete Post
```http
DELETE /api/content/:contentId
Authorization: Bearer <TOKEN>
```

---

## 💬 Comments

### Get Comments
```http
GET /api/content/:contentId/comments
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "contentId": "uuid",
    "authorId": "uuid",
    "authorName": "Jane Smith",
    "authorImage": "https://...",
    "parentId": null,
    "type": "thesis",
    "body": "Great article!",
    "createdAt": "2026-09-30T13:00:00Z"
  }
]
```

### Create Comment
```http
POST /api/content/:contentId/comments
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "body": "My comment text",
  "parentId": "uuid", // Optional (для threaded comments)
  "type": "thesis" // "thesis" | "counterargument" | "question"
}
```

### Delete Comment
```http
DELETE /api/content/:contentId/comments/:commentId
Authorization: Bearer <TOKEN>
```

---

## 💡 Resonances (Реакции)

### Add Resonance
```http
POST /api/content/:contentId/resonances
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "type": "insight" // "insight" | "ignite" | "ponder" | "resonate" | "inspire" | "challenge"
}
```

### Get Resonances
```http
GET /api/content/:contentId/resonances
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "insight": 15,
  "ignite": 42,
  "ponder": 8,
  "resonate": 23,
  "inspire": 12,
  "challenge": 3,
  "userResonance": "ignite" // Какую реакцию поставил текущий пользователь
}
```

---

## 📬 Direct Messages

### Get Conversations
```http
GET /api/messages?limit=20&offset=0
Authorization: Bearer <TOKEN>
```

### Get Messages
```http
GET /api/messages/dm/:conversationId?limit=50&offset=0
Authorization: Bearer <TOKEN>
```

### Send Message
```http
POST /api/messages/dm/:userId
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "body": "Hello!",
  "attachmentUrl": "https://..." // Optional
}
```

### Mark as Read
```http
PATCH /api/messages/dm/:conversationId/read
Authorization: Bearer <TOKEN>
```

---

## 🎙️ Voice Rooms (LiveKit)

### Get Active Rooms
```http
GET /api/spaces?universeId=<UUID>&isActive=true
Authorization: Bearer <TOKEN>
```

### Create Room
```http
POST /api/spaces
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "Tech Discussion",
  "description": "Let's talk about AI",
  "universeId": "uuid", // Optional
  "type": "audio", // "audio" | "video"
  "isPrivate": false,
  "isOpenMic": true
}
```

### Get Room Token (LiveKit)
```http
POST /api/spaces/permissions
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "roomName": "tech-discussion",
  "participantName": "John Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "url": "wss://livekit.roominate.rest"
}
```

**LiveKit Integration (React Native):**
```typescript
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

## 📹 Shorts

### Get Shorts Feed
```http
GET /api/shorts?limit=20&offset=0&universeId=<UUID>
Authorization: Bearer <TOKEN>
```

### Upload Short
```http
POST /api/shorts/upload
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

{
  "video": <File>,
  "title": "My Short",
  "description": "...",
  "universeId": "uuid", // Optional
  "thumbnail": <File> // Optional
}
```

### Like Short
```http
POST /api/shorts/:id/like
Authorization: Bearer <TOKEN>
```

---

## 🔔 Push Notifications

### Register Device
```http
POST /api/push/subscribe
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

**iOS (APNs) / Android (FCM):**
```typescript
// React Native
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();

// Send to API
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token,
    platform: Platform.OS, // 'ios' | 'android'
  }),
});
```

---

## 🔌 Real-time (Socket.IO)

### Connect
```typescript
import io from 'socket.io-client';

const socket = io('wss://roominate.rest:3002', {
  auth: {
    token: jwtToken,
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
});

// Listen for room updates
socket.on('room-update', (update) => {
  console.log('Room update:', update);
});
```

---

## ⚡ Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/auth/*` | 10 requests / 15 min |
| `/api/content` (POST) | 10 posts / hour |
| `/api/content/:id/comments` (POST) | 20 comments / minute |
| `/api/messages/*` | 30 messages / minute |
| `/api/shorts/upload` | 5 uploads / hour |

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1696077600
```

---

## 🌍 Localization

Поддерживаемые языки:
- `en` (English)
- `ru` (Русский)
- `es` (Español)
- `de` (Deutsch)
- `fr` (Français)
- `pt` (Português)
- `zh` (中文)
- `ar` (العربية)
- `hi` (हिन्दी)

Передавайте язык в заголовке:
```http
Accept-Language: ru-RU,ru;q=0.9
```

---

## 🛠️ Mobile SDK Setup

### React Native (Expo)

```bash
npx create-expo-app roominate-mobile
cd roominate-mobile

# Install dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install axios socket.io-client
npm install @livekit/react-native
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-video
npm install @react-native-async-storage/async-storage
```

### iOS Native (Swift)

```swift
// API Client
import Alamofire

class RoominateAPI {
    static let baseURL = "https://roominate.rest/api"
    
    static func login(email: String, password: String) async throws -> AuthResponse {
        let response = try await AF.request(
            "\(baseURL)/auth/mobile/login",
            method: .post,
            parameters: ["email": email, "password": password],
            encoding: JSONEncoding.default
        ).serializingDecodable(AuthResponse.self).value
        
        return response
    }
}
```

### Android Native (Kotlin)

```kotlin
// API Client
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

interface RoominateAPI {
    @POST("auth/mobile/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse
}

val retrofit = Retrofit.Builder()
    .baseUrl("https://roominate.rest/api/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(RoominateAPI::class.java)
```

---

## 🐛 Error Handling

Все ошибки возвращаются в формате:

```json
{
  "error": "Unauthorized",
  "message": "Invalid token",
  "statusCode": 401
}
```

**HTTP Status Codes:**
- `200` — Success
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (invalid/missing token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `429` — Too Many Requests (rate limit exceeded)
- `500` — Internal Server Error

---

## 📚 Example: Complete Flow

### 1. Register User
```typescript
const response = await fetch('https://roominate.rest/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe',
  }),
});

const { token } = await response.json();
// Save token to secure storage
await SecureStore.setItemAsync('jwt_token', token);
```

### 2. Get Feed
```typescript
const token = await SecureStore.getItemAsync('jwt_token');

const response = await fetch(
  'https://roominate.rest/api/content?universeId=<UUID>&limit=20',
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const posts = await response.json();
```

### 3. Create Post
```typescript
await fetch('https://roominate.rest/api/content', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    universeId: '<UUID>',
    type: 'article',
    title: 'My Post',
    body: 'Content here...',
  }),
});
```

### 4. Connect WebSocket
```typescript
import io from 'socket.io-client';

const socket = io('wss://roominate.rest:3002', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('new-message', (msg) => {
  // Update UI
});
```

---

## 🔒 Security Best Practices

1. **Храните JWT токены в безопасном хранилище:**
   - iOS: Keychain
   - Android: EncryptedSharedPreferences
   - React Native: `expo-secure-store` или `react-native-keychain`

2. **Используйте HTTPS везде** (в production API только через HTTPS)

3. **Обновляйте токены:**
   - JWT токены действительны 30 дней
   - При ошибке `401 Unauthorized` → перелогинить пользователя

4. **Валидируйте ввод на клиенте:**
   - Email format
   - Password strength (min 8 chars, uppercase, lowercase, number)
   - File size limits (10MB для изображений, 50MB для видео)

5. **Обрабатывайте rate limits:**
   - Показывайте пользователю понятные сообщения при `429`
   - Используйте экспоненциальный backoff для retry

---

## 📞 Support

- **Email:** support@roominate.rest
- **Documentation:** https://docs.roominate.rest
- **GitHub Issues:** https://github.com/roominate/mobile-issues

---

**API Version:** 1.0.0  
**Last Updated:** 2026-09-30
