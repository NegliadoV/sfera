import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

export function AppBackground() {
  const { width, height } = useWindowDimensions();
  const colors = useThemeColors() ?? darkColors;
  
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(
      withSequence(
        withTiming(width * 0.2, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.1, { duration: 13000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );

    blob2X.value = withRepeat(
      withSequence(
        withTiming(-width * 0.3, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.1, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(-height * 0.2, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 14000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, [width, height, blob1X, blob1Y, blob2X, blob2Y]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.1,
    width: width * 1.5,
    height: width * 1.5,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.1,
    width: width * 1.6,
    height: width * 1.6,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary, overflow: 'hidden' }]}>
      <Animated.View style={animatedStyle1} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.45" />
              <Stop offset="70%" stopColor={colors.accent} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad1)" />
        </Svg>
      </Animated.View>

      <Animated.View style={animatedStyle2} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="grad2" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#a855f7" stopOpacity="0.30" />
              <Stop offset="70%" stopColor="#a855f7" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad2)" />
        </Svg>
      </Animated.View>

      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
    </View>
  );
}

const styles = StyleSheet.create({});
