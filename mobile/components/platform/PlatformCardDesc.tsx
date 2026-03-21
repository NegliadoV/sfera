import { StyleSheet, Text } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type PlatformCardDescProps = {
  children: React.ReactNode;
};

export function PlatformCardDesc({ children }: PlatformCardDescProps) {
  const themeColors = useThemeColors();
  const colors = themeColors;
  const color = colors?.studioMetaColor ?? darkColors.studioMetaColor;

  return <Text style={[styles.desc, { color }]}>{children ?? ''}</Text>;
}

const styles = StyleSheet.create({
  desc: {
    fontSize: 15,
    lineHeight: 22,
  },
});
