import { StyleSheet, Text } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type PlatformHeroDescProps = {
  children: React.ReactNode;
};

export function PlatformHeroDesc({ children }: PlatformHeroDescProps) {
  const colors = useThemeColors() ?? darkColors;

  return (
    <Text style={[styles.desc, { color: colors.studioMetaColor }]} numberOfLines={4}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  desc: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 24,
  },
});
