import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, tabBarTokens, shadows } from '@/constants/Theme';

export interface AnimatedTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { tabBarIcon?: (p: { color: string; size: number; focused: boolean }) => React.ReactNode; tabBarBadge?: number } }>;
  navigation: { emit: (e: { type: string; target: string }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
  tabBarPaddingBottom: number;
}

export function AnimatedTabBar({ state, descriptors, navigation, tabBarPaddingBottom }: AnimatedTabBarProps) {
  const colors = useThemeColors() ?? darkColors;
  const visibleRoutes = state.routes.filter((r) => r.name !== 'index');

  return (
    <BlurView
      intensity={60}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.root,
        {
          height: tabBarTokens.rowHeight + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingHorizontal: 24,
          backgroundColor: colors.studioPanelBg,
          ...(Platform.OS === 'web' && { background: 'transparent' } as any),
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.studioPanelBorder,
          ...shadows.card,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = options.tabBarIcon?.({ color: colors.accent, size: tabBarTokens.iconSize, focused: isFocused });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              android_ripple={null}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              {icon}
            </Pressable>
          );
        })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    minHeight: 52,
    gap: 8,
  },
  item: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 52,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  itemPressed: {
    backgroundColor: 'transparent',
    opacity: 0.8,
  },
});
