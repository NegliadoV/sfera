import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, mobileLayout, shadows } from '@/constants/Theme';

type PlatformCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Compact padding on small screens (e.g. 20,16) */
  compact?: boolean;
  /** Принудительно тёмные фон и граница (для экранов вроде «Сборка») */
  forceDark?: boolean;
  /** Подсветка в стиле веба: граница studio-card + неоновый glow */
  neon?: boolean;
};

export function PlatformCard({ children, style, compact, forceDark, neon = true }: PlatformCardProps) {
  const themeColors = useThemeColors();
  const colors = forceDark ? darkColors : (themeColors ?? darkColors);
  const cardRadius = compact ? mobileLayout.cardRadius : 32;
  const paddingVertical = compact ? mobileLayout.cardPaddingVertical : 28;
  const paddingHorizontal = compact ? mobileLayout.cardPaddingHorizontal : 32;
  const borderColor = neon ? (colors.studioCardBorder ?? darkColors.studioCardBorder) : (colors.studioPanelBorder ?? darkColors.studioPanelBorder);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.studioPanelBg ?? darkColors.studioPanelBg,
      borderColor,
      borderRadius: cardRadius,
      paddingVertical,
      paddingHorizontal,
      borderWidth: 1,
      ...shadows.card,
      ...(compact ? { minHeight: mobileLayout.minTouchTarget } : {}),
    },
    Platform.OS === 'web' && neon
      ? { boxShadow: `0 20px 40px -15px rgba(0,0,0,0.4), 0 0 20px ${(colors.accent ?? darkColors.accent)}2e, 0 0 40px ${(colors.accent ?? darkColors.accent)}14` as const }
      : null,
    style,
  ].filter(Boolean) as ViewStyle[];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
