import { View, type ViewProps } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type ScreenContainerProps = ViewProps & {
  /** Если true, фон принудительно тёмный (для экранов, где не должна налезать светлая тема) */
  forceDark?: boolean;
};

export function ScreenContainer({ style, forceDark, ...props }: ScreenContainerProps) {
  const colors = useThemeColors();
  const c = colors ?? darkColors;
  // Прозрачный фон — градиент как в мобильной веб-версии Сферы идёт из корневого _layout
  const bg = forceDark ? darkColors.bgPrimary : 'transparent';
  return <View style={[{ flex: 1, backgroundColor: bg }, style]} {...props} />;
}
