import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';
import { fetchMessagesBadge } from '@/lib/messagesApi';

export default function TabLayout() {
  const colors = useThemeColors() ?? darkColors;
  const insets = useSafeAreaInsets();
  const [messagesBadge, setMessagesBadge] = useState(0);

  useEffect(() => {
    fetchMessagesBadge().then((r) => setMessagesBadge(r.total ?? 0));
    const t = setInterval(() => fetchMessagesBadge().then((r) => setMessagesBadge(r.total ?? 0)), 30000);
    return () => clearInterval(t);
  }, []);

  const tabBarPaddingBottom = Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 12) + 20;

  return (
    <Tabs
      initialRouteName="messages"
      screenOptions={{
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220 },
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopWidth: 1,
          borderTopColor: colors.studioPanelBorder ?? colors.borderSubtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 8,
          paddingTop: 10,
          paddingBottom: tabBarPaddingBottom,
          height: 60 + tabBarPaddingBottom,
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.bgPrimary,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        },
        headerTintColor: colors.textPrimary,
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Чаты',
          tabBarBadge: messagesBadge > 0 ? messagesBadge : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="universes"
        options={{
          title: 'Пространства',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'planet' : 'planet-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
