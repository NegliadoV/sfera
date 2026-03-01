import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, radius, spacing } from '@/constants/Theme';

type PlatformButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
};

export function PlatformButton({ children, onPress, disabled, small }: PlatformButtonProps) {
  const colors = useThemeColors() ?? darkColors;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: colors.bgAccent ?? colors.hoverColor,
          borderColor: colors.border,
          paddingVertical: small ? 8 : 14,
          paddingHorizontal: small ? 18 : 28,
          borderRadius: small ? 40 : 50,
        },
      ]}>
      <Text style={[styles.text, { color: colors.textPrimary }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});
