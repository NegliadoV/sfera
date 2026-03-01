import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type PlatformHeroTitleProps = {
  children: React.ReactNode;
  /** Optional: use gradient (requires MaskedView + LinearGradient). When false, uses solid textPrimary. */
  gradient?: boolean;
};

export function PlatformHeroTitle({ children, gradient }: PlatformHeroTitleProps) {
  const colors = useThemeColors() ?? darkColors;
  const { width } = useWindowDimensions();
  const fontSize = width < 768 ? 28 : Math.min(32, 20 + width * 0.02);

  // Gradient text requires expo-linear-gradient + MaskedView; for now use solid color from gradient start
  const textColor = gradient ? colors.studioTitleGradientColors[0] : colors.textPrimary;

  return (
    <Text
      style={[
        styles.title,
        {
          color: textColor,
          fontSize,
        },
      ]}
      numberOfLines={3}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 1.2,
    marginBottom: 12,
  },
});
