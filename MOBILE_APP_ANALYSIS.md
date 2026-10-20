# Анализ мобильного приложения Horizon (mobile.app)

**Дата анализа:** 2026-09-30  
**Версия приложения:** 1.0.0  
**Технологический стек:** React Native (Expo SDK 54)

---

## 1. Архитектура приложения

### 1.1. Технологический стек

- **Framework:** Expo SDK 54 (React Native 0.81.5)
- **Routing:** Expo Router v6 (file-based routing)
- **UI Framework:** React 19.1.0
- **Styling:** NativeWind v4 (Tailwind CSS для React Native) + inline styles
- **State Management:** React Context API (AuthContext, ThemeContext)
- **HTTP Client:** Axios v1.13.6
- **Video/Audio:** Expo Video, @livekit/react-native v2.9.6
- **Storage:** expo-secure-store (native) / localStorage (web)

### 1.2. Структура проекта (Expo Router)

```
mobile.app/
├── app/                          # Expo Router - file-based routing
│   ├── (auth)/                   # Auth group - login, register
│   │   ├── _layout.tsx           # Auth layout
│   │   ├── login.tsx             # Логин экран
│   │   ├── register.tsx          # Регистрация
│   │   └── components.tsx        # Shared auth UI components
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx           # Custom glass tab bar
│   │   ├── index.tsx             # Лента/Digest (главная)
│   │   ├── universes.tsx         # Список сфер
│   │   ├── feed.tsx              # Лента контента
│   │   ├── shorts.tsx            # Shorts (вертикальное видео)
│   │   ├── messages.tsx          # Список диалогов и групп
│   │   └── profile.tsx           # Профиль пользователя
│   ├── universe/                 # Работа со сферами
│   │   ├── [slug].tsx            # Детальная страница сферы
│   │   ├── create.tsx            # Создание сферы
│   │   ├── create-post.tsx       # Создание поста
│   │   ├── settings.tsx          # Настройки сферы
│   │   └── webview.tsx           # WebView для комнат/карт
│   ├── rooms/                    # Видеокомнаты (LiveKit)
│   │   ├── index.tsx
│   │   ├── [id].tsx              # Комната с WebRTC
│   │   └── create.tsx
│   ├── messages/                 # Мессенджер
│   │   ├── [id].tsx              # Личный диалог
│   │   ├── group/[id].tsx        # Групповой чат
│   │   └── create-group.tsx
│   ├── content/[id].tsx          # Детальная страница контента
│   ├── profile/[id].tsx          # Чужой профиль
│   ├── contacts/index.tsx        # Контакты
│   ├── search/index.tsx          # Поиск
│   ├── notifications/index.tsx   # Уведомления
│   ├── settings/                 # Настройки
│   │   ├── index.tsx
│   │   └── blocks.tsx            # Блокировки
│   ├── _layout.tsx               # Root layout (Auth + Theme providers)
│   └── +not-found.tsx
├── components/                   # Переиспользуемые UI компоненты
│   ├── ui/
│   │   ├── GlassButton.tsx       # Стилизованная кнопка
│   │   ├── GlassCard.tsx         # Карточка с blur effect
│   │   ├── Avatar.tsx
│   │   └── YouTubePlayer.tsx
│   ├── universe/
│   │   └── UniverseCard.tsx
│   ├── ScreenWrapper.tsx         # Обёртка с градиентным фоном
│   ├── SymbolView.tsx            # Кроссплатформенные иконки
│   ├── ContentPoll.tsx
│   └── EmojiPickerModal.tsx
├── context/                      # State management
│   ├── AuthContext.tsx           # Аутентификация (token, user)
│   └── ThemeContext.tsx          # Тема приложения (accent, glass, blur)
├── lib/
│   ├── api.ts                    # Axios client + API_BASE_URL
│   └── sphere-colors.ts
├── assets/                       # Fonts, images, icons
├── app.json                      # Expo config
├── package.json
├── tailwind.config.js
└── global.css
```

### 1.3. Routing (Expo Router)

- **File-based routing:** каждый файл в `app/` создаёт route автоматически
- **Groups:** `(auth)`, `(tabs)` - для структурирования без влияния на URL
- **Dynamic routes:** `[slug].tsx`, `[id].tsx` - динамические сегменты
- **Typed routes:** включён `experiments.typedRoutes` в app.json

---

## 2. Интеграция с API

### 2.1. API Client (lib/api.ts)

**Базовый URL:**
```typescript
const getBaseUrl = () => {
  // Динамическое определение через Expo hostUri (LAN IP)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  
  // Fallback для Android эмулятора
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  
  // iOS симулятор / web
  return 'http://localhost:3000/api';
};
```

**Axios interceptor:** автоматически добавляет Bearer token из SecureStore/localStorage:
```typescript
api.interceptors.request.use(async (config) => {
  let token = null;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('token');
  } else {
    token = await SecureStore.getItemAsync('token');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2.2. Используемые API Endpoints

**Authentication:**
- `POST /api/auth/mobile/login` - логин (email, password)
- `POST /api/auth/mobile/register` - регистрация

**User:**
- `GET /api/me/profile` - профиль текущего юзера
- `GET /api/me/digest` - персональная лента (pagination: limit, offset)
- `GET /api/me/conversations` - список диалогов
- `GET /api/me/group-chats` - групповые чаты
- `GET /api/me/crystals` - баланс кристаллов
- `POST /api/me/profile/avatar` - загрузка аватарки (multipart/form-data)

**Universes (Сферы):**
- `GET /api/universes` - список сфер
- `GET /api/universes/:slug` - детали сферы
- `GET /api/universes/:slug/subscription-status` - статус подписки
- `GET /api/universes/:slug/track` - статус трекинга
- `POST /api/universes/:slug/subscribe` - подписка (YooKassa)
- `GET /api/content?universeId=:id&limit=20&offset=0` - контент сферы

**Content:**
- `GET /api/content/:id` - детальная страница контента
- `POST /api/content` - создание контента

**Shorts:**
- `GET /api/shorts` - список видео

**Rooms (LiveKit):**
- `POST /api/spaces/token?roomName=:name&participantName=:name` - токен для WebRTC

**Crystals:**
- `POST /api/crystals/send` - перевод кристаллов автору

**Notifications:**
- `GET /api/notifications` - уведомления

**Search:**
- `GET /api/search?q=:query` - поиск по сферам/пользователям

---

## 3. Основные фичи

### 3.1. Аутентификация (AuthContext)

- **Login/Register:** email + password, dev-вход (seed@horizon.local)
- **Token storage:** SecureStore (iOS/Android), localStorage (web)
- **User persistence:** user object хранится как JSON строка
- **Auto-redirect:** если токен есть → (tabs), если нет → (auth)/login

### 3.2. Главная лента (Digest)

- **Персонализированная лента:** `/api/me/digest` - контент из отслеживаемых сфер
- **Pagination:** infinite scroll (offset-based)
- **Pull-to-refresh**
- **Modal full-screen pager:** тап на карточку → полноэкранный просмотр с FlatList (вертикальный свайп)
- **YouTube integration:** встроенный YouTubePlayer для ссылок

### 3.3. Сферы (Universes)

- **Список сфер:** публичные и приватные
- **Приватные сферы:** подписка через YooKassa (monthlyPrice), проверка subscription-status
- **Контент сферы:** посты (link/article), pagination
- **Создание контента:** title, body, url, imageUrl
- **WebView:** комнаты и ментальные карты (universes/:slug/rooms, /mind-maps)

### 3.4. Shorts (Вертикальное видео)

- **TikTok-like UI:** FlatList с pagingEnabled, full-screen videos
- **expo-video:** VideoView с auto-play/pause при смене active index
- **Донаты:** модал для перевода кристаллов автору (`/api/crystals/send`)
- **Кнопки:** like, comment, share, donate

### 3.5. Видеокомнаты (LiveKit WebRTC)

- **LiveKit integration:** `@livekit/react-native`
- **Hardcoded URL:** `wss://sfera-rcar3at8.livekit.cloud`
- **Токен получается:** POST `/api/spaces/token`
- **Video/Audio tracks:** управление микрофоном и камерой
- **Web fallback:** "Видеокомнаты доступны в мобильном приложении"

### 3.6. Мессенджер

- **Unified chat list:** DM + группы, сортировка по lastMessageAt
- **Личные диалоги:** `/messages/[userId]`
- **Групповые чаты:** `/messages/group/[id]`
- **Создание группы:** `/messages/create-group`
- **Контакты:** `/contacts` - поиск пользователей

### 3.7. Профиль

- **Avatar upload:** expo-image-picker → FormData → `/api/me/profile/avatar`
- **Баланс кристаллов:** отображение 💎
- **Сферы:** owned, member, tracked - горизонтальные ScrollView
- **Последние комментарии:** ссылки на контент

### 3.8. UI/UX Features

- **Glass morphism design:** BlurView + rgba backgrounds
- **Custom tab bar:** floating glass tab bar с анимацией (Animated.spring)
- **Gradient backgrounds:** LinearGradient из ThemeContext
- **Dark mode only:** forced dark theme
- **Safe area handling:** useSafeAreaInsets
- **Pull-to-refresh:** везде где список
- **Infinite scroll:** handleLoadMore при приближении к концу

---

## 4. Потенциальные проблемы

### 4.1. Security Issues

#### 🔴 CRITICAL

1. **Hardcoded LiveKit URL:**
   ```typescript
   const LIVEKIT_URL = 'wss://sfera-rcar3at8.livekit.cloud';
   ```
   - **Проблема:** URL должен быть в env или с backend
   - **Риск:** Нельзя сменить сервер без пересборки

2. **Dev login credentials exposed:**
   ```typescript
   setEmail('seed@horizon.local'); setPassword('dev');
   ```
   - **Проблема:** Хардкод dev-креденшалов в production build
   - **Решение:** Убрать или скрыть за feature flag

3. **Token storage на web:**
   ```typescript
   localStorage.getItem('token')
   ```
   - **Проблема:** localStorage не защищён от XSS
   - **Решение:** Использовать httpOnly cookies на web-версии

4. **API URL без HTTPS:**
   ```typescript
   return `http://${ip}:3000/api`;
   ```
   - **Проблема:** В production должен быть HTTPS
   - **Решение:** Переменные окружения для prod/dev

#### 🟡 MEDIUM

5. **Отсутствие валидации токена:**
   - Нет проверки на expired token
   - Нет refresh token механизма
   - При 401 не происходит auto-logout

6. **Error handling недостаточен:**
   ```typescript
   catch (e: any) {
     const msg = e.response?.data?.error || e.message || 'Не удалось войти';
   }
   ```
   - Нет централизованного error handling
   - Нет retry logic для network errors

7. **CORS issues potential:**
   - Динамический IP может не совпадать с CORS whitelist на backend

### 4.2. Performance Issues

#### 🟡 MEDIUM

1. **Отсутствие мемоизации:**
   - `fetchDigest`, `loadData` и другие функции пересоздаются при каждом рендере
   - Решение: `useCallback` уже используется, но можно добавить `useMemo` для тяжёлых вычислений

2. **Image optimization отсутствует:**
   - Нет lazy loading для изображений
   - Нет кэширования (Expo Image кэширует автоматически, но можно настроить)
   - Решение: использовать `expo-image` вместо `react-native` Image

3. **FlatList оптимизация:**
   ```typescript
   initialNumToRender={3}
   maxToRenderPerBatch={3}
   windowSize={5}
   ```
   - Shorts экран хорошо оптимизирован
   - Но в других экранах нет `getItemLayout` → медленный scrollToIndex

4. **Video preloading отсутствует:**
   - Shorts загружают видео только при активации
   - Решение: preload 1-2 следующих видео

#### 🟢 LOW

5. **Bundle size:**
   - `@livekit/react-native` добавляет ~5MB к bundle
   - Решение: dynamic import для LiveKit компонента

6. **Re-renders:**
   - ThemeContext изменения вызывают re-render всего дерева
   - Решение: разделить на несколько контекстов (ColorContext, BlurContext)

### 4.3. Compatibility Issues

#### 🟡 MEDIUM

1. **Web поддержка неполная:**
   - LiveKit не работает на web (показывается заглушка)
   - expo-video на web может быть нестабильным
   - Решение: отдельный web build с react-native-web альтернативами

2. **Android emulator hardcoded IP:**
   ```typescript
   if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
   ```
   - Не работает на реальных Android устройствах
   - Решение: использовать ngrok или env variable

3. **iOS SafeArea issues:**
   - В некоторых местах `insets.top` не используется
   - Может быть notch overlap

#### 🟢 LOW

4. **Expo SDK 54:**
   - Относительно свежая версия (2026)
   - Потенциальные breaking changes при обновлении

5. **React 19.1.0:**
   - Используется новая версия React
   - Некоторые либы могут быть несовместимы

### 4.4. Code Quality Issues

#### 🟡 MEDIUM

1. **Дублирование кода:**
   - `ModalFeedItem` дублируется в `index.tsx` и `[slug].tsx`
   - Решение: вынести в `components/feed/ModalFeedItem.tsx`

2. **Magic numbers:**
   ```typescript
   offset: SCREEN_HEIGHT * 0.6
   maxHeight: SCREEN_HEIGHT * 0.45
   ```
   - Нет констант, захардкожены значения
   - Решение: создать `constants/layout.ts`

3. **Type safety:**
   ```typescript
   catch (e: any)
   router.push(`/universe/${slug}` as any)
   ```
   - Много `as any`, отключающих TypeScript
   - Решение: использовать typed routes из Expo Router

4. **Missing loading states:**
   - Некоторые POST запросы не показывают loading
   - Например, `handleSubscribe` не блокирует UI

#### 🟢 LOW

5. **Console.log вместо logger:**
   ```typescript
   console.log('Error fetching digest', e);
   console.error('Failed to load universe', e);
   ```
   - Решение: использовать Sentry или custom logger

6. **Отсутствие тестов:**
   - Нет unit тестов
   - Нет integration тестов
   - Решение: Jest + React Native Testing Library

### 4.5. UX Issues

#### 🟡 MEDIUM

1. **Offline mode отсутствует:**
   - Нет обработки offline состояния
   - Решение: NetInfo + кэширование с AsyncStorage

2. **Deep linking не настроен:**
   - Нет обработки URL схем (hirizenmobileapp://)
   - Решение: настроить Linking в app.json

3. **Push notifications отсутствуют:**
   - Нет expo-notifications
   - Решение: интегрировать Expo Push Notifications

4. **Accessibility (a11y) минимальная:**
   - Нет aria labels
   - Нет screen reader поддержки
   - Решение: добавить `accessibilityLabel`, `accessibilityHint`

#### 🟢 LOW

5. **Error messages только на русском:**
   - Нет i18n
   - Решение: react-i18next или expo-localization

6. **Loading skeletons отсутствуют:**
   - Только ActivityIndicator
   - Решение: добавить skeleton screens

---

## 5. Рекомендации по улучшению

### 5.1. Приоритет 1 (Critical Security)

1. **Переменные окружения:**
   ```typescript
   // .env
   API_BASE_URL=https://api.horizon.com
   LIVEKIT_URL=wss://livekit.horizon.com
   ENABLE_DEV_LOGIN=false
   ```
   - Использовать `expo-constants` + `app.config.js`
   - Разные конфиги для dev/staging/prod

2. **Token refresh mechanism:**
   ```typescript
   api.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         // Try refresh token
         const newToken = await refreshToken();
         if (newToken) {
           error.config.headers.Authorization = `Bearer ${newToken}`;
           return api.request(error.config);
         }
         // Logout if refresh fails
         await logout();
       }
       return Promise.reject(error);
     }
   );
   ```

3. **Secure token storage:**
   - На web: использовать httpOnly cookies + CSRF tokens
   - На native: SecureStore уже используется правильно

4. **HTTPS в production:**
   - Настроить SSL на backend
   - Убрать `http://` из production builds

### 5.2. Приоритет 2 (Performance)

1. **React Query / SWR:**
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   
   const { data, isLoading, error } = useQuery({
     queryKey: ['digest', offset],
     queryFn: () => api.get(`/me/digest?limit=20&offset=${offset}`),
     staleTime: 5 * 60 * 1000, // 5 min cache
   });
   ```
   - Автоматический кэш
   - Retry logic
   - Background refetch

2. **Image optimization:**
   ```typescript
   import { Image } from 'expo-image';
   
   <Image
     source={{ uri: getFullMediaUrl(url) }}
     placeholder={blurhash}
     contentFit="cover"
     transition={200}
     cachePolicy="memory-disk"
   />
   ```

3. **Code splitting:**
   ```typescript
   const LiveKitRoom = lazy(() => import('./LiveKitRoom'));
   ```

4. **Video prefetch:**
   ```typescript
   useEffect(() => {
     if (activeIndex < shorts.length - 2) {
       // Prefetch next video
       const nextVideo = shorts[activeIndex + 1];
       Asset.fromModule(getFullMediaUrl(nextVideo.videoUrl)).downloadAsync();
     }
   }, [activeIndex]);
   ```

### 5.3. Приоритет 3 (Features)

1. **Offline support:**
   ```typescript
   import NetInfo from '@react-native-community/netinfo';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // Cache API responses
   const offlineCache = {
     async set(key, data) {
       await AsyncStorage.setItem(key, JSON.stringify(data));
     },
     async get(key) {
       const data = await AsyncStorage.getItem(key);
       return data ? JSON.parse(data) : null;
     }
   };
   ```

2. **Push notifications:**
   ```typescript
   import * as Notifications from 'expo-notifications';
   
   // Register for push
   const token = await Notifications.getExpoPushTokenAsync();
   await api.post('/me/push-token', { token: token.data });
   ```

3. **Deep linking:**
   ```json
   // app.json
   "scheme": "horizon",
   "intentFilters": [
     {
       "action": "VIEW",
       "data": [
         { "scheme": "https", "host": "horizon.com" },
         { "scheme": "horizon" }
       ]
     }
   ]
   ```

4. **Analytics:**
   ```typescript
   import * as Analytics from 'expo-firebase-analytics';
   
   Analytics.logEvent('universe_view', {
     universeSlug: slug,
     userId: user?.id
   });
   ```

5. **Error tracking:**
   ```typescript
   import * as Sentry from 'sentry-expo';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     enableInExpoDevelopment: false,
   });
   ```

### 5.4. Приоритет 4 (Code Quality)

1. **Refactoring:**
   - Вынести `ModalFeedItem` в `components/feed/`
   - Создать `hooks/useDigest.ts`, `hooks/useUniverse.ts`
   - Константы в `constants/`

2. **TypeScript strict mode:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

3. **Testing:**
   ```typescript
   // __tests__/AuthContext.test.tsx
   import { renderHook, act } from '@testing-library/react-hooks';
   import { AuthProvider, useAuth } from '../context/AuthContext';
   
   test('login sets user and token', async () => {
     const { result } = renderHook(() => useAuth(), {
       wrapper: AuthProvider
     });
     
     await act(async () => {
       await result.current.login('token123', mockUser);
     });
     
     expect(result.current.user).toEqual(mockUser);
     expect(result.current.token).toBe('token123');
   });
   ```

4. **Linting:**
   ```json
   // .eslintrc.js
   module.exports = {
     extends: ['expo', 'prettier'],
     rules: {
       'no-console': ['warn', { allow: ['warn', 'error'] }],
       '@typescript-eslint/no-explicit-any': 'error'
     }
   };
   ```

5. **Documentation:**
   - JSDoc комментарии для публичных функций
   - README.md с инструкциями по сборке
   - ARCHITECTURE.md (этот документ) в репозитории

### 5.5. Приоритет 5 (UX Enhancements)

1. **Internationalization:**
   ```typescript
   import { useTranslation } from 'react-i18next';
   
   const { t } = useTranslation();
   <Text>{t('welcome.title')}</Text>
   ```

2. **Skeleton loaders:**
   ```typescript
   import ContentLoader, { Rect, Circle } from 'react-content-loader/native';
   
   const DigestSkeleton = () => (
     <ContentLoader>
       <Rect x="0" y="0" rx="8" ry="8" width="100%" height="120" />
     </ContentLoader>
   );
   ```

3. **Haptic feedback:**
   ```typescript
   import * as Haptics from 'expo-haptics';
   
   const handleLike = () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     // ...
   };
   ```

4. **Animated transitions:**
   ```typescript
   import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
   
   <Animated.View entering={FadeIn} exiting={SlideInRight}>
     {/* content */}
   </Animated.View>
   ```

5. **Accessibility:**
   ```typescript
   <TouchableOpacity
     accessibilityRole="button"
     accessibilityLabel="Открыть профиль"
     accessibilityHint="Двойной тап для открытия"
   >
     <Text>Профиль</Text>
   </TouchableOpacity>
   ```

---

## 6. Итоговая оценка

### Сильные стороны ✅

1. **Современный стек:** Expo SDK 54, React 19, TypeScript
2. **Expo Router:** file-based routing упрощает навигацию
3. **Glass morphism UI:** красивый дизайн с BlurView
4. **Context API:** простое состояние без сложных либ
5. **LiveKit integration:** WebRTC видеокомнаты
6. **Shorts:** TikTok-like вертикальные видео
7. **Responsive:** работает на iOS, Android, Web
8. **SecureStore:** правильное хранение токенов

### Критические проблемы 🔴

1. **Хардкод креденшалов:** dev-логин в коде
2. **Hardcoded LiveKit URL:** нельзя сменить без пересборки
3. **HTTP в production:** нет HTTPS
4. **Нет token refresh:** при 401 нет re-auth
5. **localStorage на web:** уязвимость к XSS

### Средние проблемы 🟡

1. **Отсутствие offline mode**
2. **Нет push notifications**
3. **Performance:** можно оптимизировать с React Query
4. **Code duplication:** ModalFeedItem дублируется
5. **Type safety:** много `as any`

### Рекомендации по приоритетам

**Неделя 1 (Critical):**
- Переменные окружения (API_URL, LIVEKIT_URL)
- Удалить dev-логин из production
- Token refresh mechanism
- HTTPS для production

**Неделя 2-3 (Performance):**
- React Query для API кэширования
- expo-image для оптимизации
- Video prefetch для Shorts
- Refactoring дублированного кода

**Неделя 4-6 (Features):**
- Push notifications
- Offline support
- Deep linking
- Analytics + Sentry

**Месяц 2 (Quality):**
- Testing (Jest + RNTL)
- Internationalization
- Accessibility
- Documentation

---

## 7. Заключение

Приложение **Horizon mobile.app** представляет собой полнофункциональный мобильный клиент для социальной платформы знаний. Архитектура построена на современных технологиях (Expo, React Native, TypeScript), что обеспечивает хорошую базу для дальнейшего развития.

**Основные достижения:**
- Реализованы все ключевые фичи: лента, сферы, мессенджер, видеокомнаты, Shorts
- Красивый UI/UX с glass morphism дизайном
- Кроссплатформенность (iOS, Android, Web)

**Необходимые улучшения:**
- Устранение критических security issues (хардкод, HTTP, токены)
- Оптимизация performance (кэширование, lazy loading)
- Добавление push notifications и offline support
- Улучшение code quality (тесты, TypeScript strict mode)

При устранении критических проблем и внедрении рекомендаций приложение будет готово к production deployment.

**Оценка готовности к production:** 70/100
- **Security:** 60/100 (критические проблемы с креденшалами)
- **Performance:** 75/100 (можно оптимизировать)
- **Features:** 85/100 (почти все реализовано)
- **Code Quality:** 70/100 (нужны тесты и рефакторинг)
- **UX:** 80/100 (хороший дизайн, но нет offline/i18n)

---

**Автор анализа:** Claude Opus 5.5  
**Дата:** 2026-09-30
