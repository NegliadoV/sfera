import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/components/useThemeColors';
import { darkColors } from '@/constants/Theme';

type LoadingScreenProps = {
  /** Если true, фон принудительно тёмный */
  forceDark?: boolean;
};

export function LoadingScreen({ forceDark }: LoadingScreenProps) {
  const colors = useThemeColors();
  const c = colors ?? darkColors;
  const bg = forceDark ? darkColors.bgPrimary : c.bgPrimary;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );
}
