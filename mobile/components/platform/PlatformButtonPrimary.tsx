import { Platform, StyleSheet, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, shadows } from '@/constants/Theme';

type PlatformButtonPrimaryProps = {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function PlatformButtonPrimary({ children, onPress, disabled, loading }: PlatformButtonPrimaryProps) {
  const colors = useThemeColors() ?? darkColors;
  const accent = colors.accent ?? darkColors.accent;

  const shadowStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({ boxShadow: `0 2px 12px ${accent}73, 0 0 14px ${accent}40` } as ViewStyle)
      : { ...shadows.neonGlow(accent) };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: accent,
          borderColor: colors.accentMuted ?? `${accent}b3`,
          borderWidth: 1,
          ...shadowStyle,
        },
      ]}>
      <Text style={styles.text}>{loading ? '…' : children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    borderWidth: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
