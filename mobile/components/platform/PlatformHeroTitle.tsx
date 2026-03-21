import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

type PlatformHeroTitleProps = {
  children: React.ReactNode;
  /** Optional: use gradient (requires MaskedView + LinearGradient). When false, uses solid textPrimary. */
  gradient?: boolean;
};

export function PlatformHeroTitle({ children, gradient }: PlatformHeroTitleProps) {
  const colors = useThemeColors() ?? darkColors;
  const { width } = useWindowDimensions();
  const fontSize = width < 768 ? 28 : Math.min(32, 20 + width * 0.02);

  const textColor = colors.textPrimary;

  const textStyle = [
    styles.title,
    {
      fontSize,
    },
  ];

  if (gradient) {
    return (
      <MaskedView
        maskElement={<Text style={[textStyle, { color: 'black' }]}>{children}</Text>}
      >
        <LinearGradient
          colors={colors.studioTitleGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[textStyle, { opacity: 0 }]}>{children}</Text>
        </LinearGradient>
      </MaskedView>
    );
  }

  return (
    <Text style={[textStyle, { color: textColor }]} numberOfLines={3}>
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
