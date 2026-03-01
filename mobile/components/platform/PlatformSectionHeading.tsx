import { StyleSheet, Text } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, spacing } from '@/constants/Theme';

type PlatformSectionHeadingProps = {
  children: React.ReactNode;
};

export function PlatformSectionHeading({ children }: PlatformSectionHeadingProps) {
  const colors = useThemeColors() ?? darkColors;

  return (
    <Text style={[styles.heading, { color: colors.studioMetaColor }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
});
