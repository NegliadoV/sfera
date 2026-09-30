# 📱 React Native App Setup Guide

Пошаговая инструкция для создания мобильного приложения Roominate на React Native (Expo).

---

## 🚀 Быстрый старт

### 1. Создание проекта

```bash
npx create-expo-app@latest roominate-mobile
cd roominate-mobile
```

### 2. Установка зависимостей

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# State & Data
npm install axios swr zustand
npm install @tanstack/react-query

# Real-time
npm install socket.io-client
npm install @livekit/react-native @livekit/react-native-webrtc

# UI Components
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install @shopify/flash-list
npm install react-native-svg

# Storage
npm install expo-secure-store
npm install @react-native-async-storage/async-storage

# Media
npm install expo-image-picker
npm install expo-av
npm install react-native-video

# Push Notifications
npm install expo-notifications
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging

# Auth (OAuth)
npm install expo-auth-session
npm install expo-web-browser

# Utils
npm install date-fns
npm install react-native-markdown-display
```

---

## 📁 Структура проекта

```
roominate-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── explore.tsx
│   │   ├── feed.tsx
│   │   ├── rooms.tsx
│   │   ├── messages.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   ├── universe/[slug].tsx
│   ├── post/[id].tsx
│   ├── room/[id].tsx
│   └── _layout.tsx
├── components/
│   ├── PostCard.tsx
│   ├── CommentList.tsx
│   ├── ResonanceBar.tsx
│   └── ...
├── lib/
│   ├── api.ts             # API client
│   ├── socket.ts          # WebSocket client
│   ├── auth.ts            # Auth helpers
│   └── storage.ts         # Secure storage
├── hooks/
│   ├── useAuth.ts
│   ├── useFeed.ts
│   └── useSocket.ts
├── store/
│   └── authStore.ts       # Zustand store
├── types/
│   └── api.ts             # TypeScript types
└── constants/
    └── config.ts          # API URLs
```

---

## 🔐 Аутентификация

### `lib/api.ts`

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://roominate.rest/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки 401 (logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `lib/auth.ts`

```typescript
import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
    crystals: number;
  };
  token: string;
  expiresIn: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/mobile/login', {
      email,
      password,
    });
    
    await SecureStore.setItemAsync('jwt_token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    
    return data;
  },

  async register(email: string, password: string, name: string) {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    
    await SecureStore.setItemAsync('jwt_token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    
    return data;
  },

  async logout() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user');
  },

  async getCurrentUser() {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
```

---

## 🌐 API Интеграция

### `hooks/useFeed.ts`

```typescript
import useSWR from 'swr';
import api from '@/lib/api';

export interface Post {
  id: string;
  title: string;
  body: string;
  authorName: string;
  authorImage: string;
  commentCount: number;
  savesCount: number;
  createdAt: string;
}

export function useFeed(universeId: string, sortBy: string = 'newest') {
  const { data, error, mutate, isLoading } = useSWR<Post[]>(
    `/content?universeId=${universeId}&sortBy=${sortBy}&limit=20`,
    async (url) => {
      const { data } = await api.get(url);
      return data;
    },
    {
      refreshInterval: 30000, // Обновлять каждые 30 сек
      revalidateOnFocus: true,
    }
  );

  return {
    posts: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
```

### `components/PostCard.tsx`

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Post } from '@/hooks/useFeed';

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <View style={styles.header}>
        <Image source={{ uri: post.authorImage }} style={styles.avatar} />
        <View>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.timestamp}>
            {new Date(post.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      {post.body && (
        <Text style={styles.body} numberOfLines={3}>
          {post.body}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.stat}>💬 {post.commentCount}</Text>
        <Text style={styles.stat}>📌 {post.savesCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  stat: {
    color: '#888',
    fontSize: 13,
  },
});
```

---

## 🔌 WebSocket (Real-time)

### `lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

let socket: Socket | null = null;

export async function connectSocket() {
  const token = await SecureStore.getItemAsync('jwt_token');
  
  socket = io('wss://roominate.rest:3002', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

### `hooks/useSocket.ts`

```typescript
import { useEffect, useState } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '@/lib/socket';

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectSocket().then((socket) => {
      setConnected(true);

      socket.on('disconnect', () => setConnected(false));
      socket.on('connect', () => setConnected(true));
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return { socket: getSocket(), connected };
}

// Listen for new messages
export function useSocketMessages(callback: (message: any) => void) {
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('new-message', callback);
      return () => {
        socket.off('new-message', callback);
      };
    }
  }, [socket, callback]);
}
```

---

## 🎙️ LiveKit (Voice Rooms)

### `lib/livekit.ts`

```typescript
import api from './api';

export async function getRoomToken(roomName: string, userName: string) {
  const { data } = await api.post('/spaces/permissions', {
    roomName,
    participantName: userName,
  });
  
  return data; // { token, url }
}
```

### `app/room/[id].tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LiveKitRoom } from '@livekit/react-native';
import { getRoomToken } from '@/lib/livekit';
import { authService } from '@/lib/auth';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      const user = await authService.getCurrentUser();
      const { token, url } = await getRoomToken(id, user.name);
      setToken(token);
      setUrl(url);
    }

    fetchToken();
  }, [id]);

  if (!token || !url) {
    return <ActivityIndicator />;
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={true}
      video={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 24 }}>🎙️ Voice Room</Text>
      </View>
    </LiveKitRoom>
  );
}
```

---

## 🔔 Push Notifications

### `lib/notifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications работают только на физических устройствах');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notifications не разрешены');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Отправить токен на сервер
  await api.post('/push/subscribe', {
    token,
    platform: Platform.OS,
  });

  console.log('✅ Push token registered:', token);

  return token;
}
```

### `app/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return <Slot />;
}
```

---

## 🎨 Темизация (Dark/Light Mode)

### `constants/colors.ts`

```typescript
export const Colors = {
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    primary: '#2563eb',
    text: '#000000',
    textSecondary: '#666666',
  },
  dark: {
    background: '#090a0f',
    surface: '#0f1320',
    primary: '#3b82f6',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
  },
};
```

### `hooks/useTheme.ts`

```typescript
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return { colors, isDark };
}
```

---

## 🚀 Запуск приложения

### Development

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device (scan QR code)
npx expo start

# Web (для тестирования)
npx expo start --web
```

### Production Build

#### iOS (через EAS Build)

```bash
# Установить EAS CLI
npm install -g eas-cli

# Login
eas login

# Конфигурация
eas build:configure

# Build для App Store
eas build --platform ios --profile production
```

#### Android (через EAS Build)

```bash
# Build для Google Play
eas build --platform android --profile production
```

---

## 📝 app.json (Expo Config)

```json
{
  "expo": {
    "name": "Roominate",
    "slug": "roominate-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#090a0f"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "rest.roominate.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Roominate нужен доступ к камере для загрузки фото и видео",
        "NSMicrophoneUsageDescription": "Roominate нужен доступ к микрофону для голосовых комнат",
        "NSPhotoLibraryUsageDescription": "Roominate нужен доступ к галерее для загрузки фото"
      }
    },
    "android": {
      "package": "rest.roominate.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#090a0f"
      },
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "@livekit/react-native"
    ],
    "scheme": "roominate"
  }
}
```

---

## 🧪 Testing

### Unit Tests (Jest)

```bash
npm install --save-dev jest @testing-library/react-native
```

### E2E Tests (Detox)

```bash
npm install --save-dev detox
```

---

## 📚 Дополнительные ресурсы

- **Expo Docs:** https://docs.expo.dev
- **React Navigation:** https://reactnavigation.org
- **LiveKit Docs:** https://docs.livekit.io
- **Roominate API:** См. `MOBILE_API.md`

---

**Версия:** 1.0.0  
**Последнее обновление:** 2026-09-30
