import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Globe, User, Settings, Play } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, tabBarTokens } from '@/constants/Theme';
import { AnimatedTabBar } from '@/components/navigation';

const TAB_CONFIG = [
  { name: 'messages', title: 'Чаты', Icon: MessageCircle },
  { name: 'universes', title: 'Пространства', Icon: Globe },
  { name: 'shorts', title: 'Шортсы', Icon: Play },
  { name: 'me', title: 'Профиль', Icon: User },
  { name: 'settings', title: 'Настройки', Icon: Settings },
] as const;

function createTabIcon(Icon: React.ComponentType<{ color: string; size?: number; strokeWidth?: number }>, focused: boolean, colors: typeof darkColors) {
  const iconColor = focused ? colors.accent : 'rgba(255,255,255,0.4)';
  return <Icon color={iconColor} size={tabBarTokens.iconSize} strokeWidth={tabBarTokens.iconStrokeWidth} />;
}

export default function TabLayout() {
  const colors = useThemeColors() ?? darkColors;
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Platform.OS === 'web'
    ? 0
    : Math.max(insets.bottom, 12) + tabBarTokens.webPaddingBottom;

  return (
    <Tabs
      initialRouteName="messages"
      tabBar={(props: any) => (
        <AnimatedTabBar {...props} tabBarPaddingBottom={tabBarPaddingBottom} />
      )}
      screenOptions={{
        sceneStyle: { backgroundColor: 'transparent', flex: 1 },
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220 },
        },
        tabBarShowLabel: false,
        tabBarBackground: () => null,
        tabBarStyle: {
          position: 'absolute',
          left: tabBarTokens.marginHorizontal,
          right: tabBarTokens.marginHorizontal,
          bottom: Platform.OS === 'web' ? 24 : insets.bottom + 24,
          height: tabBarTokens.rowHeight,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
          paddingTop: 0,
          borderRadius: 999,
          overflow: 'hidden',
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerBackground: () => <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />,
        headerTintColor: colors.textPrimary,
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      {TAB_CONFIG.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => createTabIcon(Icon, focused, colors),
          }}
        />
      ))}
    </Tabs>
  );
}
