import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tabBarTokens } from '@/constants/Theme';

interface TabIconWrapProps {
  focused: boolean;
  children: React.ReactNode;
}

/** Обёртка: неон + scale-анимация для активной иконки таб-бара */
export function TabIconWrap({ focused, children }: TabIconWrapProps) {
  const scale = useSharedValue(focused ? 1.08 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, tabBarTokens.springConfig);
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 180 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const content = focused ? (
    <View style={styles.neonOnly}>{children}</View>
  ) : (
    children
  );
  return <Animated.View style={[styles.iconWrap, animatedStyle]}>{content}</Animated.View>;
}

const styles = StyleSheet.create({
  neonOnly: {
    backgroundColor: 'transparent',
    padding: 0,
    margin: 0,
    overflow: 'visible',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
});
