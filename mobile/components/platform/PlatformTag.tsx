import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, radius, spacing } from '@/constants/Theme';

type PlatformTagProps = {
  children: React.ReactNode;
};

export function PlatformTag({ children }: PlatformTagProps) {
  const colors = useThemeColors() ?? darkColors;

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: colors.bgAccent ?? colors.borderSubtle,
          borderColor: colors.borderSubtle,
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: 40,
        },
      ]}>
      <Text style={[styles.text, { color: colors.studioMetaColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
