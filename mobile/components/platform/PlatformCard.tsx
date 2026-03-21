import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, shadows } from '@/constants/Theme';

type PlatformCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Compact padding on small screens (e.g. 20,16) */
  compact?: boolean;
  /** Подсветка в стиле веба: граница studio-card + неоновый glow */
  neon?: boolean;
};

import { BlurView } from 'expo-blur';

export function PlatformCard({ children, style, compact, neon = true }: PlatformCardProps) {
  const colors = useThemeColors() ?? darkColors;
  const cardRadius = compact ? mobileLayout.cardRadius : 32;
  const paddingVertical = compact ? mobileLayout.cardPaddingVertical : 28;
  const paddingHorizontal = compact ? mobileLayout.cardPaddingHorizontal : 32;
  const borderColor = neon ? colors.studioCardBorder : colors.studioPanelBorder;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.studioPanelBg,
      borderColor,
      borderRadius: cardRadius,
      paddingVertical,
      paddingHorizontal,
      borderWidth: 1,
      ...shadows.card,
      ...(compact ? { minHeight: mobileLayout.minTouchTarget } : {}),
    },
    Platform.OS === 'web' && neon
      ? { boxShadow: `0 20px 40px -15px rgba(0,0,0,0.4), 0 0 20px ${colors.accent}2e, 0 0 40px ${colors.accent}14` as const }
      : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <BlurView intensity={60} tint="dark" style={cardStyle} experimentalBlurMethod="dimezisBlurView">
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
