import { View, Text } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors, screenLayout, typography } from '@/constants/Theme';

type EmptyStateProps = {
  message: string;
  /** Тёмный фон — использовать светлый текст */
  forceDark?: boolean;
};

export function EmptyState({ message, forceDark }: EmptyStateProps) {
  const colors = useThemeColors();
  const c = forceDark ? darkColors : (colors ?? darkColors);
  return (
    <View style={screenLayout.empty}>
      <Text style={[typography.body, { color: c.textMuted }]}>{message}</Text>
    </View>
  );
}
