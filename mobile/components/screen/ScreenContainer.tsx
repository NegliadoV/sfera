import { View, type ViewProps } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type ScreenContainerProps = ViewProps & {};

export function ScreenContainer({ style, ...props }: ScreenContainerProps) {
  const colors = useThemeColors();
  const c = colors ?? darkColors;
  // Прозрачный фон — градиент как в мобильной веб-версии Сферы идёт из корневого _layout
  const bg = 'transparent';
  return <View style={[{ flex: 1, backgroundColor: bg }, style]} {...props} />;
}
